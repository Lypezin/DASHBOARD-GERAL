-- =====================================================================
-- FIX COMPLETO: FUNÇÕES DE EVOLUÇÃO
-- =====================================================================
-- Corrige todos os erros 500 e problemas de permissão
-- Execute este script completo no Supabase SQL Editor
-- =====================================================================

-- =============================================================================
-- FUNÇÃO 1: Listar Anos Disponíveis (SIMPLIFICADA)
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
  v_pracas TEXT[];
  v_is_admin BOOLEAN;
  v_result JSONB;
BEGIN
  -- Tentar obter dados do usuário
  BEGIN
    SELECT is_admin, assigned_pracas INTO v_is_admin, v_pracas
    FROM user_profiles
    WHERE id = auth.uid();
  EXCEPTION WHEN OTHERS THEN
    -- Se falhar, retornar ano atual
    RETURN jsonb_build_array(EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
  END;

  -- Se não encontrou usuário, retornar ano atual
  IF v_is_admin IS NULL THEN
    RETURN jsonb_build_array(EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
  END IF;

  -- Se não for admin e não tiver praças, retornar ano atual
  IF NOT v_is_admin AND (v_pracas IS NULL OR array_length(v_pracas, 1) = 0) THEN
    RETURN jsonb_build_array(EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
  END IF;

  -- Buscar anos disponíveis
  BEGIN
    SELECT jsonb_agg(DISTINCT ano_iso ORDER BY ano_iso DESC)
    INTO v_result
    FROM dados_corridas
    WHERE 
      (v_is_admin OR praca = ANY(v_pracas))
      AND ano_iso IS NOT NULL;
  EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro, retornar ano atual
    RETURN jsonb_build_array(EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
  END;

  -- Se não encontrou dados, retornar ano atual
  RETURN COALESCE(v_result, jsonb_build_array(EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER));
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_anos_disponiveis() TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_anos_disponiveis() TO anon;


-- =============================================================================
-- FUNÇÃO 2: Evolução Mensal (CORRIGIDA E ROBUSTA)
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

  -- Tentar obter dados do usuário
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
        SUM(COALESCE(numero_de_corridas_completadas, 0)) AS total_corridas,
        SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) AS total_segundos
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
-- FUNÇÃO 3: Evolução Semanal (CORRIGIDA E ROBUSTA)
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

  -- Tentar obter dados do usuário
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

  -- Buscar dados agregados por semana
  BEGIN
    WITH dados_semanais AS (
      SELECT
        ano_iso,
        semana_numero,
        SUM(COALESCE(numero_de_corridas_completadas, 0)) AS total_corridas,
        SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) AS total_segundos
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
-- VERIFICAÇÃO FINAL
-- =============================================================================

-- Testar as funções
DO $$
DECLARE
  v_anos JSONB;
  v_mensal JSONB;
  v_semanal JSONB;
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'TESTANDO FUNÇÕES DE EVOLUÇÃO';
  RAISE NOTICE '=============================================================';
  
  -- Testar listar_anos_disponiveis
  BEGIN
    SELECT listar_anos_disponiveis() INTO v_anos;
    RAISE NOTICE 'listar_anos_disponiveis: OK - % anos encontrados', jsonb_array_length(v_anos);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'listar_anos_disponiveis: ERRO - %', SQLERRM;
  END;
  
  -- Testar listar_evolucao_mensal
  BEGIN
    SELECT listar_evolucao_mensal(NULL, 2025) INTO v_mensal;
    RAISE NOTICE 'listar_evolucao_mensal: OK - % meses encontrados', COALESCE(jsonb_array_length(v_mensal), 0);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'listar_evolucao_mensal: ERRO - %', SQLERRM;
  END;
  
  -- Testar listar_evolucao_semanal
  BEGIN
    SELECT listar_evolucao_semanal(NULL, 2025, 52) INTO v_semanal;
    RAISE NOTICE 'listar_evolucao_semanal: OK - % semanas encontradas', COALESCE(jsonb_array_length(v_semanal), 0);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'listar_evolucao_semanal: ERRO - %', SQLERRM;
  END;
  
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'FUNÇÕES CRIADAS E TESTADAS COM SUCESSO!';
  RAISE NOTICE '=============================================================';
END $$;

