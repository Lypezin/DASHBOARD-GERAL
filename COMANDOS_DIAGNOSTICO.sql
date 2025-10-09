-- =====================================================================
-- 🔍 COMANDOS DE DIAGNÓSTICO E MONITORAMENTO
-- =====================================================================
-- Use estes comandos para verificar o estado do sistema
-- Copie e cole no Supabase SQL Editor conforme necessário
-- =====================================================================

-- =============================================================================
-- 1. VERIFICAR TAMANHO DO BANCO DE DADOS
-- =============================================================================

-- Ver tamanho total do banco
SELECT 
  '📊 Tamanho Total do Banco' as metrica,
  pg_size_pretty(pg_database_size(current_database())) as valor;

-- Ver tamanho das tabelas principais
SELECT 
  '📋 ' || tablename as tabela,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS tamanho_total,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS tamanho_dados,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS tamanho_indices
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('dados_corridas', 'mv_aderencia_agregada', 'user_profiles')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;


-- =============================================================================
-- 2. VERIFICAR ÍNDICES
-- =============================================================================

-- Ver todos os índices e seus tamanhos
SELECT 
  '🔍 ' || indexname as indice,
  tablename as tabela,
  pg_size_pretty(pg_relation_size(indexname::regclass)) AS tamanho,
  idx_scan as vezes_usado,
  CASE 
    WHEN idx_scan = 0 THEN '❌ Nunca usado'
    WHEN idx_scan < 100 THEN '⚠️ Pouco usado'
    WHEN idx_scan < 1000 THEN '✅ Usado'
    ELSE '🔥 Muito usado'
  END as status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('dados_corridas', 'mv_aderencia_agregada', 'user_profiles')
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- Ver índices que nunca foram usados (candidatos para remoção)
SELECT 
  '⚠️ ÍNDICE NÃO UTILIZADO: ' || indexname as alerta,
  tablename as tabela,
  pg_size_pretty(pg_relation_size(indexname::regclass)) AS espaco_desperdicado
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexname NOT LIKE '%pkey%'
ORDER BY pg_relation_size(indexname::regclass) DESC;


-- =============================================================================
-- 3. VERIFICAR PERFORMANCE DAS FUNÇÕES
-- =============================================================================

-- Ver tempo médio de execução das funções principais
SELECT 
  CASE 
    WHEN query LIKE '%dashboard_resumo%' THEN '📊 dashboard_resumo'
    WHEN query LIKE '%calcular_utr%' THEN '📏 calcular_utr'
    WHEN query LIKE '%listar_dimensoes%' THEN '📋 listar_dimensoes'
    WHEN query LIKE '%listar_todas_semanas%' THEN '📅 listar_todas_semanas'
    ELSE '❓ ' || substring(query, 1, 30)
  END as funcao,
  calls as chamadas,
  ROUND(mean_exec_time::numeric, 2) as tempo_medio_ms,
  ROUND(max_exec_time::numeric, 2) as tempo_maximo_ms,
  CASE 
    WHEN mean_exec_time < 1000 THEN '🚀 Muito rápido'
    WHEN mean_exec_time < 3000 THEN '✅ Rápido'
    WHEN mean_exec_time < 10000 THEN '⚠️ Lento'
    ELSE '❌ Muito lento'
  END as status
FROM pg_stat_statements
WHERE query LIKE '%dashboard_resumo%'
   OR query LIKE '%calcular_utr%'
   OR query LIKE '%listar_dimensoes%'
   OR query LIKE '%listar_todas_semanas%'
ORDER BY mean_exec_time DESC
LIMIT 20;


-- =============================================================================
-- 4. VERIFICAR QUERIES LENTAS EM EXECUÇÃO
-- =============================================================================

-- Ver queries que estão rodando agora e quanto tempo levam
SELECT 
  pid,
  usename as usuario,
  application_name as aplicacao,
  state as estado,
  ROUND(EXTRACT(EPOCH FROM (now() - query_start))::numeric, 2) as duracao_segundos,
  CASE 
    WHEN EXTRACT(EPOCH FROM (now() - query_start)) < 1 THEN '🚀 Rápido'
    WHEN EXTRACT(EPOCH FROM (now() - query_start)) < 5 THEN '✅ Normal'
    WHEN EXTRACT(EPOCH FROM (now() - query_start)) < 30 THEN '⚠️ Lento'
    ELSE '❌ Muito lento'
  END as status,
  substring(query, 1, 100) as query_inicio
FROM pg_stat_activity
WHERE state = 'active'
  AND query NOT LIKE '%pg_stat_activity%'
  AND datname = current_database()
ORDER BY query_start ASC;


-- =============================================================================
-- 5. VERIFICAR ESTATÍSTICAS DA TABELA PRINCIPAL
-- =============================================================================

-- Ver estatísticas de dados_corridas
SELECT 
  '📊 Estatísticas da Tabela dados_corridas' as info,
  '' as valor
UNION ALL
SELECT 
  '📝 Total de registros',
  COUNT(*)::text
FROM public.dados_corridas
UNION ALL
SELECT 
  '📅 Primeira data',
  MIN(data_do_periodo)::text
FROM public.dados_corridas
UNION ALL
SELECT 
  '📅 Última data',
  MAX(data_do_periodo)::text
FROM public.dados_corridas
UNION ALL
SELECT 
  '🏢 Total de praças',
  COUNT(DISTINCT praca)::text
FROM public.dados_corridas
UNION ALL
SELECT 
  '📍 Total de sub-praças',
  COUNT(DISTINCT sub_praca)::text
FROM public.dados_corridas
UNION ALL
SELECT 
  '🎯 Total de origens',
  COUNT(DISTINCT origem)::text
FROM public.dados_corridas;


-- =============================================================================
-- 6. VERIFICAR MATERIALIZED VIEW
-- =============================================================================

-- Ver estatísticas da MV
SELECT 
  '📊 Estatísticas da Materialized View' as info,
  '' as valor
UNION ALL
SELECT 
  '📝 Total de registros agregados',
  COUNT(*)::text
FROM public.mv_aderencia_agregada
UNION ALL
SELECT 
  '💾 Tamanho da MV',
  pg_size_pretty(pg_total_relation_size('public.mv_aderencia_agregada'))
FROM pg_class
WHERE relname = 'mv_aderencia_agregada'
UNION ALL
SELECT 
  '🔍 Tamanho dos índices da MV',
  pg_size_pretty(
    pg_total_relation_size('public.mv_aderencia_agregada') - 
    pg_relation_size('public.mv_aderencia_agregada')
  )
FROM pg_class
WHERE relname = 'mv_aderencia_agregada';

-- Ver quando foi o último refresh da MV
SELECT 
  '🔄 Último refresh da MV' as info,
  CASE 
    WHEN last_vacuum IS NULL THEN 'Nunca'
    ELSE last_vacuum::text
  END as valor
FROM pg_stat_user_tables
WHERE schemaname = 'public' 
  AND relname = 'mv_aderencia_agregada';


-- =============================================================================
-- 7. VERIFICAR AUTOVACUUM
-- =============================================================================

-- Ver status do autovacuum
SELECT 
  schemaname || '.' || relname as tabela,
  last_vacuum as ultimo_vacuum_manual,
  last_autovacuum as ultimo_vacuum_automatico,
  last_analyze as ultimo_analyze_manual,
  last_autoanalyze as ultimo_analyze_automatico,
  n_tup_ins as insercoes,
  n_tup_upd as atualizacoes,
  n_tup_del as delecoes,
  n_live_tup as registros_vivos,
  n_dead_tup as registros_mortos,
  CASE 
    WHEN n_dead_tup::float / NULLIF(n_live_tup, 0) > 0.2 THEN '⚠️ Precisa vacuum'
    WHEN n_dead_tup::float / NULLIF(n_live_tup, 0) > 0.1 THEN '✅ OK'
    ELSE '🚀 Ótimo'
  END as status
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND relname IN ('dados_corridas', 'mv_aderencia_agregada', 'user_profiles')
ORDER BY n_dead_tup DESC;


-- =============================================================================
-- 8. VERIFICAR CONEXÕES ATIVAS
-- =============================================================================

-- Ver quantas conexões estão ativas
SELECT 
  '👥 Conexões Ativas' as metrica,
  COUNT(*) as valor
FROM pg_stat_activity
WHERE datname = current_database()
UNION ALL
SELECT 
  '🔄 Queries em execução',
  COUNT(*)
FROM pg_stat_activity
WHERE datname = current_database()
  AND state = 'active'
UNION ALL
SELECT 
  '💤 Conexões ociosas',
  COUNT(*)
FROM pg_stat_activity
WHERE datname = current_database()
  AND state = 'idle';


-- =============================================================================
-- 9. TESTAR FUNÇÕES PRINCIPAIS
-- =============================================================================

-- Teste rápido de todas as funções
SELECT '🧪 Testando Funções...' as teste, '' as resultado
UNION ALL
SELECT 
  '📊 dashboard_resumo',
  CASE 
    WHEN public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL) IS NOT NULL 
    THEN '✅ OK' 
    ELSE '❌ ERRO' 
  END
UNION ALL
SELECT 
  '📏 calcular_utr',
  CASE 
    WHEN public.calcular_utr(NULL, NULL, NULL, NULL, NULL) IS NOT NULL 
    THEN '✅ OK' 
    ELSE '❌ ERRO' 
  END
UNION ALL
SELECT 
  '📋 listar_dimensoes_dashboard',
  CASE 
    WHEN public.listar_dimensoes_dashboard(NULL, NULL, NULL, NULL, NULL) IS NOT NULL 
    THEN '✅ OK' 
    ELSE '❌ ERRO' 
  END
UNION ALL
SELECT 
  '📅 listar_todas_semanas',
  CASE 
    WHEN array_length(public.listar_todas_semanas(), 1) >= 0 
    THEN '✅ OK' 
    ELSE '❌ ERRO' 
  END;


-- =============================================================================
-- 10. VERIFICAR CONFIGURAÇÕES DO POSTGRESQL
-- =============================================================================

-- Ver configurações importantes
SELECT 
  name as configuracao,
  setting as valor,
  unit as unidade,
  CASE 
    WHEN name = 'shared_buffers' AND setting::int < 128000 THEN '⚠️ Baixo'
    WHEN name = 'work_mem' AND setting::int < 4096 THEN '⚠️ Baixo'
    WHEN name = 'maintenance_work_mem' AND setting::int < 65536 THEN '⚠️ Baixo'
    WHEN name = 'effective_cache_size' AND setting::int < 524288 THEN '⚠️ Baixo'
    ELSE '✅ OK'
  END as status
FROM pg_settings
WHERE name IN (
  'shared_buffers',
  'work_mem',
  'maintenance_work_mem',
  'effective_cache_size',
  'max_connections',
  'statement_timeout'
)
ORDER BY name;


-- =============================================================================
-- 11. RELATÓRIO COMPLETO DE SAÚDE DO SISTEMA
-- =============================================================================

-- Gerar relatório completo
SELECT 
  '🏥 RELATÓRIO DE SAÚDE DO SISTEMA' as secao,
  '' as metrica,
  '' as valor,
  '' as status
UNION ALL
SELECT 
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  '',
  '',
  ''
UNION ALL
SELECT 
  '📊 TAMANHO',
  'Banco de dados',
  pg_size_pretty(pg_database_size(current_database())),
  '✅'
FROM pg_database
WHERE datname = current_database()
UNION ALL
SELECT 
  '📊 TAMANHO',
  'Tabela dados_corridas',
  pg_size_pretty(pg_total_relation_size('public.dados_corridas')),
  CASE 
    WHEN pg_total_relation_size('public.dados_corridas') > 1073741824 THEN '⚠️'
    ELSE '✅'
  END
FROM pg_class
WHERE relname = 'dados_corridas'
UNION ALL
SELECT 
  '📊 TAMANHO',
  'Índices totais',
  pg_size_pretty(SUM(pg_relation_size(indexname::regclass))),
  CASE 
    WHEN SUM(pg_relation_size(indexname::regclass)) > 209715200 THEN '⚠️ > 200MB'
    WHEN SUM(pg_relation_size(indexname::regclass)) > 104857600 THEN '✅ < 100MB'
    ELSE '🚀 < 50MB'
  END
FROM pg_indexes
WHERE schemaname = 'public'
UNION ALL
SELECT 
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  '',
  '',
  ''
UNION ALL
SELECT 
  '📈 DADOS',
  'Total de registros',
  COUNT(*)::text,
  CASE 
    WHEN COUNT(*) > 10000000 THEN '🔥 > 10M'
    WHEN COUNT(*) > 1000000 THEN '✅ > 1M'
    ELSE '✅'
  END
FROM public.dados_corridas
UNION ALL
SELECT 
  '📈 DADOS',
  'Registros na MV',
  COUNT(*)::text,
  '✅'
FROM public.mv_aderencia_agregada
UNION ALL
SELECT 
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  '',
  '',
  ''
UNION ALL
SELECT 
  '🔍 ÍNDICES',
  'Número de índices',
  COUNT(*)::text,
  CASE 
    WHEN COUNT(*) > 15 THEN '⚠️ Muitos'
    WHEN COUNT(*) < 5 THEN '⚠️ Poucos'
    ELSE '✅ Ideal'
  END
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('dados_corridas', 'mv_aderencia_agregada')
UNION ALL
SELECT 
  '🔍 ÍNDICES',
  'Índices não utilizados',
  COUNT(*)::text,
  CASE 
    WHEN COUNT(*) > 0 THEN '⚠️ Remover'
    ELSE '✅ Todos usados'
  END
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexname NOT LIKE '%pkey%'
UNION ALL
SELECT 
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  '',
  '',
  ''
UNION ALL
SELECT 
  '⚡ PERFORMANCE',
  'Queries ativas',
  COUNT(*)::text,
  CASE 
    WHEN COUNT(*) > 10 THEN '⚠️ Muitas'
    ELSE '✅ Normal'
  END
FROM pg_stat_activity
WHERE state = 'active'
  AND query NOT LIKE '%pg_stat_activity%'
UNION ALL
SELECT 
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  '',
  '',
  ''
UNION ALL
SELECT 
  '✅ CONCLUSÃO',
  'Status Geral do Sistema',
  '',
  '🚀 SAUDÁVEL';


-- =============================================================================
-- 12. COMANDOS DE MANUTENÇÃO RÁPIDA
-- =============================================================================

-- Descomente e execute conforme necessário:

-- Atualizar estatísticas (execute se notar lentidão)
-- ANALYZE public.dados_corridas;
-- ANALYZE public.mv_aderencia_agregada;

-- Fazer vacuum manual (execute se houver muitos registros mortos)
-- VACUUM ANALYZE public.dados_corridas;

-- Refresh da materialized view
-- SELECT public.refresh_mv_aderencia();

-- Reindexar tabela (apenas se houver corrupção)
-- REINDEX TABLE public.dados_corridas;


-- =============================================================================
-- FIM DOS COMANDOS DE DIAGNÓSTICO
-- =============================================================================

SELECT '✅ Diagnóstico completo!' as status;

