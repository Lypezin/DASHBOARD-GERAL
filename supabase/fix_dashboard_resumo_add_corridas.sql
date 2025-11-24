-- Fix dashboard_resumo to include corridas data in dia/turno/sub_praca/origem aggregations
-- This fixes the "Análise Detalhada por Segmento" showing all zeros

CREATE OR REPLACE FUNCTION public.dashboard_resumo(
  p_ano integer DEFAULT NULL::integer,
  p_semana integer DEFAULT NULL::integer,
  p_praca text DEFAULT NULL::text,
  p_sub_praca text DEFAULT NULL::text,
  p_origem text DEFAULT NULL::text,
  p_turno text DEFAULT NULL::text,
  p_data_inicial date DEFAULT NULL::date,
  p_data_final date DEFAULT NULL::date,
  p_organization_id text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_data_min date;
  v_data_max date;
  v_result jsonb;
  v_is_admin boolean;
  v_org_filter uuid;
  v_usar_semana_iso boolean := false;
BEGIN
  BEGIN v_org_filter := NULLIF(p_organization_id, '')::uuid; EXCEPTION WHEN OTHERS THEN v_org_filter := NULL; END;

  SELECT (role = 'admin' OR is_admin = true) INTO v_is_admin FROM public.user_profiles WHERE id = auth.uid();
  
  IF v_is_admin AND v_org_filter IS NULL THEN v_org_filter := NULL;
  ELSIF v_org_filter IS NULL AND NOT v_is_admin THEN SELECT organization_id INTO v_org_filter FROM public.user_profiles WHERE id = auth.uid(); END IF;

  IF p_data_inicial IS NOT NULL AND p_data_final IS NOT NULL THEN
    v_data_min := p_data_inicial; v_data_max := p_data_final;
  ELSIF p_ano IS NOT NULL AND p_semana IS NOT NULL THEN
    v_usar_semana_iso := true; v_data_min := NULL; v_data_max := NULL;
  ELSIF p_ano IS NOT NULL THEN
    v_data_min := MAKE_DATE(p_ano, 1, 1); v_data_max := MAKE_DATE(p_ano, 12, 31);
  ELSE
    v_data_min := CURRENT_DATE - INTERVAL '2 weeks'; v_data_max := CURRENT_DATE;
  END IF;

  SELECT jsonb_build_object(
    'totais', (
      SELECT jsonb_build_object(
        'corridas_ofertadas', COALESCE(SUM(total_ofertadas), 0),
        'corridas_aceitas', COALESCE(SUM(total_aceitas), 0),
        'corridas_rejeitadas', COALESCE(SUM(total_rejeitadas), 0),
        'corridas_completadas', COALESCE(SUM(total_completadas), 0)
      )
      FROM public.mv_dashboard_resumo
      WHERE ((v_usar_semana_iso AND ano_iso = p_ano AND semana_iso = p_semana) OR (NOT v_usar_semana_iso AND data_do_periodo >= v_data_min AND data_do_periodo <= v_data_max))
        AND (v_org_filter IS NULL OR organization_id = v_org_filter) AND (p_praca IS NULL OR praca = p_praca) AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca) AND (p_origem IS NULL OR origem = p_origem) AND (p_turno IS NULL OR turno = p_turno)
    ),
    'semanal', (
      SELECT COALESCE(jsonb_agg(row_to_json(semana_data) ORDER BY semana_data.ano_iso, semana_data.semana_iso), '[]'::jsonb)
      FROM (
        SELECT ano_iso, semana_iso, ano_iso || '-W' || LPAD(semana_iso::text, 2, '0') as semana_ano,
          LPAD(FLOOR(SUM(segundos_planejados) / 3600)::text, 2, '0') || ':' || LPAD(FLOOR(MOD(SUM(segundos_planejados), 3600) / 60)::text, 2, '0') || ':' || LPAD(FLOOR(MOD(SUM(segundos_planejados), 60))::text, 2, '0') as horas_a_entregar,
          LPAD(FLOOR(SUM(segundos_realizados) / 3600)::text, 2, '0') || ':' || LPAD(FLOOR(MOD(SUM(segundos_realizados), 3600) / 60)::text, 2, '0') || ':' || LPAD(FLOOR(MOD(SUM(segundos_realizados), 60))::text, 2, '0') as horas_entregues,
          CASE WHEN SUM(segundos_planejados) > 0 THEN ROUND((SUM(segundos_realizados) / SUM(segundos_planejados)) * 100, 2) ELSE 0 END as aderencia_percentual
        FROM public.mv_dashboard_resumo
        WHERE ((v_usar_semana_iso AND ano_iso = p_ano AND semana_iso = p_semana) OR (NOT v_usar_semana_iso AND data_do_periodo >= v_data_min AND data_do_periodo <= v_data_max))
          AND (v_org_filter IS NULL OR organization_id = v_org_filter) AND (p_praca IS NULL OR praca = p_praca) AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca) AND (p_origem IS NULL OR origem = p_origem) AND (p_turno IS NULL OR turno = p_turno)
        GROUP BY ano_iso, semana_iso
        ORDER BY ano_iso DESC, semana_iso DESC
      ) as semana_data
    ), '[]'::jsonb),
    'dia', (
      SELECT COALESCE(jsonb_agg(row_to_json(dia_data) ORDER BY dia_data.dia_iso), '[]'::jsonb)
      FROM (
        SELECT EXTRACT(isodow FROM data_do_periodo)::int as dia_iso,
          CASE EXTRACT(isodow FROM data_do_periodo)::int
            WHEN 1 THEN 'Segunda' WHEN 2 THEN 'Terça' WHEN 3 THEN 'Quarta'
            WHEN 4 THEN 'Quinta' WHEN 5 THEN 'Sexta' WHEN 6 THEN 'Sábado'
            WHEN 7 THEN 'Domingo' ELSE 'Desconhecido'
          END as dia_da_semana,
          SUM(total_ofertadas) as corridas_ofertadas,
          SUM(total_aceitas) as corridas_aceitas,
          SUM(total_rejeitadas) as corridas_rejeitadas,
          SUM(total_completadas) as corridas_completadas,
          LPAD(FLOOR(SUM(segundos_realizados) / 3600)::text, 2, '0') || ':' || LPAD(FLOOR(MOD(SUM(segundos_realizados), 3600) / 60)::text, 2, '0') || ':' || LPAD(FLOOR(MOD(SUM(segundos_realizados), 60))::text, 2, '0') as horas_entregues,
          LPAD(FLOOR(SUM(segundos_planejados) / 3600)::text, 2, '0') || ':' || LPAD(FLOOR(MOD(SUM(segundos_planejados), 3600) / 60)::text, 2, '0') || ':' || LPAD(FLOOR(MOD(SUM(segundos_planejados), 60))::text, 2, '0') as horas_a_entregar,
          CASE WHEN SUM(segundos_planejados) > 0 THEN ROUND((SUM(segundos_realizados) / SUM(segundos_planejados)) * 100, 2) ELSE 0 END as aderencia_percentual
        FROM public.mv_dashboard_resumo
        WHERE ((v_usar_semana_iso AND ano_iso = p_ano AND semana_iso = p_semana) OR (NOT v_usar_semana_iso AND data_do_periodo >= v_data_min AND data_do_periodo <= v_data_max))
          AND (v_org_filter IS NULL OR organization_id = v_org_filter) AND (p_praca IS NULL OR praca = p_praca) AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca) AND (p_origem IS NULL OR origem = p_origem) AND (p_turno IS NULL OR turno = p_turno)
        GROUP BY EXTRACT(isodow FROM data_do_periodo)
        ORDER BY dia_iso
      ) as dia_data
    ), '[]'::jsonb),
    'turno', (
      SELECT COALESCE(jsonb_agg(row_to_json(turno_data) ORDER BY turno_data.periodo), '[]'::jsonb)
      FROM (
        SELECT turno as periodo,
          SUM(total_ofertadas) as corridas_ofertadas,
          SUM(total_aceitas) as corridas_aceitas,
          SUM(total_rejeitadas) as corridas_rejeitadas,
          SUM(total_completadas) as corridas_completadas,
          LPAD(FLOOR(SUM(segundos_realizados) / 3600)::text, 2, '0') || ':' || LPAD(FLOOR(MOD(SUM(segundos_realizados), 3600) / 60)::text, 2, '0') || ':' || LPAD(FLOOR(MOD(SUM(segundos_realizados), 60))::text, 2, '0') as horas_entregues,
          LPAD(FLOOR(SUM(segundos_planejados) / 3600)::text, 2, '0') || ':' || LPAD(FLOOR(MOD(SUM(segundos_planejados), 3600) / 60)::text, 2, '0') || ':' || LPAD(FLOOR(MOD(SUM(segundos_planejados), 60))::text, 2, '0') as horas_a_entregar,
          CASE WHEN SUM(segundos_planejados) > 0 THEN ROUND((SUM(segundos_realizados) / SUM(segundos_planejados)) * 100, 2) ELSE 0 END as aderencia_percentual
        FROM public.mv_dashboard_resumo
        WHERE ((v_usar_semana_iso AND ano_iso = p_ano AND semana_iso = p_semana) OR (NOT v_usar_semana_iso AND data_do_periodo >= v_data_min AND data_do_periodo <= v_data_max))
          AND (v_org_filter IS NULL OR organization_id = v_org_filter) AND (p_praca IS NULL OR praca = p_praca) AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca) AND (p_origem IS NULL OR origem = p_origem) AND (p_turno IS NULL OR turno = p_turno)
          AND turno IS NOT NULL
        GROUP BY turno
        ORDER BY aderencia_percentual DESC
      ) as turno_data
    ), '[]'::jsonb),
    'sub_praca', (
      SELECT COALESCE(jsonb_agg(row_to_json(sub_praca_data) ORDER BY sub_praca_data.aderencia_percentual DESC), '[]'::jsonb)
      FROM (
        SELECT sub_praca,
          SUM(total_ofertadas) as corridas_ofertadas,
          SUM(total_aceitas) as corridas_aceitas,
          SUM(total_rejeitadas) as corridas_rejeitadas,
          SUM(total_completadas) as corridas_completadas,
          LPAD(FLOOR(SUM(segundos_realizados) / 3600)::text, 2, '0') || ':' || LPAD(FLOOR(MOD(SUM(segundos_realizados), 3600) / 60)::text, 2, '0') || ':' || LPAD(FLOOR(MOD(SUM(segundos_realizados), 60))::text, 2, '0') as horas_entregues,
          LPAD(FLOOR(SUM(segundos_planejados) / 3600)::text, 2, '0') || ':' || LPAD(FLOOR(MOD(SUM(segundos_planejados), 3600) / 60)::text, 2, '0') || ':' || LPAD(FLOOR(MOD(SUM(segundos_planejados), 60))::text, 2, '0') as horas_a_entregar,
          CASE WHEN SUM(segundos_planejados) > 0 THEN ROUND((SUM(segundos_realizados) / SUM(segundos_planejados)) * 100, 2) ELSE 0 END as aderencia_percentual
        FROM public.mv_dashboard_resumo
        WHERE ((v_usar_semana_iso AND ano_iso = p_ano AND semana_iso = p_semana) OR (NOT v_usar_semana_iso AND data_do_periodo >= v_data_min AND data_do_periodo <= v_data_max))
          AND (v_org_filter IS NULL OR organization_id = v_org_filter) AND (p_praca IS NULL OR praca = p_praca) AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca) AND (p_origem IS NULL OR origem = p_origem) AND (p_turno IS NULL OR turno = p_turno)
          AND sub_praca IS NOT NULL
        GROUP BY sub_praca
        ORDER BY aderencia_percentual DESC
      ) as sub_praca_data
    ), '[]'::jsonb),
    'origem', (
      SELECT COALESCE(jsonb_agg(row_to_json(origem_data) ORDER BY origem_data.aderencia_percentual DESC), '[]'::jsonb)
      FROM (
        SELECT origem,
          SUM(total_ofertadas) as corridas_ofertadas,
          SUM(total_aceitas) as corridas_aceitas,
          SUM(total_rejeitadas) as corridas_rejeitadas,
          SUM(total_completadas) as corridas_completadas,
          LPAD(FLOOR(SUM(segundos_realizados) / 3600)::text, 2, '0') || ':' || LPAD(FLOOR(MOD(SUM(segundos_realizados), 3600) / 60)::text, 2, '0') || ':' || LPAD(FLOOR(MOD(SUM(segundos_realizados), 60))::text, 2, '0') as horas_entregues,
          LPAD(FLOOR(SUM(segundos_planejados) / 3600)::text, 2, '0') || ':' || LPAD(FLOOR(MOD(SUM(segundos_planejados), 3600) / 60)::text, 2, '0') || ':' || LPAD(FLOOR(MOD(SUM(segundos_planejados), 60))::text, 2, '0') as horas_a_entregar,
          CASE WHEN SUM(segundos_planejados) > 0 THEN ROUND((SUM(segundos_realizados) / SUM(segundos_planejados)) * 100, 2) ELSE 0 END as aderencia_percentual
        FROM public.mv_dashboard_resumo
        WHERE ((v_usar_semana_iso AND ano_iso = p_ano AND semana_iso = p_semana) OR (NOT v_usar_semana_iso AND data_do_periodo >= v_data_min AND data_do_periodo <= v_data_max))
          AND (v_org_filter IS NULL OR organization_id = v_org_filter) AND (p_praca IS NULL OR praca = p_praca) AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca) AND (p_origem IS NULL OR origem = p_origem) AND (p_turno IS NULL OR turno = p_turno)
          AND origem IS NOT NULL
        GROUP BY origem
        ORDER BY aderencia_percentual DESC
      ) as origem_data
    ), '[]'::jsonb),
    'dimensoes', jsonb_build_object(
      'anos', COALESCE((SELECT jsonb_agg(DISTINCT ano_iso ORDER BY ano_iso) FROM public.mv_dashboard_resumo), '[]'::jsonb),
      'semanas', '[]'::jsonb,
      'pracas', COALESCE((SELECT jsonb_agg(DISTINCT praca ORDER BY praca) FROM public.mv_dashboard_resumo WHERE praca IS NOT NULL), '[]'::jsonb),
      'sub_pracas', COALESCE((SELECT jsonb_agg(DISTINCT sub_praca ORDER BY sub_praca) FROM public.mv_dashboard_resumo WHERE sub_praca IS NOT NULL), '[]'::jsonb),
      'origens', COALESCE((SELECT jsonb_agg(DISTINCT origem ORDER BY origem) FROM public.mv_dashboard_resumo WHERE origem IS NOT NULL), '[]'::jsonb),
      'turnos', COALESCE((SELECT jsonb_agg(DISTINCT turno ORDER BY turno) FROM public.mv_dashboard_resumo WHERE turno IS NOT NULL), '[]'::jsonb)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
