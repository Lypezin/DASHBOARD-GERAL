-- =====================================================================
-- ATUALIZAR dashboard_resumo PARA USAR DIMENSÕES COM FILTRO
-- =====================================================================

DROP FUNCTION IF EXISTS public.dashboard_resumo(integer, integer, text, text, text);

CREATE OR REPLACE FUNCTION public.dashboard_resumo(
  p_ano integer DEFAULT NULL,
  p_semana integer DEFAULT NULL,
  p_praca text DEFAULT NULL,
  p_sub_praca text DEFAULT NULL,
  p_origem text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '60000ms'
AS $$
WITH filtro_base AS (
  SELECT
    ano_iso,
    semana_numero,
    dia_iso,
    periodo,
    praca,
    sub_praca,
    origem,
    tempo_disponivel_absoluto_segundos,
    numero_de_corridas_ofertadas,
    numero_de_corridas_aceitas,
    numero_de_corridas_rejeitadas,
    numero_de_corridas_completadas
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
    AND (p_ano IS NULL OR ano_iso = p_ano)
    AND (p_semana IS NULL OR semana_numero = p_semana)
    AND (p_praca IS NULL OR praca = p_praca)
    AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
    AND (p_origem IS NULL OR origem = p_origem)
),

totais AS (
  SELECT jsonb_build_object(
    'corridas_ofertadas', COALESCE(SUM(numero_de_corridas_ofertadas), 0),
    'corridas_aceitas', COALESCE(SUM(numero_de_corridas_aceitas), 0),
    'corridas_rejeitadas', COALESCE(SUM(numero_de_corridas_rejeitadas), 0),
    'corridas_completadas', COALESCE(SUM(numero_de_corridas_completadas), 0)
  ) AS data
  FROM filtro_base
),

planejado_semana AS (
  SELECT
    ano_iso,
    semana_numero,
    SUM(segundos_planejados) AS seg_plan
  FROM public.mv_aderencia_agregada
  WHERE (p_ano IS NULL OR ano_iso = p_ano)
    AND (p_semana IS NULL OR semana_numero = p_semana)
    AND (p_praca IS NULL OR praca = p_praca)
    AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
    AND (p_origem IS NULL OR origem = p_origem)
  GROUP BY ano_iso, semana_numero
),
realizado_semana AS (
  SELECT
    ano_iso,
    semana_numero,
    SUM(tempo_disponivel_absoluto_segundos) AS seg_real
  FROM filtro_base
  WHERE tempo_disponivel_absoluto_segundos > 0
  GROUP BY ano_iso, semana_numero
),
semana_json AS (
  SELECT COALESCE(
    jsonb_agg(jsonb_build_object(
      'semana', 'Semana ' || LPAD(COALESCE(ps.semana_numero, rs.semana_numero)::text, 2, '0'),
      'horas_a_entregar', TO_CHAR(INTERVAL '1 second' * COALESCE(ps.seg_plan, 0), 'HH24:MI:SS'),
      'horas_entregues', TO_CHAR(INTERVAL '1 second' * COALESCE(rs.seg_real, 0), 'HH24:MI:SS'),
      'aderencia_percentual', ROUND((COALESCE(rs.seg_real, 0) / NULLIF(COALESCE(ps.seg_plan, 0), 0)) * 100, 2)
    ) ORDER BY COALESCE(ps.ano_iso, rs.ano_iso) DESC, COALESCE(ps.semana_numero, rs.semana_numero) DESC),
    '[]'::jsonb
  ) AS data
  FROM planejado_semana ps
  FULL JOIN realizado_semana rs USING (ano_iso, semana_numero)
),

planejado_dia AS (
  SELECT
    dia_iso,
    SUM(segundos_planejados) AS seg_plan
  FROM public.mv_aderencia_agregada
  WHERE (p_ano IS NULL OR ano_iso = p_ano)
    AND (p_semana IS NULL OR semana_numero = p_semana)
    AND (p_praca IS NULL OR praca = p_praca)
    AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
    AND (p_origem IS NULL OR origem = p_origem)
  GROUP BY dia_iso
),
realizado_dia AS (
  SELECT
    dia_iso,
    SUM(tempo_disponivel_absoluto_segundos) AS seg_real
  FROM filtro_base
  WHERE tempo_disponivel_absoluto_segundos > 0
  GROUP BY dia_iso
),
dia_json AS (
  SELECT COALESCE(
    jsonb_agg(jsonb_build_object(
      'dia_iso', COALESCE(pd.dia_iso, rd.dia_iso),
      'dia_da_semana', CASE COALESCE(pd.dia_iso, rd.dia_iso)
        WHEN 1 THEN 'Segunda' WHEN 2 THEN 'Terça' WHEN 3 THEN 'Quarta'
        WHEN 4 THEN 'Quinta' WHEN 5 THEN 'Sexta' WHEN 6 THEN 'Sábado'
        WHEN 7 THEN 'Domingo' ELSE 'N/D' END,
      'horas_a_entregar', TO_CHAR(INTERVAL '1 second' * COALESCE(pd.seg_plan, 0), 'HH24:MI:SS'),
      'horas_entregues', TO_CHAR(INTERVAL '1 second' * COALESCE(rd.seg_real, 0), 'HH24:MI:SS'),
      'aderencia_percentual', ROUND((COALESCE(rd.seg_real, 0) / NULLIF(COALESCE(pd.seg_plan, 0), 0)) * 100, 2)
    ) ORDER BY COALESCE(pd.dia_iso, rd.dia_iso)),
    '[]'::jsonb
  ) AS data
  FROM planejado_dia pd
  FULL JOIN realizado_dia rd USING (dia_iso)
),

planejado_turno AS (
  SELECT
    periodo,
    SUM(segundos_planejados) AS seg_plan
  FROM public.mv_aderencia_agregada
  WHERE periodo IS NOT NULL
    AND (p_ano IS NULL OR ano_iso = p_ano)
    AND (p_semana IS NULL OR semana_numero = p_semana)
    AND (p_praca IS NULL OR praca = p_praca)
    AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
    AND (p_origem IS NULL OR origem = p_origem)
  GROUP BY periodo
),
realizado_turno AS (
  SELECT
    periodo,
    SUM(tempo_disponivel_absoluto_segundos) AS seg_real
  FROM filtro_base
  WHERE periodo IS NOT NULL
    AND tempo_disponivel_absoluto_segundos > 0
  GROUP BY periodo
),
turno_json AS (
  SELECT COALESCE(
    jsonb_agg(jsonb_build_object(
      'periodo', COALESCE(pt.periodo, rt.periodo),
      'horas_a_entregar', TO_CHAR(INTERVAL '1 second' * COALESCE(pt.seg_plan, 0), 'HH24:MI:SS'),
      'horas_entregues', TO_CHAR(INTERVAL '1 second' * COALESCE(rt.seg_real, 0), 'HH24:MI:SS'),
      'aderencia_percentual', ROUND((COALESCE(rt.seg_real, 0) / NULLIF(COALESCE(pt.seg_plan, 0), 0)) * 100, 2)
    ) ORDER BY COALESCE(pt.periodo, rt.periodo)),
    '[]'::jsonb
  ) AS data
  FROM planejado_turno pt
  FULL JOIN realizado_turno rt USING (periodo)
),

planejado_sub AS (
  SELECT
    sub_praca,
    SUM(segundos_planejados) AS seg_plan
  FROM public.mv_aderencia_agregada
  WHERE sub_praca IS NOT NULL
    AND (p_ano IS NULL OR ano_iso = p_ano)
    AND (p_semana IS NULL OR semana_numero = p_semana)
    AND (p_praca IS NULL OR praca = p_praca)
    AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
    AND (p_origem IS NULL OR origem = p_origem)
  GROUP BY sub_praca
),
realizado_sub AS (
  SELECT
    sub_praca,
    SUM(tempo_disponivel_absoluto_segundos) AS seg_real
  FROM filtro_base
  WHERE sub_praca IS NOT NULL
    AND tempo_disponivel_absoluto_segundos > 0
  GROUP BY sub_praca
),
sub_json AS (
  SELECT COALESCE(
    jsonb_agg(jsonb_build_object(
      'sub_praca', COALESCE(psub.sub_praca, rsub.sub_praca),
      'horas_a_entregar', TO_CHAR(INTERVAL '1 second' * COALESCE(psub.seg_plan, 0), 'HH24:MI:SS'),
      'horas_entregues', TO_CHAR(INTERVAL '1 second' * COALESCE(rsub.seg_real, 0), 'HH24:MI:SS'),
      'aderencia_percentual', ROUND((COALESCE(rsub.seg_real, 0) / NULLIF(COALESCE(psub.seg_plan, 0), 0)) * 100, 2)
    ) ORDER BY COALESCE(psub.sub_praca, rsub.sub_praca)),
    '[]'::jsonb
  ) AS data
  FROM planejado_sub psub
  FULL JOIN realizado_sub rsub USING (sub_praca)
),

planejado_origem AS (
  SELECT
    origem,
    SUM(segundos_planejados) AS seg_plan
  FROM public.mv_aderencia_agregada
  WHERE origem IS NOT NULL
    AND (p_ano IS NULL OR ano_iso = p_ano)
    AND (p_semana IS NULL OR semana_numero = p_semana)
    AND (p_praca IS NULL OR praca = p_praca)
    AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
    AND (p_origem IS NULL OR origem = p_origem)
  GROUP BY origem
),
realizado_origem AS (
  SELECT
    origem,
    SUM(tempo_disponivel_absoluto_segundos) AS seg_real
  FROM filtro_base
  WHERE origem IS NOT NULL
    AND tempo_disponivel_absoluto_segundos > 0
  GROUP BY origem
),
origem_json AS (
  SELECT COALESCE(
    jsonb_agg(jsonb_build_object(
      'origem', COALESCE(pori.origem, rori.origem),
      'horas_a_entregar', TO_CHAR(INTERVAL '1 second' * COALESCE(pori.seg_plan, 0), 'HH24:MI:SS'),
      'horas_entregues', TO_CHAR(INTERVAL '1 second' * COALESCE(rori.seg_real, 0), 'HH24:MI:SS'),
      'aderencia_percentual', ROUND((COALESCE(rori.seg_real, 0) / NULLIF(COALESCE(pori.seg_plan, 0), 0)) * 100, 2)
    ) ORDER BY COALESCE(pori.origem, rori.origem)),
    '[]'::jsonb
  ) AS data
  FROM planejado_origem pori
  FULL JOIN realizado_origem rori USING (origem)
)

SELECT jsonb_build_object(
  'totais', (SELECT data FROM totais),
  'semanal', (SELECT data FROM semana_json),
  'dia', (SELECT data FROM dia_json),
  'turno', (SELECT data FROM turno_json),
  'sub_praca', (SELECT data FROM sub_json),
  'origem', (SELECT data FROM origem_json),
  'dimensoes', public.listar_dimensoes_dashboard(p_ano, p_semana, p_praca, p_sub_praca, p_origem)
);
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_resumo(integer, integer, text, text, text)
  TO anon, authenticated, service_role;

-- Verificação
SELECT 'Função dashboard_resumo' as item,
       '✅ Atualizada para usar dimensões filtradas' as status;
