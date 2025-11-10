-- =====================================================================
-- SCRIPT PARA REMOVER RECURSOS NÃO USADOS DO SUPABASE
-- =====================================================================
-- ATENÇÃO: Execute este script com cuidado e faça backup antes!
-- =====================================================================
-- Este script remove apenas recursos que foram confirmados como não usados
-- =====================================================================

-- =====================================================================
-- 1. REMOVER FUNÇÕES DE DEBUG
-- =====================================================================
-- Estas funções são claramente para debug e não são usadas em produção

DROP FUNCTION IF EXISTS public.debug_dados_semana_35();
DROP FUNCTION IF EXISTS public.debug_entregadores_dados();

-- =====================================================================
-- 2. REMOVER TABELA VAZIA
-- =====================================================================
-- A tabela evolucao_agregada está vazia e não tem dependências

-- Verificar se não há dependências antes de remover
DO $$
BEGIN
  -- Verificar se há views ou outras dependências
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_depend d
    JOIN pg_class c ON d.refobjid = c.oid
    WHERE c.relname = 'evolucao_agregada'
      AND c.relnamespace = 'public'::regnamespace
  ) THEN
    DROP TABLE IF EXISTS public.evolucao_agregada CASCADE;
    RAISE NOTICE 'Tabela evolucao_agregada removida com sucesso';
  ELSE
    RAISE WARNING 'Tabela evolucao_agregada tem dependências. Não removida.';
  END IF;
END $$;

-- =====================================================================
-- 3. VERIFICAR FUNÇÕES NÃO USADAS (NÃO REMOVER AINDA)
-- =====================================================================
-- As seguintes funções não foram encontradas no código, mas podem ser usadas
-- por triggers, cron jobs, ou outras funções. Verificar manualmente antes de remover:

-- Funções que podem ser usadas por outras funções:
-- - hhmmss_to_seconds
-- - normalize_time_to_hhmmss
-- - to_hhmmss
-- - split_text

-- Funções que podem ser usadas por cron jobs:
-- - limpar_atividades_antigas
-- - refresh_all_materialized_views
-- - refresh_dashboard_mvs
-- - refresh_mv_aderencia
-- - atualizar_evolucao_agregada

-- Funções que podem ser usadas no futuro:
-- - historico_atividades_usuario
-- - listar_dimensoes_dashboard
-- - listar_utr_semanal

-- =====================================================================
-- 4. VERIFICAR FUNÇÕES OTIMIZADAS
-- =====================================================================
-- Considerar substituir funções antigas por versões otimizadas:

-- list_all_users_optimized vs list_all_users
-- list_pracas_disponiveis_otimizada vs list_pracas_disponiveis

-- =====================================================================
-- 5. NOTAS IMPORTANTES
-- =====================================================================
-- 
-- ⚠️ NÃO REMOVER:
-- - Tabela user_activities (tem dados históricos importantes)
-- - Qualquer função usada por triggers (ver seção 8 do ANALISE_SUPABASE.md)
-- - Qualquer função usada por materialized views
-- - Qualquer função RPC que está sendo chamada no código
--
-- ✅ PODE REMOVER (após confirmação):
-- - Funções de debug (já removidas acima)
-- - Tabela evolucao_agregada (já removida acima)
--
-- =====================================================================
-- FIM DO SCRIPT
-- =====================================================================

