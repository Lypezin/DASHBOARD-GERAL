-- ============================================
-- OTIMIZAÇÃO DE ÍNDICES PARA PERFORMANCE
-- Guias: UTR, Entregadores, Valores, Prioridade/Promo
-- ============================================

-- ============================================
-- 1. VERIFICAR ÍNDICES EXISTENTES
-- ============================================

-- Listar índices atuais na tabela dados_corridas
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'dados_corridas'
ORDER BY indexname;

-- Verificar estatísticas de uso de índices
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public' 
  AND tablename = 'dados_corridas'
ORDER BY idx_scan DESC;

-- ============================================
-- 2. CRIAR ÍNDICES OTIMIZADOS PARA INTERVALO DE DATAS
-- ============================================

-- Índice otimizado para intervalo de datas + filtros comuns
-- Usado por: calcular_utr, listar_entregadores, listar_valores_entregadores quando há p_data_inicial/p_data_final
CREATE INDEX IF NOT EXISTS idx_dados_corridas_data_filtros 
ON public.dados_corridas(data_do_periodo, praca, sub_praca, origem)
WHERE data_do_periodo IS NOT NULL 
  AND id_da_pessoa_entregadora IS NOT NULL 
  AND id_da_pessoa_entregadora != '';

-- Índice para queries de entregadores com intervalo de datas
-- Otimiza GROUP BY id_da_pessoa_entregadora com filtros de data
CREATE INDEX IF NOT EXISTS idx_dados_corridas_entregador_data_filtros
ON public.dados_corridas(id_da_pessoa_entregadora, data_do_periodo, praca, sub_praca, origem)
WHERE data_do_periodo IS NOT NULL 
  AND id_da_pessoa_entregadora IS NOT NULL 
  AND id_da_pessoa_entregadora != '';

-- ============================================
-- 3. CRIAR ÍNDICES OTIMIZADOS PARA ANO/SEMANA
-- ============================================

-- Índice otimizado para ano/semana + filtros
-- Usado por: calcular_utr, listar_entregadores, listar_valores_entregadores quando há p_ano/p_semana
CREATE INDEX IF NOT EXISTS idx_dados_corridas_ano_semana_filtros
ON public.dados_corridas(ano_iso, semana_numero, praca, sub_praca, origem)
WHERE ano_iso IS NOT NULL 
  AND semana_numero IS NOT NULL
  AND id_da_pessoa_entregadora IS NOT NULL 
  AND id_da_pessoa_entregadora != '';

-- Índice para entregadores com ano/semana
-- Otimiza GROUP BY id_da_pessoa_entregadora com filtros de ano/semana
CREATE INDEX IF NOT EXISTS idx_dados_corridas_entregador_ano_semana
ON public.dados_corridas(id_da_pessoa_entregadora, ano_iso, semana_numero, praca, sub_praca, origem)
WHERE ano_iso IS NOT NULL 
  AND semana_numero IS NOT NULL
  AND id_da_pessoa_entregadora IS NOT NULL 
  AND id_da_pessoa_entregadora != '';

-- ============================================
-- 4. CRIAR ÍNDICES NAS MATERIALIZED VIEWS
-- ============================================

-- Índice na materialized view de entregadores
-- Usado quando não há intervalo de datas (usa materialized view)
CREATE INDEX IF NOT EXISTS idx_mv_entregadores_data_filtros
ON public.mv_entregadores_agregados(ano_iso, semana_numero, praca, sub_praca, origem);

-- Índice na materialized view de valores
-- Usado quando não há intervalo de datas (usa materialized view)
CREATE INDEX IF NOT EXISTS idx_mv_valores_data_filtros
ON public.mv_valores_entregadores_agregados(ano_iso, semana_numero, praca, sub_praca, origem);

-- ============================================
-- 5. ATUALIZAR ESTATÍSTICAS DO BANCO
-- ============================================

-- Atualizar estatísticas para o otimizador de queries
ANALYZE public.dados_corridas;
ANALYZE public.mv_entregadores_agregados;
ANALYZE public.mv_valores_entregadores_agregados;

-- ============================================
-- 6. VERIFICAR USO DE ÍNDICES (EXPLAIN ANALYZE)
-- ============================================

-- Exemplo de query para verificar uso de índices em listar_entregadores
-- (Execute após criar os índices)
EXPLAIN ANALYZE
SELECT 
  id_da_pessoa_entregadora,
  MAX(pessoa_entregadora) AS nome_entregador,
  SUM(numero_de_corridas_ofertadas)::bigint AS corridas_ofertadas,
  SUM(numero_de_corridas_aceitas)::bigint AS corridas_aceitas
FROM public.dados_corridas
WHERE data_do_periodo >= '2025-01-01' 
  AND data_do_periodo <= '2025-01-31'
  AND praca = 'SP'
  AND id_da_pessoa_entregadora IS NOT NULL
  AND id_da_pessoa_entregadora != ''
GROUP BY id_da_pessoa_entregadora;

-- Exemplo de query para verificar uso de índices com ano/semana
EXPLAIN ANALYZE
SELECT 
  id_da_pessoa_entregadora,
  MAX(pessoa_entregadora) AS nome_entregador,
  SUM(numero_de_corridas_ofertadas)::bigint AS corridas_ofertadas,
  SUM(numero_de_corridas_aceitas)::bigint AS corridas_aceitas
FROM public.dados_corridas
WHERE ano_iso = 2025
  AND semana_numero = 1
  AND praca = 'SP'
  AND id_da_pessoa_entregadora IS NOT NULL
  AND id_da_pessoa_entregadora != ''
GROUP BY id_da_pessoa_entregadora;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Índices compostos têm colunas na ordem de seletividade (mais seletivo primeiro)
-- 2. Índices parciais (WHERE) reduzem tamanho e melhoram performance
-- 3. Materialized views devem ser atualizadas periodicamente
-- 4. Execute ANALYZE após criar índices para atualizar estatísticas
-- 5. Monitore uso de índices com pg_stat_user_indexes

