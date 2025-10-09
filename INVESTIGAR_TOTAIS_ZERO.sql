-- =====================================================================
-- INVESTIGAR: Por que totais estão retornando 0?
-- =====================================================================

-- 1. Ver estrutura das colunas de corridas
SELECT 
  '📊 Colunas de corridas...' as teste,
  COUNT(*) as total_registros,
  COUNT(numero_de_corridas_ofertadas) as tem_ofertadas,
  COUNT(numero_de_corridas_aceitas) as tem_aceitas,
  COUNT(numero_de_corridas_rejeitadas) as tem_rejeitadas,
  COUNT(numero_de_corridas_completadas) as tem_completadas,
  SUM(numero_de_corridas_ofertadas) as soma_ofertadas,
  SUM(numero_de_corridas_aceitas) as soma_aceitas,
  SUM(numero_de_corridas_rejeitadas) as soma_rejeitadas,
  SUM(numero_de_corridas_completadas) as soma_completadas
FROM public.dados_corridas
WHERE data_do_periodo IS NOT NULL;

-- 2. Ver sample de dados
SELECT 
  '📋 Sample de 5 registros...' as teste,
  data_do_periodo,
  praca,
  numero_de_corridas_ofertadas,
  numero_de_corridas_aceitas,
  numero_de_corridas_rejeitadas,
  numero_de_corridas_completadas
FROM public.dados_corridas
WHERE data_do_periodo IS NOT NULL
LIMIT 5;

-- 3. Verificar se as colunas existem
SELECT 
  '🔍 Colunas da tabela...' as teste,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'dados_corridas'
  AND column_name LIKE '%corrida%'
ORDER BY column_name;

-- 4. Testar query de totais diretamente
SELECT 
  '🧪 Teste direto de totais...' as teste,
  COALESCE(SUM(numero_de_corridas_ofertadas), 0) AS corridas_ofertadas,
  COALESCE(SUM(numero_de_corridas_aceitas), 0) AS corridas_aceitas,
  COALESCE(SUM(numero_de_corridas_rejeitadas), 0) AS corridas_rejeitadas,
  COALESCE(SUM(numero_de_corridas_completadas), 0) AS corridas_completadas
FROM public.dados_corridas
WHERE data_do_periodo IS NOT NULL;

