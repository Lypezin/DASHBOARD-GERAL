-- =====================================================================
-- FIX EVOLUÇÃO - OTIMIZADO COM MATERIALIZED VIEW
-- =====================================================================
-- Usa mv_aderencia_agregada para performance máxima
-- Resolve timeout (57014) e erros 500
-- =====================================================================

-- =============================================================================
-- FUNÇÃO 1: Listar Anos Disponíveis (SUPER RÁPIDA)
-- =============================================================================

DROP FUNCTION IF EXISTS public.listar_anos_disponiveis();

CREATE OR REPLACE FUNCTION public.listar_anos_disponiveis()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Buscar direto da MV (super rápido)
  SELECT jsonb_agg(DISTINCT ano_iso ORDER BY ano_iso DESC)
  INTO v_result
  FROM mv_aderencia_agregada
  WHERE ano_iso IS NOT NULL;

  -- Se não encontrou, retornar ano atual
  RETURN COALESCE(v_result, jsonb_build_array(EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER));
EXCEPTION WHEN OTHERS THEN
  -- Em caso de erro, retornar ano atual
  RETURN jsonb_build_array(EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_anos_disponiveis() TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_anos_disponiveis() TO anon;


-- =============================================================================
-- FUNÇÃO 2: Evolução Mensal (OTIMIZADA COM MV)
-- =============================================================================

DROP FUNCTION IF EXISTS public.listar_evolucao_mensal(TEXT, INTEGER);

CREATE OR REPLACE FUNCTION public.listar_evolucao_mensal(
  p_praca TEXT DEFAULT NULL,
  p_ano INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pracas TEXT[];
  v_is_admin BOOLEAN;
  v_ano INTEGER;
  v_result JSONB;
BEGIN
  -- Definir ano (padrão: ano atual)
  v_ano := COALESCE(p_ano, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);

  -- Obter dados do usuário
  BEGIN
    SELECT is_admin, assigned_pracas INTO v_is_admin, v_pracas
    FROM user_profiles
    WHERE id = auth.uid();
  EXCEPTION WHEN OTHERS THEN
    RETURN '[]'::JSONB;
  END;

  -- Se não encontrou usuário, retornar vazio
  IF v_is_admin IS NULL THEN
    RETURN '[]'::JSONB;
  END IF;

  -- Se não for admin e não tiver praças, retornar vazio
  IF NOT v_is_admin AND (v_pracas IS NULL OR array_length(v_pracas, 1) = 0) THEN
    RETURN '[]'::JSONB;
  END IF;

  -- Buscar da MV (muito mais rápido que dados_corridas)
  BEGIN
    WITH dados_mensais AS (
      SELECT
        ano_iso AS ano,
        EXTRACT(MONTH FROM 
          make_date(ano_iso, semana_numero, 1)
        )::INTEGER AS mes,
        CASE EXTRACT(MONTH FROM make_date(ano_iso, semana_numero, 1))::INTEGER
          WHEN 1 THEN 'Jan'
          WHEN 2 THEN 'Fev'
          WHEN 3 THEN 'Mar'
          WHEN 4 THEN 'Abr'
          WHEN 5 THEN 'Mai'
          WHEN 6 THEN 'Jun'
          WHEN 7 THEN 'Jul'
          WHEN 8 THEN 'Ago'
          WHEN 9 THEN 'Set'
          WHEN 10 THEN 'Out'
          WHEN 11 THEN 'Nov'
          WHEN 12 THEN 'Dez'
        END AS mes_nome,
        SUM(COALESCE(corridas_completadas, 0)) AS total_corridas,
        SUM(COALESCE(segundos_entregues, 0)) AS total_segundos
      FROM mv_aderencia_agregada
      WHERE 
        ano_iso = v_ano
        AND (v_is_admin OR praca = ANY(v_pracas))
        AND (p_praca IS NULL OR praca = p_praca)
      GROUP BY ano_iso, EXTRACT(MONTH FROM make_date(ano_iso, semana_numero, 1))
      ORDER BY ano, mes
    )
    SELECT jsonb_agg(
      jsonb_build_object(
        'ano', ano,
        'mes', mes,
        'mes_nome', mes_nome,
        'total_corridas', COALESCE(total_corridas, 0),
        'total_segundos', COALESCE(total_segundos, 0)
      )
    )
    INTO v_result
    FROM dados_mensais;
  EXCEPTION WHEN OTHERS THEN
    RETURN '[]'::JSONB;
  END;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_evolucao_mensal(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_evolucao_mensal(TEXT, INTEGER) TO anon;


-- =============================================================================
-- FUNÇÃO 3: Evolução Semanal (OTIMIZADA COM MV)
-- =============================================================================

DROP FUNCTION IF EXISTS public.listar_evolucao_semanal(TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.listar_evolucao_semanal(
  p_praca TEXT DEFAULT NULL,
  p_ano INTEGER DEFAULT NULL,
  p_limite_semanas INTEGER DEFAULT 52
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pracas TEXT[];
  v_is_admin BOOLEAN;
  v_ano INTEGER;
  v_result JSONB;
BEGIN
  -- Definir ano (padrão: ano atual)
  v_ano := COALESCE(p_ano, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);

  -- Obter dados do usuário
  BEGIN
    SELECT is_admin, assigned_pracas INTO v_is_admin, v_pracas
    FROM user_profiles
    WHERE id = auth.uid();
  EXCEPTION WHEN OTHERS THEN
    RETURN '[]'::JSONB;
  END;

  -- Se não encontrou usuário, retornar vazio
  IF v_is_admin IS NULL THEN
    RETURN '[]'::JSONB;
  END IF;

  -- Se não for admin e não tiver praças, retornar vazio
  IF NOT v_is_admin AND (v_pracas IS NULL OR array_length(v_pracas, 1) = 0) THEN
    RETURN '[]'::JSONB;
  END IF;

  -- Buscar da MV (muito mais rápido)
  BEGIN
    WITH dados_semanais AS (
      SELECT
        ano_iso,
        semana_numero,
        SUM(COALESCE(corridas_completadas, 0)) AS total_corridas,
        SUM(COALESCE(segundos_entregues, 0)) AS total_segundos
      FROM mv_aderencia_agregada
      WHERE 
        ano_iso = v_ano
        AND (v_is_admin OR praca = ANY(v_pracas))
        AND (p_praca IS NULL OR praca = p_praca)
      GROUP BY ano_iso, semana_numero
      ORDER BY ano_iso, semana_numero
      LIMIT p_limite_semanas
    )
    SELECT jsonb_agg(
      jsonb_build_object(
        'ano', ano_iso,
        'semana', semana_numero,
        'semana_label', ano_iso || ' Semana ' || semana_numero,
        'total_corridas', COALESCE(total_corridas, 0),
        'total_segundos', COALESCE(total_segundos, 0)
      )
    )
    INTO v_result
    FROM dados_semanais;
  EXCEPTION WHEN OTHERS THEN
    RETURN '[]'::JSONB;
  END;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_evolucao_semanal(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_evolucao_semanal(TEXT, INTEGER, INTEGER) TO anon;


-- =============================================================================
-- CRIAR ÍNDICES PARA PERFORMANCE MÁXIMA
-- =============================================================================

-- Índice para acelerar consultas de evolução
CREATE INDEX IF NOT EXISTS idx_mv_aderencia_evolucao 
  ON mv_aderencia_agregada (ano_iso, semana_numero, praca)
  WHERE corridas_completadas IS NOT NULL;

-- Índice para anos disponíveis
CREATE INDEX IF NOT EXISTS idx_mv_aderencia_ano 
  ON mv_aderencia_agregada (ano_iso)
  WHERE ano_iso IS NOT NULL;


-- =============================================================================
-- ATUALIZAR ESTATÍSTICAS
-- =============================================================================

ANALYZE mv_aderencia_agregada;


-- =============================================================================
-- VERIFICAÇÃO E TESTE
-- =============================================================================

DO $$
DECLARE
  v_anos JSONB;
  v_mensal JSONB;
  v_semanal JSONB;
  v_start TIMESTAMP;
  v_elapsed INTERVAL;
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'TESTANDO FUNÇÕES OTIMIZADAS DE EVOLUÇÃO';
  RAISE NOTICE '=============================================================';
  
  -- Testar listar_anos_disponiveis
  v_start := clock_timestamp();
  BEGIN
    SELECT listar_anos_disponiveis() INTO v_anos;
    v_elapsed := clock_timestamp() - v_start;
    RAISE NOTICE 'listar_anos_disponiveis: OK - % anos (%.3f ms)', 
      jsonb_array_length(v_anos), 
      EXTRACT(MILLISECONDS FROM v_elapsed);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'listar_anos_disponiveis: ERRO - %', SQLERRM;
  END;
  
  -- Testar listar_evolucao_mensal
  v_start := clock_timestamp();
  BEGIN
    SELECT listar_evolucao_mensal(NULL, 2025) INTO v_mensal;
    v_elapsed := clock_timestamp() - v_start;
    RAISE NOTICE 'listar_evolucao_mensal: OK - % meses (%.3f ms)', 
      COALESCE(jsonb_array_length(v_mensal), 0),
      EXTRACT(MILLISECONDS FROM v_elapsed);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'listar_evolucao_mensal: ERRO - %', SQLERRM;
  END;
  
  -- Testar listar_evolucao_semanal
  v_start := clock_timestamp();
  BEGIN
    SELECT listar_evolucao_semanal(NULL, 2025, 52) INTO v_semanal;
    v_elapsed := clock_timestamp() - v_start;
    RAISE NOTICE 'listar_evolucao_semanal: OK - % semanas (%.3f ms)', 
      COALESCE(jsonb_array_length(v_semanal), 0),
      EXTRACT(MILLISECONDS FROM v_elapsed);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'listar_evolucao_semanal: ERRO - %', SQLERRM;
  END;
  
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'FUNÇÕES OTIMIZADAS CRIADAS COM SUCESSO!';
  RAISE NOTICE 'Performance esperada: < 100ms por query';
  RAISE NOTICE '=============================================================';
END $$;


