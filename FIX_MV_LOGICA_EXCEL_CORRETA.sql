-- =====================================================================
-- 🔧 MV COM LÓGICA IDÊNTICA AO EXCEL (DISTINCT + SUM)
-- =====================================================================

-- ETAPA 1: Dropar MV antiga
DROP MATERIALIZED VIEW IF EXISTS public.mv_aderencia_agregada CASCADE;

-- ETAPA 2: Recriar MV COM LÓGICA DO EXCEL
SELECT '🔧 Recriando MV com lógica do Excel (DISTINCT primeiro)' as info;

CREATE MATERIALIZED VIEW public.mv_aderencia_agregada AS
WITH 
-- PLANEJADO: DISTINCT nas colunas chave (igual "Remover Duplicadas" do Excel)
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
    -- Multiplicar DEPOIS do DISTINCT
    numero_minimo_de_entregadores_regulares_na_escala * COALESCE(duracao_segundos, 0) AS segundos_planejados
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
    AND periodo IS NOT NULL
  ORDER BY data_do_periodo, periodo, praca, sub_praca, origem, numero_minimo_de_entregadores_regulares_na_escala DESC
),
-- Agregar o planejado por dimensões
planejado_agregado AS (
  SELECT
    ano_iso,
    semana_numero,
    dia_iso,
    dia_semana,
    data_do_periodo,
    praca,
    sub_praca,
    origem,
    periodo,
    SUM(segundos_planejados) AS segundos_planejados
  FROM planejado_distinct
  GROUP BY ano_iso, semana_numero, dia_iso, dia_semana, data_do_periodo, praca, sub_praca, origem, periodo
),
-- REALIZADO: simplesmente somar tudo (SEM distinct)
realizado_agregado AS (
  SELECT
    date_part('isoyear', data_do_periodo)::int AS ano_iso,
    date_part('week', data_do_periodo)::int AS semana_numero,
    date_part('isodow', data_do_periodo)::int AS dia_iso,
    to_char(data_do_periodo, 'Day') AS dia_semana,
    data_do_periodo,
    praca,
    sub_praca,
    origem,
    periodo,
    SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) AS segundos_realizados
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
  GROUP BY 1,2,3,4,5,6,7,8,9
),
-- CORRIDAS: somar tudo
corridas_agregado AS (
  SELECT
    date_part('isoyear', data_do_periodo)::int AS ano_iso,
    date_part('week', data_do_periodo)::int AS semana_numero,
    date_part('isodow', data_do_periodo)::int AS dia_iso,
    to_char(data_do_periodo, 'Day') AS dia_semana,
    data_do_periodo,
    praca,
    sub_praca,
    origem,
    periodo,
    SUM(COALESCE(numero_de_corridas_ofertadas, 0)) AS total_corridas_ofertadas,
    SUM(COALESCE(numero_de_corridas_aceitas, 0)) AS total_aceitas,
    SUM(COALESCE(numero_de_corridas_rejeitadas, 0)) AS total_rejeitadas,
    SUM(COALESCE(numero_de_corridas_completadas, 0)) AS total_completadas
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
  GROUP BY 1,2,3,4,5,6,7,8,9
)
-- FULL JOIN entre todos
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
  
  COALESCE(p.segundos_planejados, 0) AS segundos_planejados,
  COALESCE(r.segundos_realizados, 0) AS segundos_realizados
  
FROM planejado_agregado p
FULL JOIN realizado_agregado r USING (ano_iso, semana_numero, dia_iso, dia_semana, data_do_periodo, praca, sub_praca, origem, periodo)
FULL JOIN corridas_agregado c USING (ano_iso, semana_numero, dia_iso, dia_semana, data_do_periodo, praca, sub_praca, origem, periodo);

-- ETAPA 3: Criar índice
SELECT '📊 Criando índice' as info;
CREATE INDEX idx_mv_aderencia_principal ON public.mv_aderencia_agregada (ano_iso, semana_numero, praca, sub_praca, origem);

-- ETAPA 4: Verificar totais GERAIS
SELECT '✅ TOTAIS GERAIS' as info;
SELECT 
  COUNT(*) as registros,
  SUM(total_corridas_ofertadas) as corridas,
  ROUND(SUM(segundos_planejados) / 3600.0, 2) as horas_planejadas,
  ROUND(SUM(segundos_realizados) / 3600.0, 2) as horas_realizadas,
  ROUND((SUM(segundos_realizados)::numeric / NULLIF(SUM(segundos_planejados), 0)::numeric * 100), 2) as aderencia_pct
FROM public.mv_aderencia_agregada;

-- ETAPA 5: Teste Semana 35 GUARULHOS
SELECT '🔍 SEMANA 35 GUARULHOS' as info;
SELECT 
  ROUND(SUM(segundos_planejados) / 3600.0, 2) as horas_planejadas,
  ROUND(SUM(segundos_realizados) / 3600.0, 2) as horas_entregues,
  ROUND((SUM(segundos_realizados)::numeric / NULLIF(SUM(segundos_planejados), 0)::numeric * 100), 2) as aderencia_pct
FROM public.mv_aderencia_agregada
WHERE semana_numero = 35 AND ano_iso = 2025 AND praca = 'GUARULHOS';

-- ETAPA 6: Comparar HORAS ENTREGUES com soma direta da tabela
SELECT '🔬 COMPARAÇÃO - Horas Entregues (S35 GUARULHOS)' as info;
SELECT 
  'Da MV' as fonte,
  ROUND(SUM(segundos_realizados) / 3600.0, 2) as horas_entregues
FROM public.mv_aderencia_agregada
WHERE semana_numero = 35 AND ano_iso = 2025 AND praca = 'GUARULHOS'
UNION ALL
SELECT 
  'Soma direta da tabela' as fonte,
  ROUND(SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0, 2) as horas_entregues
FROM public.dados_corridas
WHERE date_part('week', data_do_periodo) = 35 
  AND date_part('isoyear', data_do_periodo) = 2025
  AND praca = 'GUARULHOS';

-- ETAPA 7: Comparar HORAS PLANEJADAS com distinct manual
SELECT '🔬 COMPARAÇÃO - Horas Planejadas (S35 GUARULHOS)' as info;
SELECT 
  'Da MV' as fonte,
  ROUND(SUM(segundos_planejados) / 3600.0, 2) as horas_planejadas
FROM public.mv_aderencia_agregada
WHERE semana_numero = 35 AND ano_iso = 2025 AND praca = 'GUARULHOS'
UNION ALL
SELECT 
  'Distinct manual (Excel)' as fonte,
  ROUND(SUM(segundos_plan) / 3600.0, 2) as horas_planejadas
FROM (
  SELECT DISTINCT ON (data_do_periodo, periodo)
    numero_minimo_de_entregadores_regulares_na_escala * COALESCE(duracao_segundos, 0) AS segundos_plan
  FROM public.dados_corridas
  WHERE date_part('week', data_do_periodo) = 35 
    AND date_part('isoyear', data_do_periodo) = 2025
    AND praca = 'GUARULHOS'
    AND periodo IS NOT NULL
  ORDER BY data_do_periodo, periodo, numero_minimo_de_entregadores_regulares_na_escala DESC
) sub;

