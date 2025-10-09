-- =====================================================================
-- 🔧 MV COM LÓGICA CORRETA (baseada em dashboard_rpc.sql)
-- =====================================================================

-- ETAPA 1: Dropar MV antiga
DROP MATERIALIZED VIEW IF EXISTS public.mv_aderencia_agregada CASCADE;

-- ETAPA 2: Recriar MV COM LÓGICA CORRETA
SELECT '🔧 Recriando MV com lógica correta (FULL JOIN planejado + realizado)' as info;

CREATE MATERIALIZED VIEW public.mv_aderencia_agregada AS
WITH 
-- Agregar PLANEJADO (sem considerar entregadores individuais, só o total)
planejado AS (
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
    
    -- PLANEJADO: entregadores × duração do período
    SUM(numero_minimo_de_entregadores_regulares_na_escala * COALESCE(duracao_segundos, 0)) AS segundos_planejados
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
  GROUP BY 
    ano_iso, semana_numero, dia_iso, dia_semana, data_do_periodo, 
    praca, sub_praca, origem, periodo
),
-- Agregar REALIZADO (tempo absoluto trabalhado)
realizado AS (
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
    
    -- REALIZADO: tempo absoluto trabalhado
    SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) AS segundos_realizados
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
  GROUP BY 
    ano_iso, semana_numero, dia_iso, dia_semana, data_do_periodo, 
    praca, sub_praca, origem, periodo
),
-- Agregar CORRIDAS
corridas AS (
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
  GROUP BY 
    ano_iso, semana_numero, dia_iso, dia_semana, data_do_periodo, 
    praca, sub_praca, origem, periodo
)
-- FULL JOIN entre todos (evita perder dados e duplicação)
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
  
FROM planejado p
FULL JOIN realizado r 
  ON p.ano_iso = r.ano_iso 
  AND p.semana_numero = r.semana_numero
  AND p.dia_iso = r.dia_iso
  AND p.data_do_periodo = r.data_do_periodo
  AND p.praca = r.praca
  AND COALESCE(p.sub_praca, '') = COALESCE(r.sub_praca, '')
  AND COALESCE(p.origem, '') = COALESCE(r.origem, '')
  AND COALESCE(p.periodo, '') = COALESCE(r.periodo, '')
FULL JOIN corridas c
  ON COALESCE(p.ano_iso, r.ano_iso) = c.ano_iso 
  AND COALESCE(p.semana_numero, r.semana_numero) = c.semana_numero
  AND COALESCE(p.dia_iso, r.dia_iso) = c.dia_iso
  AND COALESCE(p.data_do_periodo, r.data_do_periodo) = c.data_do_periodo
  AND COALESCE(p.praca, r.praca) = c.praca
  AND COALESCE(p.sub_praca, '', r.sub_praca, '') = COALESCE(c.sub_praca, '')
  AND COALESCE(p.origem, '', r.origem, '') = COALESCE(c.origem, '')
  AND COALESCE(p.periodo, '', r.periodo, '') = COALESCE(c.periodo, '');

-- ETAPA 3: Criar índice
SELECT '📊 Criando índice' as info;

CREATE INDEX idx_mv_aderencia_principal 
ON public.mv_aderencia_agregada (ano_iso, semana_numero, praca, sub_praca, origem);

-- ETAPA 4: Verificar totais GERAIS
SELECT '✅ Verificando totais GERAIS' as info;

SELECT 
  'GERAL' as escopo,
  COUNT(*) as registros_na_mv,
  SUM(total_corridas_ofertadas) as soma_corridas,
  ROUND(SUM(segundos_planejados) / 3600.0, 2) as total_horas_planejadas,
  ROUND(SUM(segundos_realizados) / 3600.0, 2) as total_horas_realizadas,
  ROUND((SUM(segundos_realizados)::numeric / NULLIF(SUM(segundos_planejados), 0)::numeric * 100), 2) as aderencia_geral_pct
FROM public.mv_aderencia_agregada;

-- ETAPA 5: Teste Semana 35 GUARULHOS
SELECT '🔍 Teste: Semana 35 GUARULHOS' as info;

SELECT 
  'Semana 35 GUARULHOS' as escopo,
  COUNT(*) as registros,
  ROUND(SUM(segundos_planejados) / 3600.0, 2) as horas_planejadas,
  ROUND(SUM(segundos_realizados) / 3600.0, 2) as horas_entregues,
  ROUND((SUM(segundos_realizados)::numeric / NULLIF(SUM(segundos_planejados), 0)::numeric * 100), 2) as aderencia_pct
FROM public.mv_aderencia_agregada
WHERE semana_numero = 35 AND ano_iso = 2025 AND praca = 'GUARULHOS';

-- ETAPA 6: Comparar com dados brutos da tabela dados_corridas
SELECT '🔬 Comparação com dados brutos (Semana 35 GUARULHOS)' as info;

SELECT 
  'Dados brutos - S35 GUARULHOS' as fonte,
  ROUND(SUM(numero_minimo_de_entregadores_regulares_na_escala * COALESCE(duracao_segundos, 0)) / 3600.0, 2) as horas_planejadas_bruto,
  ROUND(SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0, 2) as horas_realizadas_bruto
FROM public.dados_corridas
WHERE date_part('week', data_do_periodo) = 35 
  AND date_part('isoyear', data_do_periodo) = 2025
  AND praca = 'GUARULHOS';

-- ETAPA 7: Teste função dashboard_resumo
SELECT '🎯 Teste dashboard_resumo (S35 GUARULHOS)' as info;

SELECT jsonb_pretty(
  (public.dashboard_resumo(NULL, 35, 'GUARULHOS', NULL, NULL)->'semanal'->0)
);

