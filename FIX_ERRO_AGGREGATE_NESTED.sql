-- =====================================================================
-- FIX: Erro "aggregate function calls cannot be nested"
-- =====================================================================
-- Solução: Usar subqueries para calcular agregações antes do jsonb_agg
-- =====================================================================

DROP FUNCTION IF EXISTS public.listar_todas_semanas();

CREATE OR REPLACE FUNCTION public.listar_todas_semanas()
RETURNS INTEGER[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN := true;
  v_assigned_pracas TEXT[] := ARRAY[]::TEXT[];
  v_semanas INTEGER[];
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NOT NULL THEN
    BEGIN
      SELECT COALESCE(is_admin, true), COALESCE(assigned_pracas, ARRAY[]::TEXT[])
      INTO v_is_admin, v_assigned_pracas
      FROM user_profiles WHERE id = v_user_id;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
  
  SELECT ARRAY_AGG(DISTINCT semana_numero ORDER BY semana_numero DESC)
  INTO v_semanas
  FROM dados_corridas
  WHERE (v_is_admin OR praca = ANY(v_assigned_pracas)) AND semana_numero IS NOT NULL;
  
  RETURN COALESCE(v_semanas, ARRAY[]::INTEGER[]);
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_todas_semanas() TO authenticated, anon;

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
SET statement_timeout = '30s'
SET work_mem = '48MB'
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN := true;
  v_assigned_pracas TEXT[] := ARRAY[]::TEXT[];
  v_limite INTEGER := 5;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NOT NULL THEN
    BEGIN
      SELECT COALESCE(is_admin, true), COALESCE(assigned_pracas, ARRAY[]::TEXT[])
      INTO v_is_admin, v_assigned_pracas
      FROM user_profiles WHERE id = v_user_id;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
  
  IF p_ano IS NOT NULL OR p_semana IS NOT NULL OR p_praca IS NOT NULL THEN
    v_limite := 52;
  END IF;
  
  RETURN jsonb_build_object(
    'totais', (
      SELECT jsonb_build_object(
        'corridas_ofertadas', COALESCE(SUM(numero_de_corridas_ofertadas), 0),
        'corridas_aceitas', COALESCE(SUM(numero_de_corridas_aceitas), 0),
        'corridas_rejeitadas', COALESCE(SUM(numero_de_corridas_rejeitadas), 0),
        'corridas_completadas', COALESCE(SUM(numero_de_corridas_completadas), 0)
      )
      FROM dados_corridas
      WHERE (p_ano IS NULL OR ano_iso = p_ano)
        AND (p_semana IS NULL OR semana_numero = p_semana)
        AND (p_praca IS NULL OR praca = p_praca)
        AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
        AND (p_origem IS NULL OR origem = p_origem)
        AND (v_is_admin OR praca = ANY(v_assigned_pracas))
    ),
    'semanal', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'semana', semana,
        'horas_a_entregar', horas_a_entregar,
        'horas_entregues', horas_entregues,
        'aderencia_percentual', aderencia_percentual
      ) ORDER BY ano_iso DESC, semana_numero DESC)
      FROM (
        SELECT 
          ano_iso,
          semana_numero,
          ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') AS semana,
          ROUND(SUM(COALESCE(tempo_disponivel_escalado_segundos, 0)) / 3600.0, 2)::TEXT AS horas_a_entregar,
          ROUND(SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_entregues,
          ROUND(
            CASE WHEN SUM(COALESCE(tempo_disponivel_escalado_segundos, 0)) > 0 
            THEN (SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0))::NUMERIC / SUM(COALESCE(tempo_disponivel_escalado_segundos, 0))::NUMERIC * 100)
            ELSE 0 END, 1
          ) AS aderencia_percentual
        FROM dados_corridas
        WHERE (p_ano IS NULL OR ano_iso = p_ano)
          AND (p_semana IS NULL OR semana_numero = p_semana)
          AND (p_praca IS NULL OR praca = p_praca)
          AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
          AND (p_origem IS NULL OR origem = p_origem)
          AND (v_is_admin OR praca = ANY(v_assigned_pracas))
          AND ano_iso IS NOT NULL AND semana_numero IS NOT NULL
        GROUP BY ano_iso, semana_numero
        ORDER BY ano_iso DESC, semana_numero DESC
        LIMIT v_limite
      ) s
    ), '[]'::jsonb),
    'dia', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'dia_iso', dia_iso,
        'dia_da_semana', dia_da_semana,
        'horas_a_entregar', horas_a_entregar,
        'horas_entregues', horas_entregues,
        'aderencia_percentual', aderencia_percentual,
        'corridas_ofertadas', corridas_ofertadas,
        'corridas_aceitas', corridas_aceitas,
        'corridas_rejeitadas', corridas_rejeitadas,
        'corridas_completadas', corridas_completadas,
        'taxa_aceitacao', taxa_aceitacao,
        'taxa_completude', taxa_completude
      ) ORDER BY dia_iso)
      FROM (
        SELECT 
          EXTRACT(ISODOW FROM data_do_periodo)::INTEGER AS dia_iso,
          CASE EXTRACT(ISODOW FROM data_do_periodo)
            WHEN 1 THEN 'Segunda' WHEN 2 THEN 'Terça' WHEN 3 THEN 'Quarta'
            WHEN 4 THEN 'Quinta' WHEN 5 THEN 'Sexta' WHEN 6 THEN 'Sábado' WHEN 7 THEN 'Domingo'
          END AS dia_da_semana,
          ROUND(SUM(COALESCE(tempo_disponivel_escalado_segundos, 0)) / 3600.0, 2)::TEXT AS horas_a_entregar,
          ROUND(SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_entregues,
          ROUND(
            CASE WHEN SUM(COALESCE(tempo_disponivel_escalado_segundos, 0)) > 0 
            THEN (SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0))::NUMERIC / SUM(COALESCE(tempo_disponivel_escalado_segundos, 0))::NUMERIC * 100)
            ELSE 0 END, 1
          ) AS aderencia_percentual,
          SUM(COALESCE(numero_de_corridas_ofertadas, 0)) AS corridas_ofertadas,
          SUM(COALESCE(numero_de_corridas_aceitas, 0)) AS corridas_aceitas,
          SUM(COALESCE(numero_de_corridas_rejeitadas, 0)) AS corridas_rejeitadas,
          SUM(COALESCE(numero_de_corridas_completadas, 0)) AS corridas_completadas,
          ROUND(
            CASE WHEN SUM(COALESCE(numero_de_corridas_ofertadas, 0)) > 0 
            THEN (SUM(COALESCE(numero_de_corridas_aceitas, 0))::NUMERIC / SUM(COALESCE(numero_de_corridas_ofertadas, 0))::NUMERIC * 100)
            ELSE 0 END, 1
          ) AS taxa_aceitacao,
          ROUND(
            CASE WHEN SUM(COALESCE(numero_de_corridas_aceitas, 0)) > 0 
            THEN (SUM(COALESCE(numero_de_corridas_completadas, 0))::NUMERIC / SUM(COALESCE(numero_de_corridas_aceitas, 0))::NUMERIC * 100)
            ELSE 0 END, 1
          ) AS taxa_completude
        FROM dados_corridas
        WHERE (p_ano IS NULL OR ano_iso = p_ano)
          AND (p_semana IS NULL OR semana_numero = p_semana)
          AND (p_praca IS NULL OR praca = p_praca)
          AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
          AND (p_origem IS NULL OR origem = p_origem)
          AND (v_is_admin OR praca = ANY(v_assigned_pracas))
        GROUP BY EXTRACT(ISODOW FROM data_do_periodo)
      ) d
    ), '[]'::jsonb),
    'turno', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'turno', turno,
        'periodo', periodo,
        'horas_a_entregar', horas_a_entregar,
        'horas_entregues', horas_entregues,
        'aderencia_percentual', aderencia_percentual,
        'corridas_completadas', corridas_completadas
      ))
      FROM (
        SELECT 
          COALESCE(periodo, 'Sem Turno') AS turno,
          periodo,
          ROUND(SUM(COALESCE(tempo_disponivel_escalado_segundos, 0)) / 3600.0, 2)::TEXT AS horas_a_entregar,
          ROUND(SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_entregues,
          ROUND(
            CASE WHEN SUM(COALESCE(tempo_disponivel_escalado_segundos, 0)) > 0 
            THEN (SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0))::NUMERIC / SUM(COALESCE(tempo_disponivel_escalado_segundos, 0))::NUMERIC * 100)
            ELSE 0 END, 1
          ) AS aderencia_percentual,
          SUM(COALESCE(numero_de_corridas_completadas, 0)) AS corridas_completadas
        FROM dados_corridas
        WHERE (p_ano IS NULL OR ano_iso = p_ano)
          AND (p_semana IS NULL OR semana_numero = p_semana)
          AND (p_praca IS NULL OR praca = p_praca)
          AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
          AND (p_origem IS NULL OR origem = p_origem)
          AND (v_is_admin OR praca = ANY(v_assigned_pracas))
        GROUP BY periodo
      ) t
    ), '[]'::jsonb),
    'origem', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'origem', origem,
        'horas_entregues', horas_entregues,
        'taxa_completude', taxa_completude,
        'total_corridas', total_corridas,
        'corridas_completadas', corridas_completadas
      ) ORDER BY corridas_completadas DESC)
      FROM (
        SELECT 
          origem,
          ROUND(SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_entregues,
          ROUND(
            CASE WHEN SUM(COALESCE(numero_de_corridas_ofertadas, 0)) > 0 
            THEN (SUM(COALESCE(numero_de_corridas_completadas, 0))::NUMERIC / SUM(COALESCE(numero_de_corridas_ofertadas, 0))::NUMERIC * 100)
            ELSE 0 END, 1
          ) AS taxa_completude,
          SUM(COALESCE(numero_de_corridas_ofertadas, 0)) AS total_corridas,
          SUM(COALESCE(numero_de_corridas_completadas, 0)) AS corridas_completadas
        FROM dados_corridas
        WHERE (p_ano IS NULL OR ano_iso = p_ano)
          AND (p_semana IS NULL OR semana_numero = p_semana)
          AND (p_praca IS NULL OR praca = p_praca)
          AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
          AND (p_origem IS NULL OR origem = p_origem)
          AND (v_is_admin OR praca = ANY(v_assigned_pracas))
          AND origem IS NOT NULL
        GROUP BY origem
      ) o
    ), '[]'::jsonb),
    'sub_praca', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'sub_praca', sub_praca,
        'horas_a_entregar', horas_a_entregar,
        'horas_entregues', horas_entregues,
        'aderencia_percentual', aderencia_percentual,
        'corridas_completadas', corridas_completadas
      ) ORDER BY corridas_completadas DESC)
      FROM (
        SELECT 
          sub_praca,
          ROUND(SUM(COALESCE(tempo_disponivel_escalado_segundos, 0)) / 3600.0, 2)::TEXT AS horas_a_entregar,
          ROUND(SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_entregues,
          ROUND(
            CASE WHEN SUM(COALESCE(tempo_disponivel_escalado_segundos, 0)) > 0 
            THEN (SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0))::NUMERIC / SUM(COALESCE(tempo_disponivel_escalado_segundos, 0))::NUMERIC * 100)
            ELSE 0 END, 1
          ) AS aderencia_percentual,
          SUM(COALESCE(numero_de_corridas_completadas, 0)) AS corridas_completadas
        FROM dados_corridas
        WHERE (p_ano IS NULL OR ano_iso = p_ano)
          AND (p_semana IS NULL OR semana_numero = p_semana)
          AND (p_praca IS NULL OR praca = p_praca)
          AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
          AND (p_origem IS NULL OR origem = p_origem)
          AND (v_is_admin OR praca = ANY(v_assigned_pracas))
          AND sub_praca IS NOT NULL
        GROUP BY sub_praca
      ) sp
    ), '[]'::jsonb),
    'dimensoes', (
      SELECT jsonb_build_object(
        'anos', COALESCE((
          SELECT jsonb_agg(DISTINCT ano_iso ORDER BY ano_iso DESC)
          FROM dados_corridas
          WHERE (v_is_admin OR praca = ANY(v_assigned_pracas)) AND ano_iso IS NOT NULL
        ), '[]'::jsonb),
        'semanas', COALESCE((
          SELECT jsonb_agg(ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') ORDER BY ano_iso DESC, semana_numero DESC)
          FROM (SELECT DISTINCT ano_iso, semana_numero FROM dados_corridas 
                WHERE (v_is_admin OR praca = ANY(v_assigned_pracas)) AND ano_iso IS NOT NULL AND semana_numero IS NOT NULL) s
        ), '[]'::jsonb),
        'pracas', COALESCE((SELECT jsonb_agg(DISTINCT praca ORDER BY praca) FROM dados_corridas WHERE (v_is_admin OR praca = ANY(v_assigned_pracas)) AND praca IS NOT NULL), '[]'::jsonb),
        'sub_pracas', COALESCE((SELECT jsonb_agg(DISTINCT sub_praca ORDER BY sub_praca) FROM dados_corridas WHERE (v_is_admin OR praca = ANY(v_assigned_pracas)) AND sub_praca IS NOT NULL), '[]'::jsonb),
        'origens', COALESCE((SELECT jsonb_agg(DISTINCT origem ORDER BY origem) FROM dados_corridas WHERE (v_is_admin OR praca = ANY(v_assigned_pracas)) AND origem IS NOT NULL), '[]'::jsonb)
      )
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_resumo(INTEGER, INTEGER, TEXT, TEXT, TEXT) TO authenticated, anon;

-- =====================================================================
-- ✅ CORREÇÃO: Todas as agregações calculadas ANTES do jsonb_agg
-- ✅ Usa subqueries (SELECT ... FROM (...) alias) para pré-calcular
-- ✅ Mantém todas as funcionalidades intactas
-- ✅ Timeout: 30s, work_mem: 48MB, limite: 5 semanas (52 com filtro)
-- =====================================================================

