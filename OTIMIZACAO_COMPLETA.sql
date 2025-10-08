-- =====================================================================
-- OTIMIZAÇÃO COMPLETA - RESOLVER PROBLEMAS DE PERFORMANCE
-- =====================================================================
-- Problemas resolvidos:
-- 1. Performance lenta (30-50s para carregar)
-- 2. UTR com timeout intermitente
-- 3. Queries otimizadas com índices
-- =====================================================================

-- =============================================================================
-- PARTE 1: CRIAR ÍNDICES PARA PERFORMANCE
-- =============================================================================

-- Índices nas colunas mais usadas para filtros
CREATE INDEX IF NOT EXISTS idx_dados_corridas_filtros 
  ON public.dados_corridas (ano_iso, semana_numero, praca, sub_praca, origem);

-- Índice específico para agregações
CREATE INDEX IF NOT EXISTS idx_dados_corridas_agregacao 
  ON public.dados_corridas (data_do_periodo, praca) 
  WHERE data_do_periodo IS NOT NULL;

-- Índice para tempo e corridas (usado em UTR)
CREATE INDEX IF NOT EXISTS idx_dados_corridas_utr 
  ON public.dados_corridas (tempo_disponivel_absoluto_segundos, numero_de_corridas_completadas)
  WHERE tempo_disponivel_absoluto_segundos > 0;

-- Atualizar estatísticas
ANALYZE public.dados_corridas;
ANALYZE public.mv_aderencia_agregada;


-- =============================================================================
-- PARTE 2: OTIMIZAR calcular_utr (MAIS RÁPIDO, SEM TIMEOUT)
-- =============================================================================

DROP FUNCTION IF EXISTS public.calcular_utr(integer, integer, text, text, text);

CREATE OR REPLACE FUNCTION public.calcular_utr(
  p_ano integer DEFAULT NULL,
  p_semana integer DEFAULT NULL,
  p_praca text DEFAULT NULL,
  p_sub_praca text DEFAULT NULL,
  p_origem text DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SET search_path = public
SET statement_timeout = '60000ms'
AS $$
DECLARE
  v_geral jsonb;
  v_praca jsonb;
  v_sub jsonb;
  v_origem jsonb;
  v_turno jsonb;
BEGIN
  -- Calcular geral de uma vez
  SELECT jsonb_build_object(
    'tempo_horas', ROUND(COALESCE(SUM(tempo_disponivel_absoluto_segundos), 0) / 3600.0, 2),
    'corridas', COALESCE(SUM(numero_de_corridas_completadas), 0),
    'utr', CASE 
      WHEN COALESCE(SUM(tempo_disponivel_absoluto_segundos), 0) = 0 THEN 0
      ELSE ROUND((COALESCE(SUM(numero_de_corridas_completadas), 0)::numeric / 
                  (COALESCE(SUM(tempo_disponivel_absoluto_segundos), 0)::numeric / 3600)), 2)
    END
  ) INTO v_geral
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
    AND (p_ano IS NULL OR ano_iso = p_ano)
    AND (p_semana IS NULL OR semana_numero = p_semana)
    AND (p_praca IS NULL OR praca = p_praca)
    AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
    AND (p_origem IS NULL OR origem = p_origem);

  -- Por praça
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'praca', praca,
      'tempo_horas', tempo_horas,
      'corridas', corridas,
      'utr', utr
    ) ORDER BY praca
  ), '[]'::jsonb) INTO v_praca
  FROM (
    SELECT 
      praca,
      ROUND(SUM(tempo_disponivel_absoluto_segundos) / 3600.0, 2) as tempo_horas,
      SUM(numero_de_corridas_completadas) as corridas,
      CASE 
        WHEN SUM(tempo_disponivel_absoluto_segundos) = 0 THEN 0
        ELSE ROUND((SUM(numero_de_corridas_completadas)::numeric / 
                   (SUM(tempo_disponivel_absoluto_segundos)::numeric / 3600)), 2)
      END as utr
    FROM public.dados_corridas
    WHERE data_do_periodo IS NOT NULL AND praca IS NOT NULL
      AND (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR origem = p_origem)
    GROUP BY praca
  ) t;

  -- Por sub-praça
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'sub_praca', sub_praca,
      'tempo_horas', tempo_horas,
      'corridas', corridas,
      'utr', utr
    ) ORDER BY sub_praca
  ), '[]'::jsonb) INTO v_sub
  FROM (
    SELECT 
      sub_praca,
      ROUND(SUM(tempo_disponivel_absoluto_segundos) / 3600.0, 2) as tempo_horas,
      SUM(numero_de_corridas_completadas) as corridas,
      CASE 
        WHEN SUM(tempo_disponivel_absoluto_segundos) = 0 THEN 0
        ELSE ROUND((SUM(numero_de_corridas_completadas)::numeric / 
                   (SUM(tempo_disponivel_absoluto_segundos)::numeric / 3600)), 2)
      END as utr
    FROM public.dados_corridas
    WHERE data_do_periodo IS NOT NULL AND sub_praca IS NOT NULL
      AND (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR origem = p_origem)
    GROUP BY sub_praca
  ) t;

  -- Por origem
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'origem', origem,
      'tempo_horas', tempo_horas,
      'corridas', corridas,
      'utr', utr
    ) ORDER BY origem
  ), '[]'::jsonb) INTO v_origem
  FROM (
    SELECT 
      origem,
      ROUND(SUM(tempo_disponivel_absoluto_segundos) / 3600.0, 2) as tempo_horas,
      SUM(numero_de_corridas_completadas) as corridas,
      CASE 
        WHEN SUM(tempo_disponivel_absoluto_segundos) = 0 THEN 0
        ELSE ROUND((SUM(numero_de_corridas_completadas)::numeric / 
                   (SUM(tempo_disponivel_absoluto_segundos)::numeric / 3600)), 2)
      END as utr
    FROM public.dados_corridas
    WHERE data_do_periodo IS NOT NULL AND origem IS NOT NULL
      AND (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR origem = p_origem)
    GROUP BY origem
  ) t;

  -- Por turno
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'periodo', periodo,
      'tempo_horas', tempo_horas,
      'corridas', corridas,
      'utr', utr
    ) ORDER BY periodo
  ), '[]'::jsonb) INTO v_turno
  FROM (
    SELECT 
      periodo,
      ROUND(SUM(tempo_disponivel_absoluto_segundos) / 3600.0, 2) as tempo_horas,
      SUM(numero_de_corridas_completadas) as corridas,
      CASE 
        WHEN SUM(tempo_disponivel_absoluto_segundos) = 0 THEN 0
        ELSE ROUND((SUM(numero_de_corridas_completadas)::numeric / 
                   (SUM(tempo_disponivel_absoluto_segundos)::numeric / 3600)), 2)
      END as utr
    FROM public.dados_corridas
    WHERE data_do_periodo IS NOT NULL AND periodo IS NOT NULL
      AND (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR origem = p_origem)
    GROUP BY periodo
  ) t;

  RETURN jsonb_build_object(
    'geral', v_geral,
    'por_praca', v_praca,
    'por_sub_praca', v_sub,
    'por_origem', v_origem,
    'por_turno', v_turno
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.calcular_utr(integer, integer, text, text, text)
  TO anon, authenticated, service_role;


-- =============================================================================
-- PARTE 3: CRIAR FUNÇÃO PARA LISTAR TODAS AS SEMANAS (SEM FILTRO)
-- =============================================================================

DROP FUNCTION IF EXISTS public.listar_todas_semanas();

CREATE OR REPLACE FUNCTION public.listar_todas_semanas()
RETURNS integer[]
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(DISTINCT semana_numero ORDER BY semana_numero), ARRAY[]::integer[])
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
    AND semana_numero IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.listar_todas_semanas()
  TO anon, authenticated, service_role;


-- =============================================================================
-- VERIFICAÇÃO E ANÁLISE
-- =============================================================================

-- Ver índices criados
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'dados_corridas'
  AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- Ver tamanho da tabela e índices
SELECT
  pg_size_pretty(pg_total_relation_size('public.dados_corridas')) as tamanho_total,
  pg_size_pretty(pg_relation_size('public.dados_corridas')) as tamanho_tabela,
  pg_size_pretty(pg_total_relation_size('public.dados_corridas') - pg_relation_size('public.dados_corridas')) as tamanho_indices;

SELECT '✅ OTIMIZAÇÃO COMPLETA APLICADA!' as status;
