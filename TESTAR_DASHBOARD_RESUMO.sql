-- =====================================================================
-- TESTAR dashboard_resumo DIRETAMENTE
-- =====================================================================

-- Teste 1: Verificar se há dados
SELECT 
  COUNT(*) as total_registros,
  COUNT(DISTINCT praca) as total_pracas,
  COUNT(DISTINCT ano_iso) as total_anos
FROM dados_corridas;

-- Teste 2: Ver amostra de dados
SELECT 
  praca,
  ano_iso,
  semana_numero,
  COUNT(*) as registros,
  SUM(numero_de_corridas_completadas) as corridas
FROM dados_corridas
WHERE ano_iso IS NOT NULL
GROUP BY praca, ano_iso, semana_numero
ORDER BY ano_iso DESC, semana_numero DESC
LIMIT 5;

-- Teste 3: Executar dashboard_resumo e ver resultado
SELECT dashboard_resumo();

-- Teste 4: Executar com filtro de praça específica
SELECT dashboard_resumo(NULL, NULL, 'GUARULHOS', NULL, NULL);

