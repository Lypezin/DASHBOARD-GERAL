-- =====================================================================
-- TESTE RÁPIDO - VERIFICAR O QUE O BACKEND ESTÁ RETORNANDO
-- =====================================================================

-- 1. Testar dashboard_resumo (ver estrutura do retorno)
SELECT 
  '📊 Testando dashboard_resumo...' as teste,
  jsonb_pretty(public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL)) as resultado;

-- 2. Verificar se dimensoes está retornando array ou objeto
SELECT 
  '🔍 Verificando dimensoes...' as teste,
  jsonb_typeof((public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL))->'dimensoes') as tipo_dimensoes,
  jsonb_typeof((public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL))->'dimensoes'->'pracas') as tipo_pracas,
  jsonb_typeof((public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL))->'dimensoes'->'sub_pracas') as tipo_sub_pracas;

-- 3. Ver sample de dados
SELECT 
  '📋 Sample de dados...' as teste,
  (public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL))->'totais' as totais,
  jsonb_array_length((public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL))->'semanal') as qtd_semanal,
  jsonb_array_length((public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL))->'dia') as qtd_dia;

-- 4. Verificar listar_dimensoes_dashboard
SELECT 
  '🔍 Testando listar_dimensoes_dashboard...' as teste,
  jsonb_pretty(public.listar_dimensoes_dashboard(NULL, NULL, NULL, NULL, NULL)) as resultado;

-- 5. Verificar se há dados na tabela
SELECT 
  '📊 Contagem de dados...' as teste,
  COUNT(*) as total_registros,
  COUNT(DISTINCT praca) as total_pracas,
  COUNT(DISTINCT sub_praca) as total_sub_pracas,
  COUNT(DISTINCT origem) as total_origens
FROM public.dados_corridas
WHERE data_do_periodo IS NOT NULL;

