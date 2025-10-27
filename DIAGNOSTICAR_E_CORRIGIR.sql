-- =====================================================================
-- DIAGNÓSTICO E CORREÇÃO COMPLETA
-- =====================================================================

-- PASSO 1: Verificar se há dados
DO $$
DECLARE
  v_count BIGINT;
  v_sample RECORD;
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'DIAGNÓSTICO';
  RAISE NOTICE '=============================================================';
  
  -- Contar registros
  SELECT COUNT(*) INTO v_count FROM dados_corridas;
  RAISE NOTICE '✓ Total registros em dados_corridas: %', v_count;
  
  IF v_count = 0 THEN
    RAISE NOTICE '❌ TABELA VAZIA! Faça upload de dados.';
    RETURN;
  END IF;
  
  -- Ver amostra de dados
  SELECT 
    praca,
    ano_iso,
    semana_numero,
    COUNT(*) as total
  INTO v_sample
  FROM dados_corridas
  GROUP BY praca, ano_iso, semana_numero
  ORDER BY ano_iso DESC, semana_numero DESC
  LIMIT 1;
  
  RAISE NOTICE '✓ Última semana: Praça=%, Ano=%, Semana=%, Total=%', 
    v_sample.praca, v_sample.ano_iso, v_sample.semana_numero, v_sample.total;
  
END $$;

-- PASSO 2: Testar a função dashboard_resumo
DO $$
DECLARE
  v_result JSONB;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'TESTANDO dashboard_resumo()';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
  
  -- Tentar executar
  BEGIN
    SELECT dashboard_resumo() INTO v_result;
    
    RAISE NOTICE 'Totais: %', v_result->'totais';
    RAISE NOTICE 'Semanas count: %', jsonb_array_length(v_result->'semanal');
    RAISE NOTICE 'Dimensões: %', v_result->'dimensoes';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ ERRO: %', SQLERRM;
  END;
  
END $$;

-- PASSO 3: RECRIAR FUNÇÃO DEFINITIVA
DROP FUNCTION IF EXISTS public.dashboard_resumo(INTEGER, INTEGER, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.dashboard_resumo(
  p_ano INTEGER DEFAULT NULL,
  p_semana INTEGER DEFAULT NULL,
  p_praca TEXT DEFAULT NULL,
  p_sub_praca TEXT DEFAULT NULL,
  p_origem TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN := true;
  v_assigned_pracas TEXT[] := ARRAY[]::TEXT[];
  v_totais JSONB;
  v_semanal JSONB;
  v_dia JSONB;
  v_sub_praca JSONB;
  v_dimensoes JSONB;
BEGIN
  -- Buscar usuário
  v_user_id := auth.uid();
  
  IF v_user_id IS NOT NULL THEN
    BEGIN
      SELECT is_admin, COALESCE(assigned_pracas, ARRAY[]::TEXT[])
      INTO v_is_admin, v_assigned_pracas
      FROM user_profiles
      WHERE id = v_user_id;
    EXCEPTION WHEN OTHERS THEN
      v_is_admin := true;
      v_assigned_pracas := ARRAY[]::TEXT[];
    END;
  END IF;
  
  -- TOTAIS
  SELECT jsonb_build_object(
    'corridas_ofertadas', COALESCE(SUM(numero_de_corridas_completadas), 0),
    'corridas_aceitas', COALESCE(SUM(numero_de_corridas_completadas), 0),
    'corridas_rejeitadas', 0,
    'corridas_completadas', COALESCE(SUM(numero_de_corridas_completadas), 0)
  )
  INTO v_totais
  FROM dados_corridas
  WHERE (p_ano IS NULL OR ano_iso = p_ano)
    AND (p_semana IS NULL OR semana_numero = p_semana)
    AND (p_praca IS NULL OR praca = p_praca)
    AND (v_is_admin OR (v_assigned_pracas IS NOT NULL AND array_length(v_assigned_pracas, 1) > 0 AND praca = ANY(v_assigned_pracas)));
  
  -- SEMANAL
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO v_semanal
  FROM (
    SELECT 
      ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') AS semana,
      ROUND(SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_a_entregar,
      ROUND(SUM(COALESCE(tempo_em_corrida_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_entregues,
      ROUND(
        CASE WHEN SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) > 0 
        THEN (SUM(COALESCE(tempo_em_corrida_absoluto_segundos, 0))::NUMERIC / SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0))::NUMERIC * 100)
        ELSE 0 END, 1
      ) AS aderencia_percentual
    FROM dados_corridas
    WHERE (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (v_is_admin OR (v_assigned_pracas IS NOT NULL AND array_length(v_assigned_pracas, 1) > 0 AND praca = ANY(v_assigned_pracas)))
      AND ano_iso IS NOT NULL
      AND semana_numero IS NOT NULL
    GROUP BY ano_iso, semana_numero
    ORDER BY ano_iso DESC, semana_numero DESC
    LIMIT 15
  ) t;
  
  -- DIA
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO v_dia
  FROM (
    SELECT 
      EXTRACT(ISODOW FROM data_do_periodo)::INTEGER AS dia_iso,
      TO_CHAR(data_do_periodo, 'TMDay') AS dia_da_semana,
      ROUND(SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_a_entregar,
      ROUND(SUM(COALESCE(tempo_em_corrida_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_entregues,
      ROUND(
        CASE WHEN SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) > 0 
        THEN (SUM(COALESCE(tempo_em_corrida_absoluto_segundos, 0))::NUMERIC / SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0))::NUMERIC * 100)
        ELSE 0 END, 1
      ) AS aderencia_percentual,
      COALESCE(SUM(numero_de_corridas_completadas), 0) AS corridas_completadas
    FROM dados_corridas
    WHERE (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (v_is_admin OR (v_assigned_pracas IS NOT NULL AND array_length(v_assigned_pracas, 1) > 0 AND praca = ANY(v_assigned_pracas)))
      AND data_do_periodo IS NOT NULL
    GROUP BY EXTRACT(ISODOW FROM data_do_periodo), TO_CHAR(data_do_periodo, 'TMDay')
    ORDER BY dia_iso
  ) t;
  
  -- SUB PRAÇA
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO v_sub_praca
  FROM (
    SELECT 
      sub_praca,
      ROUND(SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_a_entregar,
      ROUND(SUM(COALESCE(tempo_em_corrida_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_entregues,
      ROUND(
        CASE WHEN SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) > 0 
        THEN (SUM(COALESCE(tempo_em_corrida_absoluto_segundos, 0))::NUMERIC / SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0))::NUMERIC * 100)
        ELSE 0 END, 1
      ) AS aderencia_percentual,
      COALESCE(SUM(numero_de_corridas_completadas), 0) AS corridas_completadas
    FROM dados_corridas
    WHERE (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (v_is_admin OR (v_assigned_pracas IS NOT NULL AND array_length(v_assigned_pracas, 1) > 0 AND praca = ANY(v_assigned_pracas)))
      AND sub_praca IS NOT NULL
    GROUP BY sub_praca
    ORDER BY sub_praca
    LIMIT 50
  ) t;
  
  -- DIMENSÕES
  v_dimensoes := jsonb_build_object(
    'anos', (
      SELECT COALESCE(jsonb_agg(DISTINCT ano_iso ORDER BY ano_iso DESC), '[]'::jsonb) 
      FROM dados_corridas 
      WHERE ano_iso IS NOT NULL 
        AND (v_is_admin OR (v_assigned_pracas IS NOT NULL AND array_length(v_assigned_pracas, 1) > 0 AND praca = ANY(v_assigned_pracas)))
    ),
    'semanas', (
      SELECT COALESCE(jsonb_agg(DISTINCT ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') ORDER BY ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') DESC), '[]'::jsonb) 
      FROM dados_corridas 
      WHERE ano_iso IS NOT NULL AND semana_numero IS NOT NULL
        AND (v_is_admin OR (v_assigned_pracas IS NOT NULL AND array_length(v_assigned_pracas, 1) > 0 AND praca = ANY(v_assigned_pracas)))
    ),
    'pracas', (
      SELECT COALESCE(jsonb_agg(DISTINCT praca ORDER BY praca), '[]'::jsonb) 
      FROM dados_corridas 
      WHERE v_is_admin OR (v_assigned_pracas IS NOT NULL AND array_length(v_assigned_pracas, 1) > 0 AND praca = ANY(v_assigned_pracas))
    ),
    'sub_pracas', (
      SELECT COALESCE(jsonb_agg(DISTINCT sub_praca ORDER BY sub_praca), '[]'::jsonb) 
      FROM dados_corridas 
      WHERE sub_praca IS NOT NULL 
        AND (v_is_admin OR (v_assigned_pracas IS NOT NULL AND array_length(v_assigned_pracas, 1) > 0 AND praca = ANY(v_assigned_pracas)))
    ),
    'origens', '[]'::jsonb
  );
  
  -- RETORNAR TUDO
  RETURN jsonb_build_object(
    'totais', v_totais,
    'semanal', v_semanal,
    'dia', v_dia,
    'turno', '[]'::jsonb,
    'sub_praca', v_sub_praca,
    'origem', '[]'::jsonb,
    'dimensoes', v_dimensoes
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'totais', jsonb_build_object('corridas_ofertadas', 0, 'corridas_aceitas', 0, 'corridas_rejeitadas', 0, 'corridas_completadas', 0),
      'semanal', '[]'::jsonb,
      'dia', '[]'::jsonb,
      'turno', '[]'::jsonb,
      'sub_praca', '[]'::jsonb,
      'origem', '[]'::jsonb,
      'dimensoes', jsonb_build_object('anos', '[]'::jsonb, 'semanas', '[]'::jsonb, 'pracas', '[]'::jsonb, 'sub_pracas', '[]'::jsonb, 'origens', '[]'::jsonb)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_resumo(INTEGER, INTEGER, TEXT, TEXT, TEXT) TO authenticated, anon;

-- TESTAR NOVAMENTE
DO $$
DECLARE
  v_result JSONB;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'TESTE FINAL';
  RAISE NOTICE '=============================================================';
  
  SELECT dashboard_resumo() INTO v_result;
  
  RAISE NOTICE 'Corridas completadas: %', v_result->'totais'->'corridas_completadas';
  RAISE NOTICE 'Semanas retornadas: %', jsonb_array_length(COALESCE(v_result->'semanal', '[]'::jsonb));
  RAISE NOTICE 'Dias retornados: %', jsonb_array_length(COALESCE(v_result->'dia', '[]'::jsonb));
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ FUNÇÃO CORRIGIDA! Recarregue o dashboard.';
END $$;

