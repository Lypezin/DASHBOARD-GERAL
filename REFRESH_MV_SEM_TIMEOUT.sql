-- =====================================================================
-- REFRESH MATERIALIZED VIEW SEM TIMEOUT
-- =====================================================================
-- Prepara o ambiente para o REFRESH não dar timeout
-- =====================================================================

-- Passo 1: Remover timeout completamente
SET statement_timeout = '0';

-- Passo 2: Aumentar memória disponível
SET work_mem = '512MB';
SET maintenance_work_mem = '1GB';

-- Passo 3: Desabilitar parallel workers temporariamente (mais estável)
SET max_parallel_workers_per_gather = 0;

-- Passo 4: Executar o REFRESH
REFRESH MATERIALIZED VIEW public.mv_aderencia_agregada;

-- Passo 5: Restaurar configurações
RESET statement_timeout;
RESET work_mem;
RESET maintenance_work_mem;
RESET max_parallel_workers_per_gather;

-- Passo 6: Atualizar estatísticas
ANALYZE public.mv_aderencia_agregada;

-- Verificação
DO $$
DECLARE
  v_total BIGINT;
  v_pracas TEXT[];
  v_semanas TEXT[];
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'VERIFICANDO ATUALIZAÇÃO DA MV';
  RAISE NOTICE '=============================================================';
  
  SELECT COUNT(*) INTO v_total FROM mv_aderencia_agregada;
  RAISE NOTICE '✓ Total de registros: %', v_total;
  
  SELECT array_agg(DISTINCT praca ORDER BY praca)
  INTO v_pracas
  FROM mv_aderencia_agregada;
  RAISE NOTICE '✓ Praças: %', v_pracas;
  
  SELECT array_agg(DISTINCT semana ORDER BY semana DESC)
  INTO v_semanas
  FROM (
    SELECT DISTINCT semana 
    FROM mv_aderencia_agregada 
    ORDER BY semana DESC 
    LIMIT 5
  ) sub;
  RAISE NOTICE '✓ Últimas 5 semanas: %', v_semanas;
  
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'MV ATUALIZADA COM SUCESSO!';
  RAISE NOTICE 'Recarregue o dashboard para ver as mudanças.';
  RAISE NOTICE '=============================================================';
END $$;

