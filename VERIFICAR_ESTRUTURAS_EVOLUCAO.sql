-- =====================================================
-- SCRIPT PARA VERIFICAR ESTRUTURAS DE EVOLUÇÃO NO SUPABASE
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Verificar se existem tabelas relacionadas a evolução
SELECT 
  table_name,
  table_type,
  table_schema
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name ILIKE '%evolucao%' 
    OR table_name ILIKE '%evolution%'
    OR table_name ILIKE '%evoluc%'
  )
ORDER BY table_name;

-- 2. Verificar se existem views materializadas relacionadas a evolução
SELECT 
  schemaname,
  matviewname,
  hasindexes,
  ispopulated
FROM pg_matviews
WHERE schemaname = 'public'
  AND (
    matviewname ILIKE '%evolucao%' 
    OR matviewname ILIKE '%evolution%'
    OR matviewname ILIKE '%evoluc%'
  )
ORDER BY matviewname;

-- 3. Verificar se existem views normais relacionadas a evolução
SELECT 
  table_schema,
  table_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND (
    table_name ILIKE '%evolucao%' 
    OR table_name ILIKE '%evolution%'
    OR table_name ILIKE '%evoluc%'
  )
ORDER BY table_name;

-- 4. Verificar funções relacionadas a evolução
SELECT 
  routine_name,
  routine_type,
  data_type AS return_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_name ILIKE '%evolucao%' 
    OR routine_name ILIKE '%evolution%'
    OR routine_name ILIKE '%evoluc%'
  )
ORDER BY routine_name;

-- 5. Verificar todas as tabelas que podem estar relacionadas
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 6. Verificar todas as views materializadas
SELECT 
  schemaname,
  matviewname,
  hasindexes,
  ispopulated,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) AS size
FROM pg_matviews
WHERE schemaname = 'public'
ORDER BY matviewname;

-- 7. Verificar estrutura de uma tabela específica (se existir)
-- Substitua 'nome_da_tabela' pelo nome real
/*
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'nome_da_tabela'
ORDER BY ordinal_position;
*/

-- 8. Verificar se há índices em tabelas de evolução
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    tablename ILIKE '%evolucao%' 
    OR tablename ILIKE '%evolution%'
    OR indexname ILIKE '%evolucao%'
  )
ORDER BY tablename, indexname;

-- 9. Verificar dados de exemplo (se houver tabela de evolução)
-- Descomente e ajuste o nome da tabela se necessário
/*
SELECT * 
FROM nome_da_tabela_evolucao
LIMIT 5;
*/

-- 10. Verificar se há triggers relacionados a evolução
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND (
    trigger_name ILIKE '%evolucao%' 
    OR event_object_table ILIKE '%evolucao%'
  )
ORDER BY event_object_table, trigger_name;

