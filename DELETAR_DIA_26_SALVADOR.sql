-- =====================================================================
-- DELETAR DIA 26/10/2025 DE SALVADOR
-- =====================================================================
-- Remove todos os registros do dia 26 de outubro de 2025 de Salvador
-- =====================================================================

DO $$
DECLARE
  v_deletados BIGINT;
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'DELETANDO DIA 26/10/2025 DE SALVADOR';
  RAISE NOTICE '=============================================================';
  
  -- Deletar da tabela principal
  DELETE FROM dados_corridas
  WHERE praca = 'SALVADOR'
    AND data_do_periodo = '2025-10-26';
  
  GET DIAGNOSTICS v_deletados = ROW_COUNT;
  
  RAISE NOTICE '✓ Registros deletados de dados_corridas: %', v_deletados;
  
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'CONCLUÍDO! Dia 26/10/2025 de SALVADOR foi removido.';
  RAISE NOTICE 'Agora execute ATUALIZAR_EVOLUCAO.sql para atualizar os gráficos.';
  RAISE NOTICE '=============================================================';
END $$;

