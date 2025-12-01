-- Verificar se existem múltiplas versões da função dashboard_resumo
-- Execute no SQL Editor

SELECT 
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments,
    pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'dashboard_resumo'
ORDER BY p.oid;
