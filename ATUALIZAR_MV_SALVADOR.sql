-- =====================================================================
-- ATUALIZAR APENAS SALVADOR NA MV
-- =====================================================================
-- Solução: Atualizar só a praça que mudou (muito mais rápido)
-- =====================================================================

DO $$
DECLARE
  v_removidos BIGINT;
  v_inseridos BIGINT;
  v_semanas TEXT[];
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'ATUALIZANDO SALVADOR NA MV';
  RAISE NOTICE '=============================================================';
  
  -- Passo 1: Remover todos os dados antigos de Salvador da MV
  DELETE FROM mv_aderencia_agregada
  WHERE praca = 'SALVADOR';
  
  GET DIAGNOSTICS v_removidos = ROW_COUNT;
  RAISE NOTICE '✓ Removidos % registros antigos de SALVADOR', v_removidos;
  
  -- Passo 2: Inserir dados novos de Salvador na MV
  INSERT INTO mv_aderencia_agregada
  SELECT 
    praca,
    sub_praca,
    semana,
    ano_iso,
    semana_numero,
    data_do_periodo,
    EXTRACT(YEAR FROM data_do_periodo)::INTEGER AS ano,
    EXTRACT(MONTH FROM data_do_periodo)::INTEGER AS mes,
    EXTRACT(DAY FROM data_do_periodo)::INTEGER AS dia,
    
    -- Métricas principais
    SUM(COALESCE(numero_de_corridas_completadas, 0))::BIGINT AS corridas_completadas,
    SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0))::BIGINT AS tempo_disponivel_segundos,
    SUM(COALESCE(tempo_em_corrida_absoluto_segundos, 0))::BIGINT AS tempo_em_corrida_segundos,
    
    -- Aderência
    CASE 
      WHEN SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) > 0 THEN
        (SUM(COALESCE(tempo_em_corrida_absoluto_segundos, 0))::NUMERIC / 
         SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0))::NUMERIC * 100)
      ELSE 0
    END AS aderencia_percentual,
    
    -- Contadores
    COUNT(DISTINCT pessoa_entregadora) AS total_entregadores,
    COUNT(*) AS total_registros

  FROM dados_corridas
  WHERE praca = 'SALVADOR'
    AND data_do_periodo IS NOT NULL
  GROUP BY 
    praca,
    sub_praca,
    semana,
    ano_iso,
    semana_numero,
    data_do_periodo;
  
  GET DIAGNOSTICS v_inseridos = ROW_COUNT;
  RAISE NOTICE '✓ Inseridos % registros novos de SALVADOR', v_inseridos;
  
  -- Passo 3: Verificar semanas de Salvador
  SELECT array_agg(DISTINCT semana ORDER BY semana DESC)
  INTO v_semanas
  FROM (
    SELECT DISTINCT semana 
    FROM mv_aderencia_agregada 
    WHERE praca = 'SALVADOR'
    ORDER BY semana DESC 
    LIMIT 5
  ) sub;
  
  RAISE NOTICE '✓ Últimas 5 semanas de SALVADOR: %', v_semanas;
  
  -- Passo 4: Atualizar estatísticas
  ANALYZE mv_aderencia_agregada;
  
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'SALVADOR ATUALIZADO COM SUCESSO!';
  RAISE NOTICE 'Removidos: %, Inseridos: %', v_removidos, v_inseridos;
  RAISE NOTICE '=============================================================';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERRO: %', SQLERRM;
    RAISE NOTICE 'Código do erro: %', SQLSTATE;
END $$;

