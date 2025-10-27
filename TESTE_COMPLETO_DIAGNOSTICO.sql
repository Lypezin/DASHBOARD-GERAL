-- =====================================================================
-- TESTE COMPLETO PARA DIAGNOSTICAR DADOS ZERADOS
-- =====================================================================
-- Execute este script no Supabase SQL Editor para diagnosticar o problema

-- PASSO 1: Executar diagnósticos básicos
\i DIAGNOSTICO_DADOS_ZERADOS.sql

-- PASSO 2: Verificar RLS e permissões
\i VERIFICAR_RLS_E_PERMISSOES.sql

-- PASSO 3: Aplicar função com logs
\i DASHBOARD_RESUMO_COM_LOGS.sql

-- PASSO 4: Testar a função com logs
SELECT 'TESTE 1: Sem filtros' as teste;
SELECT public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL);

SELECT 'TESTE 2: Com GUARULHOS' as teste;
SELECT public.dashboard_resumo(NULL, NULL, 'GUARULHOS', NULL, NULL);

SELECT 'TESTE 3: Com semana específica' as teste;
SELECT public.dashboard_resumo(NULL, 43, NULL, NULL, NULL);

-- PASSO 5: Verificar se há problema com case sensitivity
SELECT 'TESTE 4: Verificar case sensitivity' as teste;
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE UPPER(praca) = 'GUARULHOS') as guarulhos_upper,
  COUNT(*) FILTER (WHERE praca = 'GUARULHOS') as guarulhos_exact,
  COUNT(*) FILTER (WHERE praca ILIKE '%guarulhos%') as guarulhos_ilike,
  array_agg(DISTINCT praca) as pracas_distintas
FROM public.dados_corridas
WHERE praca IS NOT NULL
LIMIT 1;

-- PASSO 6: Verificar dados por praça
SELECT 'TESTE 5: Dados por praça' as teste;
SELECT 
  praca,
  COUNT(*) as registros,
  SUM(numero_de_corridas_ofertadas) as total_ofertadas,
  MIN(data_do_periodo) as data_min,
  MAX(data_do_periodo) as data_max
FROM public.dados_corridas
WHERE praca IS NOT NULL
GROUP BY praca
ORDER BY registros DESC
LIMIT 10;

-- PASSO 7: Verificar se há problema com tipos de dados
SELECT 'TESTE 6: Tipos de dados' as teste;
SELECT 
  pg_typeof(numero_de_corridas_ofertadas) as tipo_ofertadas,
  pg_typeof(numero_de_corridas_aceitas) as tipo_aceitas,
  pg_typeof(ano_iso) as tipo_ano,
  pg_typeof(semana_numero) as tipo_semana,
  pg_typeof(praca) as tipo_praca
FROM public.dados_corridas
LIMIT 1;

-- PASSO 8: Teste manual da CTE
SELECT 'TESTE 7: CTE manual' as teste;
WITH filtered_data AS (
  SELECT
    ano_iso,
    semana_numero,
    praca,
    origem,
    numero_de_corridas_ofertadas,
    numero_de_corridas_aceitas,
    numero_de_corridas_completadas
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
    AND praca = 'GUARULHOS'
)
SELECT 
  COUNT(*) as registros_filtrados,
  SUM(numero_de_corridas_ofertadas) as soma_ofertadas,
  SUM(numero_de_corridas_aceitas) as soma_aceitas,
  COUNT(DISTINCT origem) as origens_distintas,
  array_agg(DISTINCT origem) as lista_origens
FROM filtered_data;

SELECT '🎯 DIAGNÓSTICO COMPLETO EXECUTADO!' as resultado;
