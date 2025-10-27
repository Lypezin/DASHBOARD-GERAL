-- =====================================================================
-- BLOCO 1: CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================================
-- Execute este bloco primeiro
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_dados_corridas_ano_semana 
ON dados_corridas (ano_iso, semana_numero) 
WHERE ano_iso IS NOT NULL AND semana_numero IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dados_corridas_praca 
ON dados_corridas (praca) 
WHERE praca IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dados_corridas_data_periodo 
ON dados_corridas (data_do_periodo) 
WHERE data_do_periodo IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dados_corridas_periodo 
ON dados_corridas (periodo) 
WHERE periodo IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dados_corridas_sub_praca 
ON dados_corridas (sub_praca) 
WHERE sub_praca IS NOT NULL;

-- Atualizar estatísticas
ANALYZE dados_corridas;

-- =====================================================================
-- SUCESSO! Aguarde 10 segundos e execute o BLOCO_2
-- =====================================================================

