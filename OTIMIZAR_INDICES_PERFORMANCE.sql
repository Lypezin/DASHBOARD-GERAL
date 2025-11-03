-- =====================================================================
-- OTIMIZAÇÃO DE PERFORMANCE COM ÍNDICES
-- =====================================================================
-- Criar índices para melhorar performance das queries de filtragem
-- especialmente para múltiplas origens e sub praças
-- =====================================================================

-- Índices para filtros mais comuns
CREATE INDEX IF NOT EXISTS idx_dados_corridas_data_periodo 
ON public.dados_corridas(data_do_periodo) 
WHERE data_do_periodo IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dados_corridas_ano_semana 
ON public.dados_corridas(ano_iso, semana_numero) 
WHERE ano_iso IS NOT NULL AND semana_numero IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dados_corridas_praca 
ON public.dados_corridas(praca) 
WHERE praca IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dados_corridas_sub_praca 
ON public.dados_corridas(sub_praca) 
WHERE sub_praca IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dados_corridas_origem 
ON public.dados_corridas(origem) 
WHERE origem IS NOT NULL;

-- Índices compostos para queries comuns
CREATE INDEX IF NOT EXISTS idx_dados_corridas_filtros_comuns 
ON public.dados_corridas(ano_iso, semana_numero, praca, sub_praca, origem) 
WHERE data_do_periodo IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dados_corridas_entregador_periodo 
ON public.dados_corridas(id_da_pessoa_entregadora, data_do_periodo, periodo) 
WHERE id_da_pessoa_entregadora IS NOT NULL AND data_do_periodo IS NOT NULL;

-- Índice para DISTINCT ON usado em dados_sem_duplicatas
CREATE INDEX IF NOT EXISTS idx_dados_corridas_distinct_periodo 
ON public.dados_corridas(data_do_periodo, periodo, praca, sub_praca, origem, numero_minimo_de_entregadores_regulares_na_escala DESC) 
WHERE data_do_periodo IS NOT NULL;

-- Analisar tabela para otimizar estatísticas
ANALYZE public.dados_corridas;

