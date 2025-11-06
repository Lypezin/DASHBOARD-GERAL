-- =====================================================
-- SCRIPT DE TESTE - Funções RPC do Dashboard
-- Execute cada bloco separadamente para identificar problemas
-- =====================================================

-- ✅ TESTE 1: Verificar assinatura das funções
-- Isso mostra os parâmetros que cada função aceita
SELECT 
  routine_name,
  parameter_name,
  data_type,
  parameter_mode,
  ordinal_position
FROM information_schema.parameters
WHERE specific_schema = 'public'
  AND routine_name IN (
    'listar_entregadores',
    'listar_valores_entregadores',
    'listar_evolucao_mensal',
    'listar_evolucao_semanal',
    'listar_utr_semanal'
  )
ORDER BY routine_name, ordinal_position;

-- =====================================================
-- ✅ TESTE 2: listar_evolucao_mensal
-- =====================================================
-- Deve retornar dados de evolução mensal do ano 2024
SELECT * FROM listar_evolucao_mensal(NULL, 2024) LIMIT 5;

-- =====================================================
-- ✅ TESTE 3: listar_evolucao_semanal
-- =====================================================
-- Deve retornar últimas 10 semanas de 2024
SELECT * FROM listar_evolucao_semanal(NULL, 2024, 10) LIMIT 5;

-- =====================================================
-- ✅ TESTE 4: listar_utr_semanal
-- =====================================================
-- Deve retornar UTR das últimas 10 semanas
SELECT * FROM listar_utr_semanal(2024, NULL, 10) LIMIT 5;

-- =====================================================
-- ✅ TESTE 5: listar_entregadores
-- =====================================================
-- Teste com todos os parâmetros NULL
SELECT listar_entregadores(NULL, NULL, NULL, NULL, NULL, NULL);

-- Teste com ano e semana
SELECT listar_entregadores(2024, 1, NULL, NULL, NULL, NULL);

-- =====================================================
-- ✅ TESTE 6: listar_valores_entregadores
-- =====================================================
-- Teste com todos os parâmetros NULL
SELECT listar_valores_entregadores(NULL, NULL, NULL, NULL, NULL, NULL);

-- Teste com ano e semana
SELECT listar_valores_entregadores(2024, 1, NULL, NULL, NULL, NULL);

-- =====================================================
-- ✅ TESTE 7: Verificar se retornam dados
-- =====================================================
-- Este teste mostra se as funções retornam dados ou estão vazias
SELECT 
  'listar_evolucao_mensal' as funcao,
  COUNT(*) as total_registros
FROM listar_evolucao_mensal(NULL, 2024)

UNION ALL

SELECT 
  'listar_evolucao_semanal' as funcao,
  COUNT(*) as total_registros
FROM listar_evolucao_semanal(NULL, 2024, 53)

UNION ALL

SELECT 
  'listar_utr_semanal' as funcao,
  COUNT(*) as total_registros
FROM listar_utr_semanal(2024, NULL, 53);

-- =====================================================
-- ✅ TESTE 8: Verificar estrutura do retorno JSONB
-- =====================================================
-- listar_entregadores deve retornar {"entregadores": [...]}
SELECT 
  jsonb_typeof(listar_entregadores(NULL, NULL, NULL, NULL, NULL, NULL)) as tipo,
  jsonb_typeof(listar_entregadores(NULL, NULL, NULL, NULL, NULL, NULL)->'entregadores') as tipo_array,
  jsonb_array_length(listar_entregadores(NULL, NULL, NULL, NULL, NULL, NULL)->'entregadores') as qtd_entregadores;

-- =====================================================
-- 🔍 DIAGNÓSTICO: Se algum teste falhar
-- =====================================================
-- Execute este comando para ver os erros em detalhes
-- Substitua 'nome_da_funcao' pela função que falhou

-- Exemplo para listar_entregadores:
-- SELECT listar_entregadores(2024, 1, 'São Paulo', NULL, NULL, NULL);

-- Se houver erro, anote a mensagem completa do erro aqui:
-- ERRO: _______________________________________

-- =====================================================
-- ✅ TESTE 9: Verificar dados na tabela base
-- =====================================================
-- Verifica se há dados na tabela dados_corridas
SELECT 
  COUNT(*) as total_registros,
  MIN(data_do_periodo) as data_mais_antiga,
  MAX(data_do_periodo) as data_mais_recente,
  COUNT(DISTINCT ano_iso) as anos_distintos,
  COUNT(DISTINCT semana_numero) as semanas_distintas,
  COUNT(DISTINCT praca) as pracas_distintas
FROM public.dados_corridas
WHERE data_do_periodo IS NOT NULL;

-- =====================================================
-- ✅ TESTE 10: Verificar anos e semanas disponíveis
-- =====================================================
SELECT DISTINCT 
  ano_iso as ano,
  COUNT(DISTINCT semana_numero) as total_semanas
FROM public.dados_corridas
WHERE data_do_periodo IS NOT NULL
  AND ano_iso IS NOT NULL
GROUP BY ano_iso
ORDER BY ano_iso DESC;

