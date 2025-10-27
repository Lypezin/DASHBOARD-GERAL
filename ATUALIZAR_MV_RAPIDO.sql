-- =====================================================================
-- ATUALIZAR MATERIALIZED VIEW SEM TIMEOUT
-- =====================================================================
-- Solução: aumentar timeout temporariamente e usar modo não concorrente
-- =====================================================================

-- Aumentar timeout para 10 minutos (só para esta sessão)
SET statement_timeout = '600000'; -- 10 minutos

-- Atualizar sem CONCURRENTLY (mais rápido, mas bloqueia leitura por alguns segundos)
REFRESH MATERIALIZED VIEW mv_aderencia_agregada;

-- Resetar timeout para o padrão
RESET statement_timeout;

-- Verificar se atualizou
DO $$
DECLARE
  v_total BIGINT;
  v_pracas TEXT[];
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'VERIFICANDO ATUALIZAÇÃO DA MV';
  RAISE NOTICE '=============================================================';
  
  SELECT COUNT(*), array_agg(DISTINCT praca ORDER BY praca)
  INTO v_total, v_pracas
  FROM mv_aderencia_agregada;
  
  RAISE NOTICE '✓ Total de registros: %', v_total;
  RAISE NOTICE '✓ Praças: %', v_pracas;
  
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'MV ATUALIZADA COM SUCESSO!';
  RAISE NOTICE '=============================================================';
END $$;

