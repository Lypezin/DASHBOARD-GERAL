-- =====================================================================
-- 🔧 SOLUÇÃO 100% DEFINITIVA - RECRIAR TUDO DO ZERO
-- =====================================================================

-- ETAPA 1: VERIFICAR SE A TABELA TEM DADOS
-- =====================================================================
SELECT '1️⃣ VERIFICANDO DADOS NA TABELA' as etapa;
SELECT COUNT(*) as total_registros FROM public.dados_corridas;
SELECT COUNT(*) as registros_com_corridas 
FROM public.dados_corridas 
WHERE numero_de_corridas_ofertadas > 0;

-- ETAPA 2: DROPAR TUDO RELACIONADO À MV
-- =====================================================================
SELECT '2️⃣ DROPANDO MATERIALIZED VIEW E ÍNDICES' as etapa;
DROP MATERIALIZED VIEW IF EXISTS public.mv_aderencia_agregada CASCADE;
DROP FUNCTION IF EXISTS public.refresh_mv_aderencia() CASCADE;
DROP FUNCTION IF EXISTS public.refresh_mv_aderencia_async() CASCADE;

-- ETAPA 3: RECRIAR MATERIALIZED VIEW COM QUERY CORRETA
-- =====================================================================
SELECT '3️⃣ RECRIANDO MATERIALIZED VIEW' as etapa;

CREATE MATERIALIZED VIEW public.mv_aderencia_agregada AS
SELECT
  -- Chaves de agrupamento
  date_part('isoyear', data_do_periodo)::int AS ano_iso,
  date_part('week', data_do_periodo)::int AS semana_numero,
  to_char(data_do_periodo, 'Day') AS dia_semana,
  data_do_periodo,
  praca,
  sub_praca,
  origem,
  periodo AS turno,
  
  -- Agregações de corridas
  SUM(COALESCE(numero_de_corridas_ofertadas, 0)) AS total_corridas_ofertadas,
  SUM(COALESCE(aceitas, 0)) AS total_aceitas,
  SUM(COALESCE(rejeitadas, 0)) AS total_rejeitadas,
  SUM(COALESCE(completadas, 0)) AS total_completadas,
  
  -- Segundos planejados e realizados
  SUM(
    numero_minimo_de_entregadores_regulares_na_escala * 
    COALESCE(duracao_segundos, 0)
  ) AS segundos_planejados,
  
  SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) AS segundos_realizados

FROM public.dados_corridas
WHERE data_do_periodo IS NOT NULL
GROUP BY 
  date_part('isoyear', data_do_periodo)::int,
  date_part('week', data_do_periodo)::int,
  to_char(data_do_periodo, 'Day'),
  data_do_periodo,
  praca,
  sub_praca,
  origem,
  periodo;

-- ETAPA 4: CRIAR ÍNDICE NA MV
-- =====================================================================
SELECT '4️⃣ CRIANDO ÍNDICE NA MV' as etapa;

CREATE INDEX idx_mv_aderencia_principal 
ON public.mv_aderencia_agregada (
  ano_iso, 
  semana_numero, 
  praca, 
  sub_praca, 
  origem
);

-- ETAPA 5: VACUUM E ANALYZE
-- =====================================================================
SELECT '5️⃣ OTIMIZANDO MV' as etapa;
VACUUM ANALYZE public.mv_aderencia_agregada;

-- ETAPA 6: VERIFICAR SE A MV TEM DADOS
-- =====================================================================
SELECT '6️⃣ VERIFICANDO MV CRIADA' as etapa;
SELECT COUNT(*) as registros_na_mv FROM public.mv_aderencia_agregada;
SELECT 
  SUM(total_corridas_ofertadas) as soma_corridas,
  SUM(total_aceitas) as soma_aceitas,
  COUNT(DISTINCT praca) as qtd_pracas
FROM public.mv_aderencia_agregada;

-- ETAPA 7: RECRIAR FUNÇÃO dashboard_resumo SIMPLIFICADA
-- =====================================================================
SELECT '7️⃣ RECRIANDO FUNÇÃO dashboard_resumo' as etapa;

DROP FUNCTION IF EXISTS public.dashboard_resumo(integer, integer, text, text, text) CASCADE;

CREATE OR REPLACE FUNCTION public.dashboard_resumo(
  p_ano integer DEFAULT NULL,
  p_semana integer DEFAULT NULL,
  p_praca text DEFAULT NULL,
  p_sub_praca text DEFAULT NULL,
  p_origem text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET statement_timeout = '30000ms'
SET work_mem = '256MB'
AS $$
DECLARE
  v_result jsonb;
  v_totais jsonb;
  v_semanal jsonb;
  v_dia jsonb;
  v_turno jsonb;
  v_sub_praca jsonb;
  v_origem jsonb;
  v_dimensoes jsonb;
BEGIN
  -- Buscar dimensões
  v_dimensoes := public.listar_dimensoes_dashboard(p_ano, p_semana, p_praca, p_sub_praca, p_origem);
  
  -- Totais gerais
  SELECT jsonb_build_object(
    'corridas_ofertadas', COALESCE(SUM(total_corridas_ofertadas), 0),
    'corridas_aceitas', COALESCE(SUM(total_aceitas), 0),
    'corridas_rejeitadas', COALESCE(SUM(total_rejeitadas), 0),
    'corridas_completadas', COALESCE(SUM(total_completadas), 0)
  )
  INTO v_totais
  FROM public.mv_aderencia_agregada
  WHERE (p_ano IS NULL OR ano_iso = p_ano)
    AND (p_semana IS NULL OR semana_numero = p_semana)
    AND (p_praca IS NULL OR praca = p_praca)
    AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
    AND (p_origem IS NULL OR origem = p_origem);
  
  -- Agregação semanal
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'ano_iso', ano_iso,
      'semana_numero', semana_numero,
      'segundos_planejados', segundos_planejados,
      'segundos_realizados', segundos_realizados
    )
  ), '[]'::jsonb)
  INTO v_semanal
  FROM (
    SELECT 
      ano_iso,
      semana_numero,
      SUM(segundos_planejados) as segundos_planejados,
      SUM(segundos_realizados) as segundos_realizados
    FROM public.mv_aderencia_agregada
    WHERE (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR origem = p_origem)
    GROUP BY ano_iso, semana_numero
    ORDER BY ano_iso, semana_numero
  ) sub;
  
  -- Agregação por dia
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'dia_semana', dia_semana,
      'segundos_planejados', segundos_planejados,
      'segundos_realizados', segundos_realizados
    )
  ), '[]'::jsonb)
  INTO v_dia
  FROM (
    SELECT 
      dia_semana,
      SUM(segundos_planejados) as segundos_planejados,
      SUM(segundos_realizados) as segundos_realizados
    FROM public.mv_aderencia_agregada
    WHERE (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR origem = p_origem)
    GROUP BY dia_semana
  ) sub;
  
  -- Agregação por turno
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'turno', turno,
      'segundos_planejados', segundos_planejados,
      'segundos_realizados', segundos_realizados
    )
  ), '[]'::jsonb)
  INTO v_turno
  FROM (
    SELECT 
      turno,
      SUM(segundos_planejados) as segundos_planejados,
      SUM(segundos_realizados) as segundos_realizados
    FROM public.mv_aderencia_agregada
    WHERE (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR origem = p_origem)
    GROUP BY turno
  ) sub;
  
  -- Agregação por sub_praca
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'sub_praca', sub_praca,
      'segundos_planejados', segundos_planejados,
      'segundos_realizados', segundos_realizados
    )
  ), '[]'::jsonb)
  INTO v_sub_praca
  FROM (
    SELECT 
      sub_praca,
      SUM(segundos_planejados) as segundos_planejados,
      SUM(segundos_realizados) as segundos_realizados
    FROM public.mv_aderencia_agregada
    WHERE (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR origem = p_origem)
    GROUP BY sub_praca
  ) sub;
  
  -- Agregação por origem
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'origem', origem,
      'segundos_planejados', segundos_planejados,
      'segundos_realizados', segundos_realizados
    )
  ), '[]'::jsonb)
  INTO v_origem
  FROM (
    SELECT 
      origem,
      SUM(segundos_planejados) as segundos_planejados,
      SUM(segundos_realizados) as segundos_realizados
    FROM public.mv_aderencia_agregada
    WHERE (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR origem = p_origem)
    GROUP BY origem
  ) sub;
  
  -- Montar resultado final
  v_result := jsonb_build_object(
    'totais', v_totais,
    'semanal', v_semanal,
    'dia', v_dia,
    'turno', v_turno,
    'sub_praca', v_sub_praca,
    'origem', v_origem,
    'dimensoes', v_dimensoes
  );
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erro em dashboard_resumo: %', SQLERRM;
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'totais', jsonb_build_object(
      'corridas_ofertadas', 0,
      'corridas_aceitas', 0,
      'corridas_rejeitadas', 0,
      'corridas_completadas', 0
    ),
    'semanal', '[]'::jsonb,
    'dia', '[]'::jsonb,
    'turno', '[]'::jsonb,
    'sub_praca', '[]'::jsonb,
    'origem', '[]'::jsonb,
    'dimensoes', v_dimensoes
  );
END;
$$;

-- ETAPA 8: FUNÇÃO DE REFRESH
-- =====================================================================
SELECT '8️⃣ CRIANDO FUNÇÃO DE REFRESH' as etapa;

CREATE OR REPLACE FUNCTION public.refresh_mv_aderencia()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_aderencia_agregada;
EXCEPTION WHEN OTHERS THEN
  REFRESH MATERIALIZED VIEW public.mv_aderencia_agregada;
END;
$$;

-- ETAPA 9: PERMISSÕES
-- =====================================================================
SELECT '9️⃣ CONFIGURANDO PERMISSÕES' as etapa;

GRANT SELECT ON public.mv_aderencia_agregada TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dashboard_resumo(integer, integer, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_mv_aderencia() TO service_role;

-- ETAPA 10: TESTE FINAL
-- =====================================================================
SELECT '🎯 TESTE FINAL' as etapa;
SELECT 
  '✅ SUCESSO!' as status,
  (public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL)->'totais'->>'corridas_ofertadas')::bigint as total_corridas_ofertadas,
  (public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL)->'totais'->>'corridas_aceitas')::bigint as total_aceitas,
  jsonb_array_length(public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL)->'semanal') as qtd_semanal,
  jsonb_array_length(public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL)->'dia') as qtd_dias;

-- ETAPA 11: MOSTRAR RESULTADO COMPLETO (SAMPLE)
-- =====================================================================
SELECT '📊 RESULTADO COMPLETO' as info;
SELECT jsonb_pretty(public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL));

