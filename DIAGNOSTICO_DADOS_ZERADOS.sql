-- =====================================================================
-- DIAGNÓSTICO: Por que os dados estão zerados?
-- =====================================================================

-- 1. Verificar se há dados na tabela dados_corridas
SELECT 
  '1️⃣ VERIFICAÇÃO: Dados na tabela' as etapa,
  COUNT(*) as total_registros,
  COUNT(DISTINCT praca) as total_pracas,
  COUNT(DISTINCT origem) as total_origens,
  MIN(data_do_periodo) as data_mais_antiga,
  MAX(data_do_periodo) as data_mais_recente
FROM public.dados_corridas;

-- 2. Verificar se há dados com corridas
SELECT 
  '2️⃣ VERIFICAÇÃO: Dados com corridas' as etapa,
  COUNT(*) as registros_com_corridas,
  SUM(numero_de_corridas_ofertadas) as total_ofertadas,
  SUM(numero_de_corridas_aceitas) as total_aceitas,
  SUM(numero_de_corridas_completadas) as total_completadas
FROM public.dados_corridas
WHERE numero_de_corridas_ofertadas > 0 
   OR numero_de_corridas_aceitas > 0 
   OR numero_de_corridas_completadas > 0;

-- 3. Verificar estrutura dos campos
SELECT 
  '3️⃣ VERIFICAÇÃO: Campos nulos' as etapa,
  COUNT(*) as total,
  COUNT(ano_iso) as tem_ano_iso,
  COUNT(semana_numero) as tem_semana_numero,
  COUNT(praca) as tem_praca,
  COUNT(origem) as tem_origem,
  COUNT(numero_de_corridas_ofertadas) as tem_ofertadas
FROM public.dados_corridas;

-- 4. Testar a função dashboard_resumo sem filtros
SELECT 
  '4️⃣ TESTE: dashboard_resumo sem filtros' as etapa;

SELECT public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL) as resultado_sem_filtros;

-- 5. Testar com filtro específico (GUARULHOS)
SELECT 
  '5️⃣ TESTE: dashboard_resumo com GUARULHOS' as etapa;

SELECT public.dashboard_resumo(NULL, NULL, 'GUARULHOS', NULL, NULL) as resultado_guarulhos;

-- 6. Verificar dados específicos de GUARULHOS
SELECT 
  '6️⃣ VERIFICAÇÃO: Dados GUARULHOS' as etapa,
  COUNT(*) as total_registros,
  SUM(numero_de_corridas_ofertadas) as total_ofertadas,
  SUM(numero_de_corridas_aceitas) as total_aceitas,
  COUNT(DISTINCT origem) as origens_distintas,
  array_agg(DISTINCT origem) as lista_origens
FROM public.dados_corridas
WHERE praca = 'GUARULHOS';

-- 7. Verificar se há problema com campos calculados
SELECT 
  '7️⃣ VERIFICAÇÃO: Campos calculados' as etapa,
  COUNT(*) as total,
  COUNT(duracao_segundos) as tem_duracao_segundos,
  COUNT(tempo_disponivel_absoluto_segundos) as tem_tempo_absoluto_segundos,
  AVG(duracao_segundos) as media_duracao_segundos,
  AVG(tempo_disponivel_absoluto_segundos) as media_tempo_absoluto
FROM public.dados_corridas
WHERE praca = 'GUARULHOS';

-- 8. Testar CTE isoladamente
WITH filtered_data AS (
  SELECT
    ano_iso,
    semana_numero,
    dia_iso,
    periodo,
    praca,
    sub_praca,
    origem,
    numero_de_corridas_ofertadas,
    numero_de_corridas_aceitas,
    numero_de_corridas_rejeitadas,
    numero_de_corridas_completadas
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
    AND praca = 'GUARULHOS'
)
SELECT 
  '8️⃣ TESTE: CTE com GUARULHOS' as etapa,
  COUNT(*) as registros_filtrados,
  SUM(numero_de_corridas_ofertadas) as soma_ofertadas,
  SUM(numero_de_corridas_aceitas) as soma_aceitas,
  COUNT(DISTINCT origem) as origens_distintas
FROM filtered_data;

-- 9. Verificar se as funções auxiliares existem
SELECT 
  '9️⃣ VERIFICAÇÃO: Funções auxiliares' as etapa,
  proname as nome_funcao,
  pg_get_function_result(oid) as retorna
FROM pg_proc 
WHERE proname IN ('hhmmss_to_seconds', 'dashboard_resumo', 'listar_dimensoes_dashboard')
ORDER BY proname;
