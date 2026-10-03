-- Use the relational page source for one explicitly selected ISO week.
-- Multi-week, search, dedicated, and broad annual requests keep their existing RPC.
CREATE OR REPLACE FUNCTION public.listar_entregadores_dashboard_page_v2(
  p_ano integer DEFAULT NULL,
  p_semana integer DEFAULT NULL,
  p_praca text DEFAULT NULL,
  p_sub_praca text DEFAULT NULL,
  p_origem text DEFAULT NULL,
  p_data_inicial date DEFAULT NULL,
  p_data_final date DEFAULT NULL,
  p_organization_id text DEFAULT NULL,
  p_only_dedicados boolean DEFAULT false,
  p_search text DEFAULT NULL,
  p_semanas integer[] DEFAULT NULL,
  p_limit integer DEFAULT -1,
  p_page integer DEFAULT 1,
  p_sort_field text DEFAULT 'aderencia_percentual',
  p_sort_direction text DEFAULT 'desc',
  p_only_inactive boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path TO ''
AS $function$
DECLARE
  v_organization_id uuid;
  v_data_inicial date := p_data_inicial;
  v_data_final date := p_data_final;
  v_search text := nullif(btrim(p_search), '');
  v_week_start date;
  v_single_week_requested boolean := false;
  v_result jsonb;
BEGIN
  BEGIN
    v_organization_id := nullif(btrim(p_organization_id), '')::uuid;
  EXCEPTION WHEN others THEN
    v_organization_id := NULL;
  END;

  IF v_data_inicial IS NULL
     AND v_data_final IS NULL
     AND p_ano BETWEEN 2000 AND 2100
     AND p_semana BETWEEN 1 AND 53
     AND (
       p_semanas IS NULL
       OR cardinality(p_semanas) = 0
       OR (cardinality(p_semanas) = 1 AND p_semanas[1] = p_semana)
     ) THEN
    v_week_start := date_trunc('week', make_date(p_ano, 1, 4)::timestamp)::date
      + ((p_semana - 1) * 7);

    IF extract(isoyear FROM v_week_start)::integer = p_ano
       AND extract(week FROM v_week_start)::integer = p_semana THEN
      v_data_inicial := v_week_start;
      v_data_final := v_week_start + 6;
      v_single_week_requested := true;
    END IF;
  END IF;

  IF v_data_inicial IS NULL
     AND v_data_final IS NULL
     AND p_ano BETWEEN 2000 AND 2100 THEN
    v_data_inicial := make_date(p_ano, 1, 1);
    v_data_final := make_date(p_ano, 12, 31);
  END IF;

  IF v_organization_id IS NOT NULL
     AND v_data_inicial IS NOT NULL
     AND v_data_final IS NOT NULL
     AND v_data_final >= v_data_inicial
     AND v_data_final - v_data_inicial <= 13
     AND (
       v_single_week_requested
       OR (
         coalesce(p_semana, 0) = 0
         AND (p_semanas IS NULL OR cardinality(p_semanas) = 0)
       )
     )
     AND NOT coalesce(p_only_dedicados, false)
     AND v_search IS NULL THEN
    v_result := public.listar_entregadores_dashboard_page_fast_v1(
      p_ano,
      v_organization_id,
      v_data_inicial,
      v_data_final,
      p_praca,
      p_sub_praca,
      p_origem,
      p_limit,
      p_page,
      p_sort_field,
      p_sort_direction,
      p_only_inactive
    );

    IF v_single_week_requested THEN
      RETURN jsonb_set(
        v_result,
        '{periodo_resolvido}',
        jsonb_build_object(
          'ano', p_ano,
          'semana', p_semana,
          'semanas', coalesce(to_jsonb(p_semanas), '[]'::jsonb),
          'auto_semana', false,
          'search', NULL
        ),
        true
      );
    END IF;

    RETURN v_result;
  END IF;

  RETURN public.listar_entregadores_dashboard_page_v1(
    p_ano := p_ano,
    p_semana := p_semana,
    p_praca := p_praca,
    p_sub_praca := p_sub_praca,
    p_origem := p_origem,
    p_data_inicial := p_data_inicial,
    p_data_final := p_data_final,
    p_organization_id := p_organization_id,
    p_only_dedicados := p_only_dedicados,
    p_search := p_search,
    p_semanas := p_semanas,
    p_limit := p_limit,
    p_page := p_page,
    p_sort_field := p_sort_field,
    p_sort_direction := p_sort_direction,
    p_only_inactive := p_only_inactive
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.listar_entregadores_dashboard_page_v2(integer, integer, text, text, text, date, date, text, boolean, text, integer[], integer, integer, text, text, boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listar_entregadores_dashboard_page_v2(integer, integer, text, text, text, date, date, text, boolean, text, integer[], integer, integer, text, text, boolean)
  TO service_role;

NOTIFY pgrst, 'reload schema';
