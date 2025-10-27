-- =====================================================================
-- DELETAR TODOS OS DADOS DE SALVADOR
-- =====================================================================
-- Remove TODOS os registros de Salvador do sistema
-- ATENÇÃO: Esta operação é irreversível!
-- =====================================================================

DO $$
DECLARE
  v_deletados BIGINT;
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'DELETANDO TODOS OS DADOS DE SALVADOR';
  RAISE NOTICE '=============================================================';
  
  -- Deletar da tabela principal
  DELETE FROM dados_corridas
  WHERE praca = 'SALVADOR';
  
  GET DIAGNOSTICS v_deletados = ROW_COUNT;
  
  RAISE NOTICE '✓ Registros deletados de dados_corridas: %', v_deletados;
  
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'CONCLUÍDO! Todos os dados de SALVADOR foram removidos.';
  RAISE NOTICE 'Agora execute ATUALIZAR_EVOLUCAO.sql para atualizar os gráficos.';
  RAISE NOTICE 'E depois execute: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_aderencia_agregada;';
  RAISE NOTICE '=============================================================';
END $$;

