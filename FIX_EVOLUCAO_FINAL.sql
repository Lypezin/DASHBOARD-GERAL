-- =====================================================================
-- FIX EVOLUÇÃO FINAL - USA dados_corridas COM NOMES CORRETOS
-- =====================================================================
-- Resolve erro de coluna inexistente
-- Otimizado com índices e COALESCE
-- =====================================================================

-- =============================================================================
-- FUNÇÃO 1: Listar Anos Disponíveis (SIMPLES E RÁPIDA)
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
  -- Buscar anos distintos
  SELECT jsonb_agg(DISTINCT ano_iso ORDER BY ano_iso DESC)
  INTO v_result
  FROM dados_corridas
  WHERE ano_iso IS NOT NULL;

  -- Se não encontrou, retornar ano atual
  RETURN COALESCE(v_result, jsonb_build_array(EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER));
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_array(EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_anos_disponiveis() TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_anos_disponiveis() TO anon;


-- =============================================================================
-- FUNÇÃO 2: Evolução Mensal (CORRIGIDA - USA dados_corridas)
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

  -- Validações
  IF v_is_admin IS NULL THEN
    RETURN '[]'::JSONB;
  END IF;

  IF NOT v_is_admin AND (v_pracas IS NULL OR array_length(v_pracas, 1) = 0) THEN
    RETURN '[]'::JSONB;
  END IF;

  -- Buscar dados agregados por mês
  BEGIN
    WITH dados_mensais AS (
      SELECT
        EXTRACT(YEAR FROM data_do_periodo)::INTEGER AS ano,
        EXTRACT(MONTH FROM data_do_periodo)::INTEGER AS mes,
        CASE EXTRACT(MONTH FROM data_do_periodo)::INTEGER
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
        SUM(COALESCE(numero_de_corridas_completadas, 0))::BIGINT AS total_corridas,
        SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0))::BIGINT AS total_segundos
      FROM dados_corridas
      WHERE 
        EXTRACT(YEAR FROM data_do_periodo) = v_ano
        AND (v_is_admin OR praca = ANY(v_pracas))
        AND (p_praca IS NULL OR praca = p_praca)
        AND data_do_periodo IS NOT NULL
      GROUP BY 
        EXTRACT(YEAR FROM data_do_periodo),
        EXTRACT(MONTH FROM data_do_periodo)
      ORDER BY ano, mes
    )
    SELECT jsonb_agg(
      jsonb_build_object(
        'ano', ano,
        'mes', mes,
        'mes_nome', mes_nome,
        'total_corridas', total_corridas,
        'total_segundos', total_segundos
      )
    )
    INTO v_result
    FROM dados_mensais;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erro em listar_evolucao_mensal: %', SQLERRM;
    RETURN '[]'::JSONB;
  END;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_evolucao_mensal(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_evolucao_mensal(TEXT, INTEGER) TO anon;


-- =============================================================================
-- FUNÇÃO 3: Evolução Semanal (CORRIGIDA - USA dados_corridas)
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

  -- Validações
  IF v_is_admin IS NULL THEN
    RETURN '[]'::JSONB;
  END IF;

  IF NOT v_is_admin AND (v_pracas IS NULL OR array_length(v_pracas, 1) = 0) THEN
    RETURN '[]'::JSONB;
  END IF;

  -- Buscar dados agregados por semana
  BEGIN
    WITH dados_semanais AS (
      SELECT
        ano_iso,
        semana_numero,
        SUM(COALESCE(numero_de_corridas_completadas, 0))::BIGINT AS total_corridas,
        SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0))::BIGINT AS total_segundos
      FROM dados_corridas
      WHERE 
        ano_iso = v_ano
        AND (v_is_admin OR praca = ANY(v_pracas))
        AND (p_praca IS NULL OR praca = p_praca)
        AND semana_numero IS NOT NULL
      GROUP BY ano_iso, semana_numero
      ORDER BY ano_iso, semana_numero
      LIMIT p_limite_semanas
    )
    SELECT jsonb_agg(
      jsonb_build_object(
        'ano', ano_iso,
        'semana', semana_numero,
        'semana_label', ano_iso || ' Semana ' || semana_numero,
        'total_corridas', total_corridas,
        'total_segundos', total_segundos
      )
    )
    INTO v_result
    FROM dados_semanais;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erro em listar_evolucao_semanal: %', SQLERRM;
    RETURN '[]'::JSONB;
  END;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_evolucao_semanal(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_evolucao_semanal(TEXT, INTEGER, INTEGER) TO anon;


-- =============================================================================
-- CRIAR ÍNDICES PARA MELHORAR PERFORMANCE
-- =============================================================================

-- Índice composto para evolução mensal
CREATE INDEX IF NOT EXISTS idx_dados_evolucao_mensal
  ON dados_corridas (
    ano_iso, 
    EXTRACT(MONTH FROM data_do_periodo), 
    praca
  )
  WHERE data_do_periodo IS NOT NULL;

-- Índice composto para evolução semanal
CREATE INDEX IF NOT EXISTS idx_dados_evolucao_semanal
  ON dados_corridas (ano_iso, semana_numero, praca)
  WHERE semana_numero IS NOT NULL;

-- Índice para anos disponíveis
CREATE INDEX IF NOT EXISTS idx_dados_ano_iso
  ON dados_corridas (ano_iso)
  WHERE ano_iso IS NOT NULL;


-- =============================================================================
-- ATUALIZAR ESTATÍSTICAS DO POSTGRES
-- =============================================================================

ANALYZE dados_corridas;


-- =============================================================================
-- TESTE E VERIFICAÇÃO
-- =============================================================================

DO $$
DECLARE
  v_anos JSONB;
  v_mensal JSONB;
  v_semanal JSONB;
  v_start TIMESTAMP;
  v_elapsed INTERVAL;
  v_count INT;
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'TESTANDO FUNÇÕES DE EVOLUÇÃO';
  RAISE NOTICE '=============================================================';
  
  -- Verificar quantidade de dados disponíveis
  SELECT COUNT(DISTINCT ano_iso) INTO v_count
  FROM dados_corridas
  WHERE ano_iso IS NOT NULL;
  RAISE NOTICE 'Anos com dados disponíveis: %', v_count;
  
  -- Testar listar_anos_disponiveis
  v_start := clock_timestamp();
  BEGIN
    SELECT listar_anos_disponiveis() INTO v_anos;
    v_elapsed := clock_timestamp() - v_start;
    RAISE NOTICE '✓ listar_anos_disponiveis: % anos encontrados (%.0f ms)', 
      COALESCE(jsonb_array_length(v_anos), 0),
      EXTRACT(MILLISECONDS FROM v_elapsed);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '✗ listar_anos_disponiveis FALHOU: %', SQLERRM;
  END;
  
  -- Testar listar_evolucao_mensal
  v_start := clock_timestamp();
  BEGIN
    SELECT listar_evolucao_mensal(NULL, 2025) INTO v_mensal;
    v_elapsed := clock_timestamp() - v_start;
    RAISE NOTICE '✓ listar_evolucao_mensal: % meses encontrados (%.0f ms)', 
      COALESCE(jsonb_array_length(v_mensal), 0),
      EXTRACT(MILLISECONDS FROM v_elapsed);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '✗ listar_evolucao_mensal FALHOU: %', SQLERRM;
  END;
  
  -- Testar listar_evolucao_semanal
  v_start := clock_timestamp();
  BEGIN
    SELECT listar_evolucao_semanal(NULL, 2025, 52) INTO v_semanal;
    v_elapsed := clock_timestamp() - v_start;
    RAISE NOTICE '✓ listar_evolucao_semanal: % semanas encontradas (%.0f ms)', 
      COALESCE(jsonb_array_length(v_semanal), 0),
      EXTRACT(MILLISECONDS FROM v_elapsed);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '✗ listar_evolucao_semanal FALHOU: %', SQLERRM;
  END;
  
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'FUNÇÕES CRIADAS E TESTADAS!';
  RAISE NOTICE '=============================================================';
END $$;


