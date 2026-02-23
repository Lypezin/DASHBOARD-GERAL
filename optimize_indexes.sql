
-- ==============================================================================
-- Supabase Index Optimization & Consolidation (Risco Zero / Zero Downtime)
-- ==============================================================================
-- Instrução: Execute este script no SQL Editor do Supabase. Como ele usa CONCURRENTLY,
-- as tabelas NÃO SERÃO BLOQUEADAS e seu dashboard continuará rodando perfeitamente.
-- ==============================================================================

-- 1. Criação dos Índices Consolidados (Supersets)
-- Estes índices cobrirão as queries da maioria das abas (Dashboard, Análise, Resumo, Resultados)

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dados_corridas_consolidado_master 
ON public.dados_corridas USING btree (ano_iso, semana_numero, praca, sub_praca, origem, periodo) 
WHERE (data_do_periodo IS NOT NULL);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dados_corridas_consolidado_data 
ON public.dados_corridas USING btree (data_do_periodo, praca, sub_praca, origem) 
WHERE (data_do_periodo IS NOT NULL);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dados_corridas_consolidado_entregador 
ON public.dados_corridas USING btree (id_da_pessoa_entregadora, data_do_periodo) 
INCLUDE (numero_de_corridas_ofertadas, numero_de_corridas_aceitas, numero_de_corridas_completadas, numero_de_corridas_rejeitadas, tempo_disponivel_absoluto_segundos)
WHERE (data_do_periodo IS NOT NULL);

-- ==============================================================================
-- 2. Remoção de Índices Redundantes (Subsets ou Sobrepostos)
-- Os índices abaixo são englobados pelos índices Master criados na aba 1, 
-- ou por outros índices já existentes de maior performance.
-- ==============================================================================

DROP INDEX CONCURRENTLY IF EXISTS public.idx_dados_corridas_ano_semana_otimizado;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_dados_corridas_ano_semana_praca_otimizado;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_dados_corridas_data_periodo_otimizado;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_dados_corridas_data_filtros_otimizado_v2;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_dados_corridas_filtros_comuns;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_dados_corridas_filtros;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_dados_corridas_filtros_otimizado;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_dados_corridas_origem_data;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_mv_corridas_opt; -- Englobado pelo consolidado_entregador

-- (As outras tabelas possuem cardinalidade saudável de índices)
