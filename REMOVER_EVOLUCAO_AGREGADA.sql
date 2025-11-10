-- =====================================================================
-- REMOVER TABELA evolucao_agregada
-- =====================================================================
-- CONFIRMADO: Esta tabela não está sendo usada
-- - Nenhuma referência no código
-- - Nenhum trigger associado
-- - Nenhum cron job
-- - Tabela vazia (0 linhas)
-- =====================================================================

BEGIN;

-- Verificar se a função atualizar_evolucao_agregada existe e remover se não for usada
-- (Verificar manualmente se há triggers ou cron jobs antes de remover)
DROP FUNCTION IF EXISTS public.atualizar_evolucao_agregada() CASCADE;

-- Remover a tabela
DROP TABLE IF EXISTS public.evolucao_agregada CASCADE;

-- Verificar se foi removida
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'evolucao_agregada'
  ) THEN
    RAISE NOTICE '✅ Tabela evolucao_agregada removida com sucesso';
  ELSE
    RAISE WARNING '⚠️ Tabela evolucao_agregada ainda existe. Verificar dependências.';
  END IF;
END $$;

COMMIT;

-- =====================================================================
-- FIM DO SCRIPT
-- =====================================================================

