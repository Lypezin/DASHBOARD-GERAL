-- =====================================================================
-- CORRIGIR dashboard_resumo COM COLUNAS CORRETAS
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
      v_assigned_pracas := ARRAY[]::TEXT[];
    END;
  END IF;
  
  RETURN (
    WITH base_data AS (
      SELECT * FROM dados_corridas
      WHERE (p_ano IS NULL OR ano_iso = p_ano)
        AND (p_semana IS NULL OR semana_numero = p_semana)
        AND (p_praca IS NULL OR praca = p_praca)
        AND (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND praca = ANY(v_assigned_pracas)))
    )
    SELECT jsonb_build_object(
      'totais', (
        SELECT jsonb_build_object(
          'corridas_ofertadas', COALESCE(SUM(numero_de_corridas_ofertadas), 0),
          'corridas_aceitas', COALESCE(SUM(numero_de_corridas_aceitas), 0),
          'corridas_rejeitadas', COALESCE(SUM(numero_de_corridas_rejeitadas), 0),
          'corridas_completadas', COALESCE(SUM(numero_de_corridas_completadas), 0)
        )
        FROM base_data
      ),
      'semanal', COALESCE((
        SELECT jsonb_agg(row_to_json(t) ORDER BY ano_iso DESC, semana_numero DESC)
        FROM (
          SELECT 
            ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') AS semana,
            ROUND(SUM(COALESCE(tempo_disponivel_escalado_segundos, 0)) / 3600.0, 2)::TEXT AS horas_a_entregar,
            ROUND(SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_entregues,
            ROUND(
              CASE 
                WHEN SUM(COALESCE(tempo_disponivel_escalado_segundos, 0)) > 0 
                THEN (SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0))::NUMERIC / 
                      SUM(COALESCE(tempo_disponivel_escalado_segundos, 0))::NUMERIC * 100)
                ELSE 0 
              END, 1
            ) AS aderencia_percentual
          FROM base_data
          WHERE ano_iso IS NOT NULL AND semana_numero IS NOT NULL
          GROUP BY ano_iso, semana_numero
          ORDER BY ano_iso DESC, semana_numero DESC
          LIMIT 15
        ) t
      ), '[]'::jsonb),
      'dia', COALESCE((
        SELECT jsonb_agg(row_to_json(t) ORDER BY dia_iso)
        FROM (
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
            ROUND(SUM(COALESCE(tempo_disponivel_escalado_segundos, 0)) / 3600.0, 2)::TEXT AS horas_a_entregar,
            ROUND(SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_entregues,
            ROUND(
              CASE 
                WHEN SUM(COALESCE(tempo_disponivel_escalado_segundos, 0)) > 0 
                THEN (SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0))::NUMERIC / 
                      SUM(COALESCE(tempo_disponivel_escalado_segundos, 0))::NUMERIC * 100)
                ELSE 0 
              END, 1
            ) AS aderencia_percentual,
            COALESCE(SUM(numero_de_corridas_ofertadas), 0) AS corridas_ofertadas,
            COALESCE(SUM(numero_de_corridas_aceitas), 0) AS corridas_aceitas,
            COALESCE(SUM(numero_de_corridas_rejeitadas), 0) AS corridas_rejeitadas,
            COALESCE(SUM(numero_de_corridas_completadas), 0) AS corridas_completadas,
            ROUND(
              CASE 
                WHEN SUM(COALESCE(numero_de_corridas_ofertadas, 0)) > 0 
                THEN (SUM(COALESCE(numero_de_corridas_aceitas, 0))::NUMERIC / 
                      SUM(COALESCE(numero_de_corridas_ofertadas, 0))::NUMERIC * 100)
                ELSE 0 
              END, 1
            ) AS taxa_aceitacao,
            ROUND(
              CASE 
                WHEN SUM(COALESCE(numero_de_corridas_aceitas, 0)) > 0 
                THEN (SUM(COALESCE(numero_de_corridas_completadas, 0))::NUMERIC / 
                      SUM(COALESCE(numero_de_corridas_aceitas, 0))::NUMERIC * 100)
                ELSE 0 
              END, 1
            ) AS taxa_completude
          FROM base_data
          WHERE data_do_periodo IS NOT NULL
          GROUP BY EXTRACT(ISODOW FROM data_do_periodo)
          ORDER BY dia_iso
        ) t
      ), '[]'::jsonb),
      'turno', '[]'::jsonb,
      'sub_praca', COALESCE((
        SELECT jsonb_agg(row_to_json(t) ORDER BY sub_praca)
        FROM (
          SELECT 
            sub_praca,
            ROUND(SUM(COALESCE(tempo_disponivel_escalado_segundos, 0)) / 3600.0, 2)::TEXT AS horas_a_entregar,
            ROUND(SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_entregues,
            ROUND(
              CASE 
                WHEN SUM(COALESCE(tempo_disponivel_escalado_segundos, 0)) > 0 
                THEN (SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0))::NUMERIC / 
                      SUM(COALESCE(tempo_disponivel_escalado_segundos, 0))::NUMERIC * 100)
                ELSE 0 
              END, 1
            ) AS aderencia_percentual,
            COALESCE(SUM(numero_de_corridas_completadas), 0) AS corridas_completadas
          FROM base_data
          WHERE sub_praca IS NOT NULL
          GROUP BY sub_praca
          ORDER BY sub_praca
          LIMIT 50
        ) t
      ), '[]'::jsonb),
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
END;
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_resumo(INTEGER, INTEGER, TEXT, TEXT, TEXT) TO authenticated, anon;

-- Testar
SELECT dashboard_resumo();

