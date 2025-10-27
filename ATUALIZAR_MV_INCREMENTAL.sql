-- =====================================================================
-- ATUALIZAR MV DE FORMA INCREMENTAL (SEM TIMEOUT)
-- =====================================================================
-- Estratégia: Atualizar apenas os dados que mudaram
-- Muito mais rápido que REFRESH completo
-- =====================================================================

-- Passo 1: Criar tabela temporária com dados novos/modificados
DO $$
DECLARE
  v_semanas_atualizadas TEXT[];
  v_registros_removidos BIGINT;
  v_registros_inseridos BIGINT;
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'ATUALIZAÇÃO INCREMENTAL DA MV';
  RAISE NOTICE '=============================================================';
  
  -- Aumentar recursos temporariamente
  PERFORM set_config('work_mem', '256MB', true);
  
  -- Identificar semanas que foram modificadas (últimas 4 semanas)
  SELECT array_agg(DISTINCT semana ORDER BY semana DESC)
  INTO v_semanas_atualizadas
  FROM (
    SELECT DISTINCT semana 
    FROM dados_corridas 
    WHERE semana IS NOT NULL
    ORDER BY semana DESC 
    LIMIT 4
  ) sub;
  
  RAISE NOTICE 'Atualizando semanas: %', v_semanas_atualizadas;
  
  -- Remover dados antigos dessas semanas da MV
  DELETE FROM mv_aderencia_agregada
  WHERE semana = ANY(v_semanas_atualizadas);
  
  GET DIAGNOSTICS v_registros_removidos = ROW_COUNT;
  RAISE NOTICE '✓ Removidos % registros antigos', v_registros_removidos;
  
  -- Inserir dados atualizados na MV
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
  WHERE semana = ANY(v_semanas_atualizadas)
    AND data_do_periodo IS NOT NULL
  GROUP BY 
    praca,
    sub_praca,
    semana,
    ano_iso,
    semana_numero,
    data_do_periodo;
  
  GET DIAGNOSTICS v_registros_inseridos = ROW_COUNT;
  RAISE NOTICE '✓ Inseridos % registros novos', v_registros_inseridos;
  
  -- Atualizar estatísticas apenas das colunas modificadas
  ANALYZE mv_aderencia_agregada (semana, praca, data_do_periodo);
  
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'ATUALIZAÇÃO INCREMENTAL CONCLUÍDA!';
  RAISE NOTICE 'Semanas atualizadas: %', v_semanas_atualizadas;
  RAISE NOTICE 'Removidos: %, Inseridos: %', v_registros_removidos, v_registros_inseridos;
  RAISE NOTICE '=============================================================';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERRO: % - %', SQLERRM, SQLSTATE;
    RAISE NOTICE 'Tentando atualização completa (pode demorar)...';
    
    -- Fallback: atualização completa com timeout aumentado
    PERFORM set_config('statement_timeout', '300000', true); -- 5 minutos
    REFRESH MATERIALIZED VIEW mv_aderencia_agregada;
    RAISE NOTICE '✓ Atualização completa finalizada';
END $$;


-- Verificar resultado
DO $$
DECLARE
  v_total BIGINT;
  v_ultimas_semanas TEXT[];
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'VERIFICAÇÃO FINAL';
  RAISE NOTICE '=============================================================';
  
  SELECT COUNT(*) INTO v_total FROM mv_aderencia_agregada;
  RAISE NOTICE '✓ Total de registros na MV: %', v_total;
  
  SELECT array_agg(DISTINCT semana ORDER BY semana DESC)
  INTO v_ultimas_semanas
  FROM (
    SELECT DISTINCT semana 
    FROM mv_aderencia_agregada 
    ORDER BY semana DESC 
    LIMIT 5
  ) sub;
  
  RAISE NOTICE '✓ Últimas 5 semanas na MV: %', v_ultimas_semanas;
  
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'PRONTO! Recarregue o dashboard.';
  RAISE NOTICE '=============================================================';
END $$;

