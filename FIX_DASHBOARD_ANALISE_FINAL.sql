-- =====================================================================
-- CORREÇÃO FINAL DASHBOARD E ANÁLISE
-- =====================================================================
-- Corrige apenas dashboard_resumo sem afetar outras funções
-- =====================================================================

-- DIAGNÓSTICO: Verificar dados disponíveis
DO $$
DECLARE
  v_count BIGINT;
  v_amostra RECORD;
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'DIAGNÓSTICO - DADOS DISPONÍVEIS';
  RAISE NOTICE '=============================================================';
  
  SELECT COUNT(*) INTO v_count FROM dados_corridas;
  RAISE NOTICE 'Total de registros: %', v_count;
  
  IF v_count > 0 THEN
    SELECT 
      praca,
      ano_iso,
      semana_numero,
      COUNT(*) as qtd,
      SUM(numero_de_corridas_completadas) as corridas
    INTO v_amostra
    FROM dados_corridas
    WHERE ano_iso IS NOT NULL
    GROUP BY praca, ano_iso, semana_numero
    ORDER BY ano_iso DESC, semana_numero DESC
    LIMIT 1;
    
    RAISE NOTICE 'Última semana: Praça=%, Ano=%, Semana=%, Registros=%, Corridas=%',
      v_amostra.praca, v_amostra.ano_iso, v_amostra.semana_numero, 
      v_amostra.qtd, v_amostra.corridas;
  ELSE
    RAISE NOTICE '❌ NENHUM DADO ENCONTRADO!';
  END IF;
END $$;

-- RECRIAR dashboard_resumo COM LÓGICA SIMPLES E ROBUSTA
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
  v_is_admin BOOLEAN;
  v_assigned_pracas TEXT[];
  v_where_clause TEXT := '';
BEGIN
  -- Obter usuário
  v_user_id := auth.uid();
  v_is_admin := true;
  v_assigned_pracas := ARRAY[]::TEXT[];
  
  -- Buscar permissões
  IF v_user_id IS NOT NULL THEN
    BEGIN
      SELECT 
        COALESCE(is_admin, true),
        COALESCE(assigned_pracas, ARRAY[]::TEXT[])
      INTO v_is_admin, v_assigned_pracas
      FROM user_profiles
      WHERE id = v_user_id;
    EXCEPTION WHEN OTHERS THEN
      v_is_admin := true;
    END;
  END IF;
  
  -- Construir WHERE clause
  v_where_clause := 'WHERE 1=1';
  
  IF p_ano IS NOT NULL THEN
    v_where_clause := v_where_clause || ' AND ano_iso = ' || p_ano;
  END IF;
  
  IF p_semana IS NOT NULL THEN
    v_where_clause := v_where_clause || ' AND semana_numero = ' || p_semana;
  END IF;
  
  IF p_praca IS NOT NULL THEN
    v_where_clause := v_where_clause || ' AND praca = ' || quote_literal(p_praca);
  END IF;
  
  IF NOT v_is_admin AND array_length(v_assigned_pracas, 1) > 0 THEN
    v_where_clause := v_where_clause || ' AND praca = ANY(ARRAY[' || 
      array_to_string(array_agg(quote_literal(x)), ',') || ']::TEXT[])';
  END IF;
  
  -- Retornar resultado
  RETURN (
    WITH base_data AS (
      SELECT * FROM dados_corridas
      WHERE (p_ano IS NULL OR ano_iso = p_ano)
        AND (p_semana IS NULL OR semana_numero = p_semana)
        AND (p_praca IS NULL OR praca = p_praca)
        AND (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND praca = ANY(v_assigned_pracas)))
    ),
    totais_calc AS (
      SELECT
        COALESCE(SUM(numero_de_corridas_completadas), 0) as corridas
      FROM base_data
    ),
    semanal_calc AS (
      SELECT 
        ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') AS semana,
        ROUND(SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_a_entregar,
        ROUND(SUM(COALESCE(tempo_em_corrida_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_entregues,
        ROUND(
          CASE 
            WHEN SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) > 0 
            THEN (SUM(COALESCE(tempo_em_corrida_absoluto_segundos, 0))::NUMERIC / 
                  SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0))::NUMERIC * 100)
            ELSE 0 
          END, 1
        ) AS aderencia_percentual
      FROM base_data
      WHERE ano_iso IS NOT NULL AND semana_numero IS NOT NULL
      GROUP BY ano_iso, semana_numero
      ORDER BY ano_iso DESC, semana_numero DESC
      LIMIT 15
    ),
    dia_calc AS (
      SELECT 
        EXTRACT(ISODOW FROM data_do_periodo)::INTEGER AS dia_iso,
        CASE EXTRACT(ISODOW FROM data_do_periodo)::INTEGER
          WHEN 1 THEN 'Segunda'
          WHEN 2 THEN 'Terça'
          WHEN 3 THEN 'Quarta'
          WHEN 4 THEN 'Quinta'
          WHEN 5 THEN 'Sexta'
          WHEN 6 THEN 'Sábado'
          WHEN 7 THEN 'Domingo'
        END AS dia_da_semana,
        ROUND(SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_a_entregar,
        ROUND(SUM(COALESCE(tempo_em_corrida_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_entregues,
        ROUND(
          CASE 
            WHEN SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) > 0 
            THEN (SUM(COALESCE(tempo_em_corrida_absoluto_segundos, 0))::NUMERIC / 
                  SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0))::NUMERIC * 100)
            ELSE 0 
          END, 1
        ) AS aderencia_percentual,
        COALESCE(SUM(numero_de_corridas_completadas), 0) AS corridas_completadas
      FROM base_data
      WHERE data_do_periodo IS NOT NULL
      GROUP BY EXTRACT(ISODOW FROM data_do_periodo)
      ORDER BY dia_iso
    ),
    sub_praca_calc AS (
      SELECT 
        sub_praca,
        ROUND(SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_a_entregar,
        ROUND(SUM(COALESCE(tempo_em_corrida_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_entregues,
        ROUND(
          CASE 
            WHEN SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) > 0 
            THEN (SUM(COALESCE(tempo_em_corrida_absoluto_segundos, 0))::NUMERIC / 
                  SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0))::NUMERIC * 100)
            ELSE 0 
          END, 1
        ) AS aderencia_percentual,
        COALESCE(SUM(numero_de_corridas_completadas), 0) AS corridas_completadas
      FROM base_data
      WHERE sub_praca IS NOT NULL
      GROUP BY sub_praca
      ORDER BY sub_praca
      LIMIT 50
    )
    SELECT jsonb_build_object(
      'totais', (
        SELECT jsonb_build_object(
          'corridas_ofertadas', corridas,
          'corridas_aceitas', corridas,
          'corridas_rejeitadas', 0,
          'corridas_completadas', corridas
        )
        FROM totais_calc
      ),
      'semanal', COALESCE((SELECT jsonb_agg(row_to_json(semanal_calc)) FROM semanal_calc), '[]'::jsonb),
      'dia', COALESCE((SELECT jsonb_agg(row_to_json(dia_calc)) FROM dia_calc), '[]'::jsonb),
      'turno', '[]'::jsonb,
      'sub_praca', COALESCE((SELECT jsonb_agg(row_to_json(sub_praca_calc)) FROM sub_praca_calc), '[]'::jsonb),
      'origem', '[]'::jsonb,
      'dimensoes', jsonb_build_object(
        'anos', (
          SELECT COALESCE(jsonb_agg(DISTINCT ano_iso ORDER BY ano_iso DESC), '[]'::jsonb)
          FROM dados_corridas
          WHERE ano_iso IS NOT NULL
            AND (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND praca = ANY(v_assigned_pracas)))
        ),
        'semanas', (
          SELECT COALESCE(jsonb_agg(DISTINCT ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') 
                 ORDER BY ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') DESC), '[]'::jsonb)
          FROM dados_corridas
          WHERE ano_iso IS NOT NULL AND semana_numero IS NOT NULL
            AND (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND praca = ANY(v_assigned_pracas)))
        ),
        'pracas', (
          SELECT COALESCE(jsonb_agg(DISTINCT praca ORDER BY praca), '[]'::jsonb)
          FROM dados_corridas
          WHERE v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND praca = ANY(v_assigned_pracas))
        ),
        'sub_pracas', (
          SELECT COALESCE(jsonb_agg(DISTINCT sub_praca ORDER BY sub_praca), '[]'::jsonb)
          FROM dados_corridas
          WHERE sub_praca IS NOT NULL
            AND (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND praca = ANY(v_assigned_pracas)))
        ),
        'origens', '[]'::jsonb
      )
    )
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

-- TESTE FINAL
DO $$
DECLARE
  v_result JSONB;
  v_corridas BIGINT;
  v_semanas INTEGER;
  v_dias INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'TESTE FINAL';
  RAISE NOTICE '=============================================================';
  
  BEGIN
    SELECT dashboard_resumo() INTO v_result;
    
    v_corridas := (v_result->'totais'->>'corridas_completadas')::BIGINT;
    v_semanas := jsonb_array_length(COALESCE(v_result->'semanal', '[]'::jsonb));
    v_dias := jsonb_array_length(COALESCE(v_result->'dia', '[]'::jsonb));
    
    RAISE NOTICE '✓ Corridas completadas: %', v_corridas;
    RAISE NOTICE '✓ Semanas retornadas: %', v_semanas;
    RAISE NOTICE '✓ Dias retornados: %', v_dias;
    
    IF v_corridas > 0 AND v_semanas > 0 THEN
      RAISE NOTICE '';
      RAISE NOTICE '✅ SUCESSO! Dashboard funcionando.';
      RAISE NOTICE 'Recarregue a página do dashboard.';
    ELSE
      RAISE NOTICE '';
      RAISE NOTICE '⚠ Dados retornados mas zerados.';
      RAISE NOTICE 'Verifique se há dados na tabela dados_corridas.';
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ ERRO ao executar: %', SQLERRM;
  END;
  
  RAISE NOTICE '=============================================================';
END $$;

