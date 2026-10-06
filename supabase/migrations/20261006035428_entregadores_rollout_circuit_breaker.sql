ALTER TABLE public.dashboard_entregadores_rollout_state
  ADD COLUMN IF NOT EXISTS latency_regression_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_weekly_aggregation_ms numeric,
  ADD COLUMN IF NOT EXISTS last_shadow_check_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_shadow_mismatch boolean,
  ADD COLUMN IF NOT EXISTS last_shadow_error_code text,
  ADD COLUMN IF NOT EXISTS last_rollback_reason text;

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
VOLATILE
SET search_path TO ''
AS $function$
DECLARE
  v_enabled boolean := false;
  v_shadow_enabled boolean := false;
  v_shadowable boolean := false;
  v_organization_id uuid;
  v_weekly_result jsonb;
  v_legacy_result jsonb;
  v_weekly_ms numeric;
  v_error_code text;
  v_week_start date;
  v_single_week_requested boolean := false;
  v_result jsonb;
  v_search text := nullif(btrim(p_search), '');
BEGIN
  SELECT coalesce(state.enabled, false), coalesce(state.shadow_enabled, false)
  INTO v_enabled, v_shadow_enabled
  FROM public.dashboard_entregadores_rollout_state state
  WHERE state.singleton = true;

  v_shadowable := v_shadow_enabled
    AND (
      (p_data_inicial IS NULL AND p_data_final IS NULL
        AND p_ano BETWEEN 2000 AND 2100 AND p_semana BETWEEN 1 AND 53
        AND (p_semanas IS NULL OR cardinality(p_semanas) = 0
             OR (cardinality(p_semanas) = 1 AND p_semanas[1] = p_semana)))
      OR (p_data_inicial IS NOT NULL AND p_data_final IS NOT NULL
          AND p_data_final >= p_data_inicial AND p_data_final - p_data_inicial <= 6)
    )
    AND mod(pg_catalog.hashtextextended(concat_ws(':',
      coalesce(p_organization_id, ''), coalesce(p_ano::text, ''),
      coalesce(p_semana::text, ''), coalesce(p_data_inicial::text, ''),
      coalesce(p_data_final::text, ''), coalesce(p_praca, ''),
      coalesce(p_sub_praca, ''), coalesce(p_origem, ''),
      coalesce(p_search, ''), coalesce(p_page::text, '')
    ), 0), 100::bigint) = 0;

  IF v_enabled THEN
    BEGIN
      v_weekly_result := public.listar_entregadores_dashboard_page_weekly_v1(
      p_ano := p_ano, p_semana := p_semana, p_praca := p_praca,
      p_sub_praca := p_sub_praca, p_origem := p_origem,
      p_data_inicial := p_data_inicial, p_data_final := p_data_final,
      p_organization_id := p_organization_id, p_only_dedicados := p_only_dedicados,
      p_search := p_search, p_semanas := p_semanas, p_limit := p_limit,
      p_page := p_page, p_sort_field := p_sort_field,
      p_sort_direction := p_sort_direction, p_only_inactive := p_only_inactive
    );
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_error_code = RETURNED_SQLSTATE;
      IF v_error_code IN ('22023', '22P02', '22007', '22008') THEN
        RAISE;
      END IF;
      UPDATE public.dashboard_entregadores_rollout_state state
      SET enabled = false,
          shadow_enabled = false,
          latency_regression_streak = 0,
          last_rollback_reason = 'weekly_rpc_error:' || coalesce(v_error_code, 'unknown'),
          updated_at = clock_timestamp()
      WHERE state.singleton = true;
      RETURN public.listar_entregadores_dashboard_page_v1(
    p_ano := p_ano, p_semana := p_semana, p_praca := p_praca,
    p_sub_praca := p_sub_praca, p_origem := p_origem,
    p_data_inicial := p_data_inicial, p_data_final := p_data_final,
    p_organization_id := p_organization_id, p_only_dedicados := p_only_dedicados,
    p_search := p_search, p_semanas := p_semanas, p_limit := p_limit,
    p_page := p_page, p_sort_field := p_sort_field,
    p_sort_direction := p_sort_direction, p_only_inactive := p_only_inactive
  );
    END;

    BEGIN
      v_weekly_ms := nullif(v_weekly_result #>> '{_diagnostics,aggregation_ms}', '')::numeric;
    EXCEPTION WHEN OTHERS THEN
      v_weekly_ms := NULL;
    END;

    IF v_weekly_ms > 1200 THEN
      UPDATE public.dashboard_entregadores_rollout_state state
      SET enabled = false,
          shadow_enabled = false,
          latency_regression_streak = 0,
          last_weekly_aggregation_ms = v_weekly_ms,
          last_rollback_reason = 'weekly_aggregation_over_1200ms',
          updated_at = clock_timestamp()
      WHERE state.singleton = true;
    END IF;

    IF v_shadowable THEN
      BEGIN
        v_legacy_result := public.listar_entregadores_dashboard_page_v1(
    p_ano := p_ano, p_semana := p_semana, p_praca := p_praca,
    p_sub_praca := p_sub_praca, p_origem := p_origem,
    p_data_inicial := p_data_inicial, p_data_final := p_data_final,
    p_organization_id := p_organization_id, p_only_dedicados := p_only_dedicados,
    p_search := p_search, p_semanas := p_semanas, p_limit := p_limit,
    p_page := p_page, p_sort_field := p_sort_field,
    p_sort_direction := p_sort_direction, p_only_inactive := p_only_inactive
  );
        IF v_legacy_result->'entregadores' IS DISTINCT FROM v_weekly_result->'entregadores'
           OR v_legacy_result->'total' IS DISTINCT FROM v_weekly_result->'total'
           OR v_legacy_result->'summary' IS DISTINCT FROM v_weekly_result->'summary'
           OR v_legacy_result->'performers_by_metric' IS DISTINCT FROM v_weekly_result->'performers_by_metric' THEN
          UPDATE public.dashboard_entregadores_rollout_state state
          SET enabled = false,
              shadow_enabled = false,
              last_shadow_check_at = clock_timestamp(),
              last_shadow_mismatch = true,
              last_shadow_error_code = NULL,
              last_rollback_reason = 'shadow_data_divergence',
              updated_at = clock_timestamp()
          WHERE state.singleton = true;
          RETURN v_legacy_result;
        END IF;
        UPDATE public.dashboard_entregadores_rollout_state state
        SET last_shadow_check_at = clock_timestamp(),
            last_shadow_mismatch = false,
            last_shadow_error_code = NULL,
            updated_at = clock_timestamp()
        WHERE state.singleton = true;
      EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_error_code = RETURNED_SQLSTATE;
        UPDATE public.dashboard_entregadores_rollout_state state
        SET last_shadow_check_at = clock_timestamp(),
            last_shadow_error_code = v_error_code,
            updated_at = clock_timestamp()
        WHERE state.singleton = true;
      END;
    END IF;

    RETURN v_weekly_result;
  END IF;

  BEGIN
    v_organization_id := nullif(btrim(p_organization_id), '')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_organization_id := NULL;
  END;

  IF p_data_inicial IS NULL AND p_data_final IS NULL
     AND p_ano BETWEEN 2000 AND 2100
     AND p_semana BETWEEN 1 AND 53
     AND (p_semanas IS NULL OR cardinality(p_semanas) = 0
          OR (cardinality(p_semanas) = 1 AND p_semanas[1] = p_semana)) THEN
    v_week_start := date_trunc('week', make_date(p_ano, 1, 4)::timestamp)::date
      + ((p_semana - 1) * 7);
    IF extract(isoyear FROM v_week_start)::integer = p_ano
       AND extract(week FROM v_week_start)::integer = p_semana THEN
      v_single_week_requested := true;
    END IF;
  END IF;

  IF v_single_week_requested
     AND v_organization_id IS NOT NULL
     AND NOT coalesce(p_only_dedicados, false)
     AND NOT coalesce(p_only_inactive, false)
     AND v_search IS NULL
     AND coalesce(nullif(btrim(p_sort_field), ''), 'aderencia_percentual') = 'aderencia_percentual'
     AND lower(coalesce(nullif(btrim(p_sort_direction), ''), 'desc')) = 'desc'
     AND (p_praca IS NULL OR btrim(p_praca) = '' OR lower(btrim(p_praca)) IN ('todas', 'todos', 'all'))
     AND (p_sub_praca IS NULL OR btrim(p_sub_praca) = '' OR lower(btrim(p_sub_praca)) IN ('todas', 'todos', 'all'))
     AND (p_origem IS NULL OR btrim(p_origem) = '' OR lower(btrim(p_origem)) IN ('todas', 'todos', 'all'))
     AND NOT EXISTS (
       SELECT 1 FROM public.mv_entregadores_agregado mv
       WHERE mv.organization_id = v_organization_id AND mv.ano_iso = p_ano AND mv.semana_numero = p_semana
     ) THEN
    v_result := public.listar_entregadores_dashboard_page_fast_v1(
      p_ano, v_organization_id, v_week_start, v_week_start + 6,
      p_praca, p_sub_praca, p_origem, p_limit, p_page,
      p_sort_field, p_sort_direction, p_only_inactive
    );
    v_result := jsonb_set(v_result, '{periodo_resolvido}', jsonb_build_object(
      'ano', p_ano, 'semana', p_semana,
      'semanas', coalesce(to_jsonb(p_semanas), '[]'::jsonb),
      'auto_semana', false, 'search', NULL
    ), true);
  ELSE
    v_result := public.listar_entregadores_dashboard_page_v1(
    p_ano := p_ano, p_semana := p_semana, p_praca := p_praca,
    p_sub_praca := p_sub_praca, p_origem := p_origem,
    p_data_inicial := p_data_inicial, p_data_final := p_data_final,
    p_organization_id := p_organization_id, p_only_dedicados := p_only_dedicados,
    p_search := p_search, p_semanas := p_semanas, p_limit := p_limit,
    p_page := p_page, p_sort_field := p_sort_field,
    p_sort_direction := p_sort_direction, p_only_inactive := p_only_inactive
  );
  END IF;

  IF v_shadowable THEN
    BEGIN
      v_weekly_result := public.listar_entregadores_dashboard_page_weekly_v1(
      p_ano := p_ano, p_semana := p_semana, p_praca := p_praca,
      p_sub_praca := p_sub_praca, p_origem := p_origem,
      p_data_inicial := p_data_inicial, p_data_final := p_data_final,
      p_organization_id := p_organization_id, p_only_dedicados := p_only_dedicados,
      p_search := p_search, p_semanas := p_semanas, p_limit := p_limit,
      p_page := p_page, p_sort_field := p_sort_field,
      p_sort_direction := p_sort_direction, p_only_inactive := p_only_inactive
    );
      IF v_result->'entregadores' IS DISTINCT FROM v_weekly_result->'entregadores'
         OR v_result->'total' IS DISTINCT FROM v_weekly_result->'total'
         OR v_result->'summary' IS DISTINCT FROM v_weekly_result->'summary'
         OR v_result->'performers_by_metric' IS DISTINCT FROM v_weekly_result->'performers_by_metric' THEN
        UPDATE public.dashboard_entregadores_rollout_state state
        SET enabled = false,
            shadow_enabled = false,
            last_shadow_check_at = clock_timestamp(),
            last_shadow_mismatch = true,
            last_shadow_error_code = NULL,
            last_rollback_reason = 'shadow_data_divergence',
            updated_at = clock_timestamp()
        WHERE state.singleton = true;
      ELSE
        UPDATE public.dashboard_entregadores_rollout_state state
        SET last_shadow_check_at = clock_timestamp(),
            last_shadow_mismatch = false,
            last_shadow_error_code = NULL,
            updated_at = clock_timestamp()
        WHERE state.singleton = true;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_error_code = RETURNED_SQLSTATE;
      UPDATE public.dashboard_entregadores_rollout_state state
      SET last_shadow_check_at = clock_timestamp(),
          last_shadow_error_code = v_error_code,
          updated_at = clock_timestamp()
      WHERE state.singleton = true;
    END;
  END IF;

  RETURN v_result;
END;
$function$;

NOTIFY pgrst, 'reload schema';
