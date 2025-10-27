-- =====================================================================
-- CORRIGIR dashboard_resumo PARA FUNCIONAR
-- =====================================================================

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
  v_assigned_pracas TEXT[];
BEGIN
  v_user_id := auth.uid();
  
  -- Buscar permissões do usuário
  BEGIN
    SELECT is_admin, assigned_pracas INTO v_is_admin, v_assigned_pracas
    FROM user_profiles
    WHERE id = v_user_id;
    
    IF v_assigned_pracas IS NULL THEN
      v_assigned_pracas := ARRAY[]::TEXT[];
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_is_admin := true;
    v_assigned_pracas := ARRAY[]::TEXT[];
  END;
  
  -- Retornar dados
  RETURN jsonb_build_object(
    'totais', (
      SELECT jsonb_build_object(
        'corridas_ofertadas', COALESCE(SUM(numero_de_corridas_completadas), 0),
        'corridas_aceitas', COALESCE(SUM(numero_de_corridas_completadas), 0),
        'corridas_rejeitadas', 0,
        'corridas_completadas', COALESCE(SUM(numero_de_corridas_completadas), 0)
      )
      FROM dados_corridas
      WHERE (p_ano IS NULL OR ano_iso = p_ano)
        AND (p_semana IS NULL OR semana_numero = p_semana)
        AND (p_praca IS NULL OR praca = p_praca)
        AND (v_is_admin OR praca = ANY(v_assigned_pracas))
    ),
    'semanal', (
      SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY ano_iso DESC, semana_numero DESC), '[]'::jsonb)
      FROM (
        SELECT 
          ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') AS semana,
          ROUND(SUM(tempo_disponivel_absoluto_segundos) / 3600.0, 2)::TEXT AS horas_a_entregar,
          ROUND(SUM(tempo_em_corrida_absoluto_segundos) / 3600.0, 2)::TEXT AS horas_entregues,
          ROUND(
            CASE WHEN SUM(tempo_disponivel_absoluto_segundos) > 0 
            THEN (SUM(tempo_em_corrida_absoluto_segundos)::NUMERIC / SUM(tempo_disponivel_absoluto_segundos)::NUMERIC * 100)
            ELSE 0 END, 1
          ) AS aderencia_percentual
        FROM dados_corridas
        WHERE (p_ano IS NULL OR ano_iso = p_ano)
          AND (p_praca IS NULL OR praca = p_praca)
          AND (v_is_admin OR praca = ANY(v_assigned_pracas))
          AND ano_iso IS NOT NULL
          AND semana_numero IS NOT NULL
        GROUP BY ano_iso, semana_numero
        ORDER BY ano_iso DESC, semana_numero DESC
        LIMIT 15
      ) t
    ),
    'dia', (
      SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY dia_iso), '[]'::jsonb)
      FROM (
        SELECT 
          EXTRACT(ISODOW FROM data_do_periodo)::INTEGER AS dia_iso,
          TO_CHAR(data_do_periodo, 'TMDay') AS dia_da_semana,
          ROUND(SUM(tempo_disponivel_absoluto_segundos) / 3600.0, 2)::TEXT AS horas_a_entregar,
          ROUND(SUM(tempo_em_corrida_absoluto_segundos) / 3600.0, 2)::TEXT AS horas_entregues,
          ROUND(
            CASE WHEN SUM(tempo_disponivel_absoluto_segundos) > 0 
            THEN (SUM(tempo_em_corrida_absoluto_segundos)::NUMERIC / SUM(tempo_disponivel_absoluto_segundos)::NUMERIC * 100)
            ELSE 0 END, 1
          ) AS aderencia_percentual,
          COALESCE(SUM(numero_de_corridas_completadas), 0) AS corridas_completadas
        FROM dados_corridas
        WHERE (p_ano IS NULL OR ano_iso = p_ano)
          AND (p_semana IS NULL OR semana_numero = p_semana)
          AND (p_praca IS NULL OR praca = p_praca)
          AND (v_is_admin OR praca = ANY(v_assigned_pracas))
          AND data_do_periodo IS NOT NULL
        GROUP BY EXTRACT(ISODOW FROM data_do_periodo), TO_CHAR(data_do_periodo, 'TMDay')
        ORDER BY dia_iso
      ) t
    ),
    'turno', '[]'::jsonb,
    'sub_praca', (
      SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY sub_praca), '[]'::jsonb)
      FROM (
        SELECT 
          sub_praca,
          ROUND(SUM(tempo_disponivel_absoluto_segundos) / 3600.0, 2)::TEXT AS horas_a_entregar,
          ROUND(SUM(tempo_em_corrida_absoluto_segundos) / 3600.0, 2)::TEXT AS horas_entregues,
          ROUND(
            CASE WHEN SUM(tempo_disponivel_absoluto_segundos) > 0 
            THEN (SUM(tempo_em_corrida_absoluto_segundos)::NUMERIC / SUM(tempo_disponivel_absoluto_segundos)::NUMERIC * 100)
            ELSE 0 END, 1
          ) AS aderencia_percentual,
          COALESCE(SUM(numero_de_corridas_completadas), 0) AS corridas_completadas
        FROM dados_corridas
        WHERE (p_ano IS NULL OR ano_iso = p_ano)
          AND (p_semana IS NULL OR semana_numero = p_semana)
          AND (p_praca IS NULL OR praca = p_praca)
          AND (v_is_admin OR praca = ANY(v_assigned_pracas))
          AND sub_praca IS NOT NULL
        GROUP BY sub_praca
        ORDER BY sub_praca
        LIMIT 50
      ) t
    ),
    'origem', '[]'::jsonb,
    'dimensoes', jsonb_build_object(
      'anos', (
        SELECT COALESCE(jsonb_agg(DISTINCT ano_iso ORDER BY ano_iso DESC), '[]'::jsonb) 
        FROM dados_corridas 
        WHERE ano_iso IS NOT NULL 
          AND (v_is_admin OR praca = ANY(v_assigned_pracas))
      ),
      'semanas', (
        SELECT COALESCE(jsonb_agg(DISTINCT ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') ORDER BY ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') DESC), '[]'::jsonb) 
        FROM dados_corridas 
        WHERE ano_iso IS NOT NULL AND semana_numero IS NOT NULL
          AND (v_is_admin OR praca = ANY(v_assigned_pracas))
      ),
      'pracas', (
        SELECT COALESCE(jsonb_agg(DISTINCT praca ORDER BY praca), '[]'::jsonb) 
        FROM dados_corridas 
        WHERE (v_is_admin OR praca = ANY(v_assigned_pracas))
      ),
      'sub_pracas', (
        SELECT COALESCE(jsonb_agg(DISTINCT sub_praca ORDER BY sub_praca), '[]'::jsonb) 
        FROM dados_corridas 
        WHERE sub_praca IS NOT NULL 
          AND (v_is_admin OR praca = ANY(v_assigned_pracas))
      ),
      'origens', '[]'::jsonb
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro em dashboard_resumo: %', SQLERRM;
    RETURN jsonb_build_object(
      'totais', jsonb_build_object('corridas_ofertadas', 0, 'corridas_aceitas', 0, 'corridas_rejeitadas', 0, 'corridas_completadas', 0),
      'semanal', '[]'::jsonb,
      'dia', '[]'::jsonb,
      'turno', '[]'::jsonb,
      'sub_praca', '[]'::jsonb,
      'origem', '[]'::jsonb,
      'dimensoes', jsonb_build_object('anos', '[]'::jsonb, 'semanas', '[]'::jsonb, 'pracas', '[]'::jsonb, 'sub_pracas', '[]'::jsonb, 'origens', '[]'::jsonb),
      'error', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_resumo(INTEGER, INTEGER, TEXT, TEXT, TEXT) TO authenticated, anon;

