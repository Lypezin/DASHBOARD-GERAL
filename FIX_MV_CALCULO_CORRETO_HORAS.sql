-- =====================================================================
-- 🔧 CORRIGIR CÁLCULO DE HORAS PLANEJADAS NA MV
-- =====================================================================
-- O problema: estávamos multiplicando horas planejadas por cada origem
-- Solução: usar DISTINCT ON ou MAX para evitar duplicação

-- ETAPA 1: Dropar a MV antiga
-- =====================================================================
DROP MATERIALIZED VIEW IF EXISTS public.mv_aderencia_agregada CASCADE;

-- ETAPA 2: Recriar MV com cálculo correto
-- =====================================================================
SELECT '🔧 Recriando MV com cálculo correto de horas planejadas' as info;

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
  
  -- Agregações de corridas (OK - somar tudo mesmo)
  SUM(COALESCE(numero_de_corridas_ofertadas, 0)) AS total_corridas_ofertadas,
  SUM(COALESCE(numero_de_corridas_aceitas, 0)) AS total_aceitas,
  SUM(COALESCE(numero_de_corridas_rejeitadas, 0)) AS total_rejeitadas,
  SUM(COALESCE(numero_de_corridas_completadas, 0)) AS total_completadas,
  
  -- CORRIGIDO: Para cada grupo (data, praca, sub_praca, origem, periodo)
  -- Pegamos apenas UMA vez o valor de planejamento (usando MAX ou AVG)
  -- porque todas as linhas do mesmo grupo têm o mesmo valor
  MAX(
    numero_minimo_de_entregadores_regulares_na_escala * 
    COALESCE(duracao_segundos, 0)
  ) AS segundos_planejados,
  
  -- Segundos realizados: somar tudo
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

-- ETAPA 3: Criar índice
-- =====================================================================
SELECT '📊 Criando índice na MV' as info;

CREATE INDEX idx_mv_aderencia_principal 
ON public.mv_aderencia_agregada (
  ano_iso, 
  semana_numero, 
  praca, 
  sub_praca, 
  origem
);

-- ETAPA 4: Verificar se os dados estão corretos agora
-- =====================================================================
SELECT '✅ Verificando totais da MV' as info;

SELECT 
  COUNT(*) as registros_na_mv,
  SUM(total_corridas_ofertadas) as soma_corridas,
  SUM(segundos_planejados) / 3600.0 as total_horas_planejadas,
  SUM(segundos_realizados) / 3600.0 as total_horas_realizadas,
  ROUND((SUM(segundos_realizados)::numeric / NULLIF(SUM(segundos_planejados), 0)::numeric * 100), 2) as aderencia_geral_pct
FROM public.mv_aderencia_agregada;

-- ETAPA 5: Testar com uma semana específica
-- =====================================================================
SELECT '🔍 Teste: Semana 35 de 2025' as info;

SELECT 
  semana_numero,
  SUM(segundos_planejados) / 3600.0 as horas_planejadas,
  SUM(segundos_realizados) / 3600.0 as horas_realizadas,
  ROUND((SUM(segundos_realizados)::numeric / NULLIF(SUM(segundos_planejados), 0)::numeric * 100), 2) as aderencia_pct
FROM public.mv_aderencia_agregada
WHERE semana_numero = 35 AND ano_iso = 2025
GROUP BY semana_numero;

-- ETAPA 6: Testar a função dashboard_resumo
-- =====================================================================
SELECT '🎯 Teste final: dashboard_resumo' as info;

SELECT 
  (public.dashboard_resumo(NULL, 35, 'GUARULHOS', NULL, NULL)->'totais'->>'corridas_ofertadas')::bigint as corridas,
  (public.dashboard_resumo(NULL, 35, 'GUARULHOS', NULL, NULL)->'semanal'->0->>'horas_a_entregar') as horas_planejadas,
  (public.dashboard_resumo(NULL, 35, 'GUARULHOS', NULL, NULL)->'semanal'->0->>'horas_entregues') as horas_entregues,
  (public.dashboard_resumo(NULL, 35, 'GUARULHOS', NULL, NULL)->'semanal'->0->>'aderencia_percentual')::numeric as aderencia;

