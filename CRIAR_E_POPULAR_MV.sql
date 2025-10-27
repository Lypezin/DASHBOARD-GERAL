-- =====================================================================
-- CRIAR E POPULAR MATERIALIZED VIEW
-- =====================================================================
-- Cria a MV se não existir e popula com dados
-- =====================================================================

-- Dropar se existir
DROP MATERIALIZED VIEW IF EXISTS mv_aderencia_agregada CASCADE;

-- Criar MV otimizada
CREATE MATERIALIZED VIEW mv_aderencia_agregada AS
SELECT 
  praca,
  sub_praca,
  ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') AS semana,
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
WHERE data_do_periodo IS NOT NULL
GROUP BY 
  praca,
  sub_praca,
  ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0'),
  ano_iso,
  semana_numero,
  data_do_periodo;

-- Criar índices otimizados
CREATE INDEX idx_mv_praca ON mv_aderencia_agregada (praca);
CREATE INDEX idx_mv_sub_praca ON mv_aderencia_agregada (sub_praca);
CREATE INDEX idx_mv_semana ON mv_aderencia_agregada (semana);
CREATE INDEX idx_mv_data ON mv_aderencia_agregada (data_do_periodo);
CREATE INDEX idx_mv_ano_mes ON mv_aderencia_agregada (ano, mes);
CREATE INDEX idx_mv_ano_semana ON mv_aderencia_agregada (ano_iso, semana_numero);
CREATE INDEX idx_mv_praca_semana ON mv_aderencia_agregada (praca, semana);

-- Atualizar estatísticas
ANALYZE mv_aderencia_agregada;

-- Verificar resultado
DO $$
DECLARE
  v_total BIGINT;
  v_pracas TEXT[];
  v_semanas TEXT[];
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'VERIFICANDO MV CRIADA';
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
  RAISE NOTICE 'MV CRIADA E POPULADA COM SUCESSO!';
  RAISE NOTICE '=============================================================';
END $$;

