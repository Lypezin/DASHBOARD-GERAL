-- =====================================================
-- LIMPAR FUNÇÃO registrar_atividade
-- Execute ESTE SQL PRIMEIRO para limpar funções duplicadas
-- =====================================================

-- Ver todas as versões da função que existem
SELECT 
  proname as nome_funcao,
  pg_get_function_identity_arguments(oid) as argumentos
FROM pg_proc 
WHERE proname = 'registrar_atividade' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Remover TODAS as versões (execute linha por linha se necessário)
DO $$ 
DECLARE
  func_signature text;
BEGIN
  FOR func_signature IN 
    SELECT 'public.' || proname || '(' || pg_get_function_identity_arguments(oid) || ')'
    FROM pg_proc 
    WHERE proname = 'registrar_atividade' 
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || func_signature || ' CASCADE';
    RAISE NOTICE 'Removida: %', func_signature;
  END LOOP;
END $$;

-- Verificar se foi removida
SELECT COUNT(*) as funcoes_restantes
FROM pg_proc 
WHERE proname = 'registrar_atividade' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Se ainda houver funções, liste-as
SELECT 
  'DROP FUNCTION IF EXISTS public.' || proname || '(' || pg_get_function_identity_arguments(oid) || ') CASCADE;' as comando_manual
FROM pg_proc 
WHERE proname = 'registrar_atividade' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

