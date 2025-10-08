-- =====================================================================
-- OTIMIZAÇÕES DE PERFORMANCE PARA 2M+ REGISTROS
-- =====================================================================
-- Execute estas queries no Supabase SQL Editor para otimizar o banco
-- para grandes volumes de dados.
-- =====================================================================

-- 1. VERIFICAR TAMANHO ATUAL DA TABELA E ÍNDICES
-- =====================================================================
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS tamanho_total,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS tamanho_dados,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS tamanho_indices
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'dados_corridas';


-- 2. VERIFICAR ÍNDICES EXISTENTES
-- =====================================================================
SELECT 
  indexname,
  indexdef,
  pg_size_pretty(pg_relation_size(indexname::regclass)) AS tamanho_indice
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'dados_corridas';


-- 3. CRIAR ÍNDICES COMPOSTOS ADICIONAIS PARA QUERIES FILTRADAS
-- =====================================================================
-- Índice composto para filtros de ano + semana (query mais comum)
CREATE INDEX IF NOT EXISTS idx_dados_corridas_ano_semana 
  ON public.dados_corridas (ano_iso, semana_numero) 
  WHERE ano_iso IS NOT NULL AND semana_numero IS NOT NULL;

-- Índice composto para praça + sub_praça
CREATE INDEX IF NOT EXISTS idx_dados_corridas_praca_sub 
  ON public.dados_corridas (praca, sub_praca) 
  WHERE praca IS NOT NULL;

-- Índice para queries de tempo disponível > 0 (usado frequentemente)
CREATE INDEX IF NOT EXISTS idx_dados_corridas_tempo_disponivel 
  ON public.dados_corridas (tempo_disponivel_absoluto_segundos) 
  WHERE tempo_disponivel_absoluto_segundos > 0;


-- 4. ATUALIZAR ESTATÍSTICAS DO BANCO
-- =====================================================================
-- Execute após cada grande importação de dados
ANALYZE public.dados_corridas;
ANALYZE public.mv_aderencia_agregada;


-- 5. VERIFICAR SAÚDE DOS ÍNDICES
-- =====================================================================
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as scans_realizados,
  idx_tup_read as tuplas_lidas,
  idx_tup_fetch as tuplas_retornadas,
  pg_size_pretty(pg_relation_size(indexrelid)) as tamanho
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' AND tablename = 'dados_corridas'
ORDER BY idx_scan DESC;


-- 6. CONFIGURAÇÕES DE TIMEOUT PARA A MATERIALIZED VIEW
-- =====================================================================
-- Aumentar timeout para refresh da materialized view
ALTER FUNCTION public.refresh_mv_aderencia() 
  SET statement_timeout = '180000ms';  -- 3 minutos


-- 7. VACUUM E REINDEX (Executar mensalmente ou após grandes exclusões)
-- =====================================================================
-- ATENÇÃO: Execute em horários de baixo uso
-- VACUUM ANALYZE public.dados_corridas;
-- REINDEX TABLE CONCURRENTLY public.dados_corridas;


-- 8. MONITORAR QUERIES LENTAS
-- =====================================================================
-- Habilitar log de queries lentas (> 1 segundo)
-- IMPORTANTE: Isto só pode ser feito por superuser/administrador Supabase
-- ALTER DATABASE postgres SET log_min_duration_statement = 1000;


-- 9. PARTICIONAMENTO DE TABELA (OPCIONAL - PARA 5M+ REGISTROS)
-- =====================================================================
-- Se você espera crescer para 5M+ registros, considere particionar a tabela por ano
-- Isto requer recriação da tabela principal. Exemplo:

/*
-- Criar tabela particionada (NÃO EXECUTAR AINDA - APENAS REFERÊNCIA)
CREATE TABLE public.dados_corridas_partitioned (
    LIKE public.dados_corridas INCLUDING ALL
) PARTITION BY RANGE (ano_iso);

-- Criar partições por ano
CREATE TABLE public.dados_corridas_2024 PARTITION OF public.dados_corridas_partitioned
    FOR VALUES FROM (2024) TO (2025);

CREATE TABLE public.dados_corridas_2025 PARTITION OF public.dados_corridas_partitioned
    FOR VALUES FROM (2025) TO (2026);

-- Migrar dados (fazer em horário de manutenção)
-- INSERT INTO public.dados_corridas_partitioned SELECT * FROM public.dados_corridas;
*/


-- 10. VERIFICAR PERFORMANCE DO DASHBOARD_RESUMO
-- =====================================================================
-- Testar performance da função principal
EXPLAIN ANALYZE 
SELECT * FROM public.dashboard_resumo(
  p_ano := NULL,
  p_semana := NULL,
  p_praca := NULL,
  p_sub_praca := NULL,
  p_origem := NULL
);


-- 11. CONFIGURAR AUTOVACUUM MAIS AGRESSIVO PARA TABELA GRANDE
-- =====================================================================
ALTER TABLE public.dados_corridas SET (
  autovacuum_vacuum_scale_factor = 0.05,  -- vacuum quando 5% da tabela mudar
  autovacuum_analyze_scale_factor = 0.02, -- analyze quando 2% da tabela mudar
  autovacuum_vacuum_cost_delay = 10       -- acelerar autovacuum
);


-- 12. REFRESH AUTOMÁTICO DA MATERIALIZED VIEW (OPCIONAL)
-- =====================================================================
-- Criar função para refresh agendado via pg_cron (se disponível no Supabase)
/*
-- Agendar refresh diário às 2h da manhã
SELECT cron.schedule(
  'refresh-mv-aderencia',
  '0 2 * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_aderencia_agregada'
);
*/


-- =====================================================================
-- RECOMENDAÇÕES ADICIONAIS
-- =====================================================================
-- 1. Configure um job externo (GitHub Actions, Vercel Cron) para refresh 
--    da materialized view após grandes importações
-- 2. Monitore o tamanho do banco no Supabase Dashboard
-- 3. Configure alertas quando o banco atingir 80% da capacidade
-- 4. Considere arquivar dados com mais de 1 ano em outra tabela
-- 5. Use connection pooling (já ativado no Supabase por padrão)


-- =====================================================================
-- STATUS ATUAL DO SISTEMA
-- =====================================================================
-- Execute para ver estatísticas gerais
SELECT 
  (SELECT COUNT(*) FROM public.dados_corridas) as total_registros,
  (SELECT pg_size_pretty(pg_database_size(current_database()))) as tamanho_banco,
  (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') as conexoes_ativas,
  (SELECT version()) as postgres_version;
