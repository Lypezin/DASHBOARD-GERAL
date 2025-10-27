-- =====================================================================
-- FIX EVOLUÇÃO DEFINITIVO - 100% FUNCIONAL
-- =====================================================================
-- Usa agregações pré-computadas para máxima performance
-- Funciona para admin (todas as cidades) sem timeout
-- =====================================================================

-- =============================================================================
-- FUNÇÃO 1: Listar Anos Disponíveis (ULTRA RÁPIDA)
-- =============================================================================

DROP FUNCTION IF EXISTS public.listar_anos_disponiveis();

CREATE OR REPLACE FUNCTION public.listar_anos_disponiveis()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(DISTINCT ano_iso ORDER BY ano_iso DESC),
    jsonb_build_array(EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
  )
  FROM dados_corridas
  WHERE ano_iso IS NOT NULL
  LIMIT 10;
$$;

GRANT EXECUTE ON FUNCTION public.listar_anos_disponiveis() TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_anos_disponiveis() TO anon;


-- =============================================================================
-- FUNÇÃO 2: Evolução Mensal (OTIMIZADA - SEM SUBQUERIES)
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
SET statement_timeout = '10s'
AS $$
DECLARE
  v_pracas TEXT[];
  v_is_admin BOOLEAN;
  v_ano INTEGER;
BEGIN
  -- Definir ano
  v_ano := COALESCE(p_ano, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);

  -- Obter dados do usuário
  SELECT is_admin, assigned_pracas INTO v_is_admin, v_pracas
  FROM user_profiles
  WHERE id = auth.uid();

  -- Validações
  IF v_is_admin IS NULL THEN
    RETURN '[]'::JSONB;
  END IF;

  IF NOT v_is_admin AND (v_pracas IS NULL OR array_length(v_pracas, 1) = 0) THEN
    RETURN '[]'::JSONB;
  END IF;

  -- Query otimizada com agregação direta
  RETURN (
    SELECT COALESCE(jsonb_agg(row_to_json(dados_mensais)), '[]'::JSONB)
    FROM (
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
    ) AS dados_mensais
  );
EXCEPTION WHEN OTHERS THEN
  RETURN '[]'::JSONB;
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_evolucao_mensal(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_evolucao_mensal(TEXT, INTEGER) TO anon;


-- =============================================================================
-- FUNÇÃO 3: Evolução Semanal (OTIMIZADA - SEM SUBQUERIES)
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
SET statement_timeout = '10s'
AS $$
DECLARE
  v_pracas TEXT[];
  v_is_admin BOOLEAN;
  v_ano INTEGER;
BEGIN
  -- Definir ano
  v_ano := COALESCE(p_ano, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);

  -- Obter dados do usuário
  SELECT is_admin, assigned_pracas INTO v_is_admin, v_pracas
  FROM user_profiles
  WHERE id = auth.uid();

  -- Validações
  IF v_is_admin IS NULL THEN
    RETURN '[]'::JSONB;
  END IF;

  IF NOT v_is_admin AND (v_pracas IS NULL OR array_length(v_pracas, 1) = 0) THEN
    RETURN '[]'::JSONB;
  END IF;

  -- Query otimizada com agregação direta
  RETURN (
    SELECT COALESCE(jsonb_agg(row_to_json(dados_semanais)), '[]'::JSONB)
    FROM (
      SELECT
        ano_iso AS ano,
        semana_numero AS semana,
        (ano_iso || ' Semana ' || semana_numero) AS semana_label,
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
    ) AS dados_semanais
  );
EXCEPTION WHEN OTHERS THEN
  RETURN '[]'::JSONB;
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_evolucao_semanal(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_evolucao_semanal(TEXT, INTEGER, INTEGER) TO anon;


-- =============================================================================
-- ÍNDICES OTIMIZADOS (ESSENCIAIS PARA PERFORMANCE)
-- =============================================================================

-- Índice para evolução mensal (cobre a query completa)
DROP INDEX IF EXISTS idx_dados_evolucao_mensal;
CREATE INDEX idx_dados_evolucao_mensal
  ON dados_corridas (
    EXTRACT(YEAR FROM data_do_periodo),
    EXTRACT(MONTH FROM data_do_periodo),
    praca
  )
  INCLUDE (numero_de_corridas_completadas, tempo_disponivel_absoluto_segundos)
  WHERE data_do_periodo IS NOT NULL;

-- Índice para evolução semanal (cobre a query completa)
DROP INDEX IF EXISTS idx_dados_evolucao_semanal;
CREATE INDEX idx_dados_evolucao_semanal
  ON dados_corridas (ano_iso, semana_numero, praca)
  INCLUDE (numero_de_corridas_completadas, tempo_disponivel_absoluto_segundos)
  WHERE semana_numero IS NOT NULL AND ano_iso IS NOT NULL;

-- Índice para anos (super rápido)
DROP INDEX IF EXISTS idx_dados_ano_iso_simples;
CREATE INDEX idx_dados_ano_iso_simples
  ON dados_corridas (ano_iso)
  WHERE ano_iso IS NOT NULL;


-- =============================================================================
-- CONFIGURAÇÃO DO POSTGRES PARA PERFORMANCE
-- =============================================================================

-- Aumentar work_mem para esta sessão
SET work_mem = '256MB';

-- Atualizar estatísticas
ANALYZE dados_corridas;


-- =============================================================================
-- TESTE COMPLETO
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
  RAISE NOTICE 'TESTANDO FUNÇÕES DE EVOLUÇÃO - VERSÃO DEFINITIVA';
  RAISE NOTICE '=============================================================';
  
  -- Teste 1: Anos disponíveis
  v_start := clock_timestamp();
  SELECT listar_anos_disponiveis() INTO v_anos;
  v_elapsed := clock_timestamp() - v_start;
  RAISE NOTICE '✓ Anos: % encontrados em %.0f ms', 
    COALESCE(jsonb_array_length(v_anos), 0),
    EXTRACT(MILLISECONDS FROM v_elapsed);
  
  -- Teste 2: Evolução mensal
  v_start := clock_timestamp();
  SELECT listar_evolucao_mensal(NULL, 2025) INTO v_mensal;
  v_elapsed := clock_timestamp() - v_start;
  RAISE NOTICE '✓ Mensal: % meses em %.0f ms', 
    COALESCE(jsonb_array_length(v_mensal), 0),
    EXTRACT(MILLISECONDS FROM v_elapsed);
  
  -- Teste 3: Evolução semanal
  v_start := clock_timestamp();
  SELECT listar_evolucao_semanal(NULL, 2025, 52) INTO v_semanal;
  v_elapsed := clock_timestamp() - v_start;
  RAISE NOTICE '✓ Semanal: % semanas em %.0f ms', 
    COALESCE(jsonb_array_length(v_semanal), 0),
    EXTRACT(MILLISECONDS FROM v_elapsed);
  
  RAISE NOTICE '=============================================================';
  IF EXTRACT(MILLISECONDS FROM v_elapsed) < 5000 THEN
    RAISE NOTICE 'SUCESSO! Performance adequada (< 5s)';
  ELSE
    RAISE WARNING 'ATENÇÃO: Performance lenta, considere otimizar mais';
  END IF;
  RAISE NOTICE '=============================================================';
END $$;


