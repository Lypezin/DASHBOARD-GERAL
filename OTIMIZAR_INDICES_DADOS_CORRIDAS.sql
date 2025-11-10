-- =====================================================================
-- SCRIPT DE OTIMIZAÇÃO DE ÍNDICES - dados_corridas
-- =====================================================================
-- ATENÇÃO: Execute este script com cuidado e faça backup antes!
-- =====================================================================
-- Este script remove índices não utilizados e duplicados
-- Economia estimada: ~650 MB (49% de redução)
-- =====================================================================

BEGIN;

-- =====================================================================
-- FASE 1: REMOVER ÍNDICES NUNCA UTILIZADOS (0 scans)
-- =====================================================================
-- Economia: ~600 MB

-- Índices grandes nunca utilizados
DROP INDEX IF EXISTS public.idx_dados_corridas_entregador_periodo; -- 141 MB, 0 scans
DROP INDEX IF EXISTS public.idx_dados_corridas_taxas; -- 110 MB, 0 scans
DROP INDEX IF EXISTS public.idx_dados_agregacao_otimizado; -- 95 MB, 0 scans
DROP INDEX IF EXISTS public.idx_dados_utr_otimizado; -- 88 MB, 0 scans
DROP INDEX IF EXISTS public.idx_dados_corridas_filtros_entregadores; -- 32 MB, 0 scans

-- Índices médios nunca utilizados
DROP INDEX IF EXISTS public.idx_dados_corridas_distinct; -- 19 MB, 0 scans
DROP INDEX IF EXISTS public.idx_dados_dia_iso; -- 16 MB, 0 scans
DROP INDEX IF EXISTS public.idx_dados_corridas_isoyear_week; -- 16 MB, 0 scans
DROP INDEX IF EXISTS public.idx_dados_ano_iso; -- 16 MB, 0 scans
DROP INDEX IF EXISTS public.idx_dados_corridas_dia_iso; -- 15 MB, 0 scans

-- Índices pequenos nunca utilizados
DROP INDEX IF EXISTS public.idx_dados_corridas_sub_praca_data; -- 13 MB, 0 scans
DROP INDEX IF EXISTS public.idx_dados_corridas_pessoa; -- 13 MB, 0 scans
DROP INDEX IF EXISTS public.idx_dados_corridas_praca_data; -- 12 MB, 0 scans
DROP INDEX IF EXISTS public.idx_dados_corridas_filtros_principais; -- 12 MB, 0 scans
DROP INDEX IF EXISTS public.idx_dados_periodo; -- 12 MB, 0 scans
DROP INDEX IF EXISTS public.idx_dados_data_periodo; -- 12 MB, 0 scans

-- =====================================================================
-- FASE 2: REMOVER ÍNDICES DUPLICADOS
-- =====================================================================
-- Economia: ~50 MB

-- Duplicatas de (praca, ano_iso, semana_numero)
-- Manter: idx_dados_corridas_praca_ano_semana (655 scans)
DROP INDEX IF EXISTS public.idx_dados_praca_ano_semana; -- 12 MB, 86 scans (duplicata)
DROP INDEX IF EXISTS public.idx_dados_corridas_praca_semana; -- 12 MB, 82 scans (duplicata)

-- Duplicatas de data_do_periodo
-- Manter: idx_dados_corridas_data_periodo (4,187 scans) - O MAIS USADO
DROP INDEX IF EXISTS public.idx_dados_corridas_data_do_periodo; -- 16 MB, 5 scans (duplicata)
DROP INDEX IF EXISTS public.idx_dados_corridas_data_simples; -- 12 MB, 11 scans (duplicata)
DROP INDEX IF EXISTS public.idx_dados_corridas_data; -- 12 MB, 78 scans (duplicata)
DROP INDEX IF EXISTS public.idx_dados_corridas_data_basico; -- 12 MB, 13 scans (duplicata)

-- Duplicatas de (ano_iso, semana_numero)
-- Manter: idx_dados_corridas_ano_semana (1,070 scans) - O MAIS USADO
DROP INDEX IF EXISTS public.idx_dados_corridas_ano_semana_basico; -- 12 MB, 408 scans (duplicata)
DROP INDEX IF EXISTS public.idx_dados_corridas_ano_semana_praca; -- 12 MB, 83 scans (duplicata)

-- =====================================================================
-- VERIFICAÇÃO FINAL
-- =====================================================================

-- Verificar índices restantes
DO $$
DECLARE
  v_count INTEGER;
  v_total_size BIGINT;
BEGIN
  -- Contar índices restantes
  SELECT COUNT(*) INTO v_count
  FROM pg_indexes
  WHERE schemaname = 'public' 
    AND tablename = 'dados_corridas';
  
  -- Calcular tamanho total dos índices
  SELECT COALESCE(SUM(pg_relation_size(indexname::regclass)), 0) INTO v_total_size
  FROM pg_indexes
  WHERE schemaname = 'public' 
    AND tablename = 'dados_corridas';
  
  RAISE NOTICE 'Índices restantes: %', v_count;
  RAISE NOTICE 'Tamanho total dos índices: %', pg_size_pretty(v_total_size);
END $$;

COMMIT;

-- =====================================================================
-- NOTAS IMPORTANTES
-- =====================================================================
-- 
-- ✅ ÍNDICES MANTIDOS (ESSENCIAIS):
-- - idx_dados_corridas_id_entregador (9,005 scans)
-- - idx_dados_corridas_praca (4,226 scans)
-- - idx_dados_corridas_data_periodo (4,187 scans)
-- - idx_dados_corridas_periodo (306 scans)
-- - idx_dados_evolucao_semanal (1,708 scans)
-- - idx_dados_corridas_admin_optimized (190 scans)
-- - idx_dados_evolucao_mensal (9 scans, mas lê 9.5M tuples)
-- - idx_dados_corridas_praca_ano_semana (655 scans)
-- - idx_dados_corridas_ano_semana (1,070 scans)
-- - idx_dados_filtro_principal (75 scans)
-- - idx_dados_corridas_filtros_comuns (13 scans)
-- - idx_dados_corridas_admin_completo (8 scans)
-- - idx_dados_corridas_origem_data (12 scans)
-- - idx_dados_corridas_distinct_periodo (13 scans)
-- - idx_dados_corridas_origem (125 scans)
-- - idx_dados_corridas_sub_praca (205 scans)
-- - idx_dados_corridas_semana_numero (566 scans)
-- - idx_dados_ano_iso_simples (73 scans)
-- - dados_corridas_pkey (PRIMARY KEY - sempre manter)
--
-- ⚠️ APÓS EXECUTAR:
-- 1. Monitorar performance das queries
-- 2. Verificar se alguma query ficou mais lenta
-- 3. Se necessário, recriar índices específicos
--
-- =====================================================================
-- FIM DO SCRIPT
-- =====================================================================

