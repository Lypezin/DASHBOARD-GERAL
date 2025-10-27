-- =====================================================================
-- ATUALIZAR DADOS DA GUIA EVOLUÇÃO
-- =====================================================================
-- Execute este script sempre que fizer upload de novos dados
-- Demora ~30-60 segundos dependendo do volume de dados
-- =====================================================================

SELECT atualizar_evolucao_agregada();

-- =====================================================================
-- VERIFICAR SE ATUALIZOU CORRETAMENTE
-- =====================================================================

DO $$
DECLARE
  v_total_registros BIGINT;
  v_ultimo_ano INTEGER;
  v_ultimas_semanas TEXT[];
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'VERIFICANDO ATUALIZAÇÃO DA EVOLUÇÃO';
  RAISE NOTICE '=============================================================';
  
  -- Total de registros
  SELECT COUNT(*) INTO v_total_registros FROM evolucao_agregada;
  RAISE NOTICE '✓ Total de registros: %', v_total_registros;
  
  -- Último ano disponível
  SELECT MAX(ano) INTO v_ultimo_ano FROM evolucao_agregada;
  RAISE NOTICE '✓ Último ano: %', v_ultimo_ano;
  
  -- Últimas 5 semanas cadastradas
  SELECT array_agg(DISTINCT ano || '-S' || semana ORDER BY ano || '-S' || semana DESC)
  INTO v_ultimas_semanas
  FROM (
    SELECT DISTINCT ano, semana 
    FROM evolucao_agregada 
    WHERE semana IS NOT NULL 
    ORDER BY ano DESC, semana DESC 
    LIMIT 5
  ) sub;
  
  RAISE NOTICE '✓ Últimas 5 semanas: %', v_ultimas_semanas;
  
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'ATUALIZAÇÃO CONCLUÍDA!';
  RAISE NOTICE 'Recarregue a página do dashboard para ver os novos dados.';
  RAISE NOTICE '=============================================================';
END $$;

