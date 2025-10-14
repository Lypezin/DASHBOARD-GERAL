-- =====================================================================
-- SOLUÇÃO FINAL: VOLTAR MV ORIGINAL + ADICIONAR APENAS COLUNA DE TAXAS
-- Execute TUDO de uma vez (vai demorar 2-3 minutos)
-- =====================================================================

SET statement_timeout = '300000ms';

DROP MATERIALIZED VIEW IF EXISTS public.mv_aderencia_agregada CASCADE;

CREATE MATERIALIZED VIEW public.mv_aderencia_agregada AS
WITH 
planejado_distinct AS (
  SELECT DISTINCT ON (data_do_periodo, periodo, praca, sub_praca, origem)
    date_part('isoyear', data_do_periodo)::int AS ano_iso,
    date_part('week', data_do_periodo)::int AS semana_numero,
    date_part('isodow', data_do_periodo)::int AS dia_iso,
    to_char(data_do_periodo, 'Day') AS dia_semana,
    data_do_periodo,
    praca,
    sub_praca,
    origem,
    periodo,
    numero_minimo_de_entregadores_regulares_na_escala * COALESCE(duracao_segundos, 0) AS segundos_planejados
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL AND periodo IS NOT NULL
  ORDER BY data_do_periodo, periodo, praca, sub_praca, origem, numero_minimo_de_entregadores_regulares_na_escala DESC
),
planejado_agregado AS (
  SELECT
    ano_iso, semana_numero, dia_iso, dia_semana, data_do_periodo, praca, sub_praca, origem, periodo,
    SUM(segundos_planejados) AS segundos_planejados
  FROM planejado_distinct
  GROUP BY ano_iso, semana_numero, dia_iso, dia_semana, data_do_periodo, praca, sub_praca, origem, periodo
),
realizado_agregado AS (
  SELECT
    date_part('isoyear', data_do_periodo)::int AS ano_iso,
    date_part('week', data_do_periodo)::int AS semana_numero,
    date_part('isodow', data_do_periodo)::int AS dia_iso,
    to_char(data_do_periodo, 'Day') AS dia_semana,
    data_do_periodo, praca, sub_praca, origem, periodo,
    SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) AS segundos_realizados
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
  GROUP BY 1,2,3,4,5,6,7,8,9
),
corridas_agregado AS (
  SELECT
    date_part('isoyear', data_do_periodo)::int AS ano_iso,
    date_part('week', data_do_periodo)::int AS semana_numero,
    date_part('isodow', data_do_periodo)::int AS dia_iso,
    to_char(data_do_periodo, 'Day') AS dia_semana,
    data_do_periodo, praca, sub_praca, origem, periodo,
    SUM(COALESCE(numero_de_corridas_ofertadas, 0)) AS total_corridas_ofertadas,
    SUM(COALESCE(numero_de_corridas_aceitas, 0)) AS total_aceitas,
    SUM(COALESCE(numero_de_corridas_rejeitadas, 0)) AS total_rejeitadas,
    SUM(COALESCE(numero_de_corridas_completadas, 0)) AS total_completadas,
    SUM(COALESCE(soma_das_taxas_das_corridas_aceitas, 0)) AS total_taxas
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
  GROUP BY 1,2,3,4,5,6,7,8,9
)
SELECT
  COALESCE(p.ano_iso, r.ano_iso, c.ano_iso) AS ano_iso,
  COALESCE(p.semana_numero, r.semana_numero, c.semana_numero) AS semana_numero,
  COALESCE(p.dia_iso, r.dia_iso, c.dia_iso) AS dia_iso,
  COALESCE(p.dia_semana, r.dia_semana, c.dia_semana) AS dia_semana,
  COALESCE(p.data_do_periodo, r.data_do_periodo, c.data_do_periodo) AS data_do_periodo,
  COALESCE(p.praca, r.praca, c.praca) AS praca,
  COALESCE(p.sub_praca, r.sub_praca, c.sub_praca) AS sub_praca,
  COALESCE(p.origem, r.origem, c.origem) AS origem,
  COALESCE(p.periodo, r.periodo, c.periodo) AS turno,
  COALESCE(c.total_corridas_ofertadas, 0) AS total_corridas_ofertadas,
  COALESCE(c.total_aceitas, 0) AS total_aceitas,
  COALESCE(c.total_rejeitadas, 0) AS total_rejeitadas,
  COALESCE(c.total_completadas, 0) AS total_completadas,
  COALESCE(c.total_taxas, 0) AS soma_das_taxas_das_corridas_aceitas,
  COALESCE(p.segundos_planejados, 0) AS segundos_planejados,
  COALESCE(r.segundos_realizados, 0) AS segundos_realizados
FROM planejado_agregado p
FULL JOIN realizado_agregado r USING (ano_iso, semana_numero, dia_iso, dia_semana, data_do_periodo, praca, sub_praca, origem, periodo)
FULL JOIN corridas_agregado c USING (ano_iso, semana_numero, dia_iso, dia_semana, data_do_periodo, praca, sub_praca, origem, periodo);

CREATE INDEX idx_mv_aderencia_principal ON public.mv_aderencia_agregada (ano_iso, semana_numero, praca, sub_praca, origem);

GRANT SELECT ON public.mv_aderencia_agregada TO authenticated;
GRANT SELECT ON public.mv_aderencia_agregada TO anon;

RESET statement_timeout;

