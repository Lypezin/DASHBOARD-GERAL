-- =====================================================================
-- TESTE: Ver o que dashboard_resumo está retornando
-- =====================================================================

-- Teste sem filtro (todas as semanas)
SELECT dashboard_resumo(NULL, NULL, 'GUARULHOS', NULL, NULL);

-- Teste com filtro de semana 35
SELECT dashboard_resumo(NULL, 35, 'GUARULHOS', NULL, NULL);

