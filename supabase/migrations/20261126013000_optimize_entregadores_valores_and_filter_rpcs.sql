-- 1. Optimize listar_entregadores_dashboard_page_weekly_v1:
--    - Dynamic allowlisted ORDER BY + LIMIT/OFFSET (top-N heapsort instead of full 10K window sort)
--    - Remove 8 unused performers_by_metric sorts
--    - Skip partial_daily_rows/incremental_scopes when full ISO week(s) are selected
CREATE OR REPLACE FUNCTION public.listar_entregadores_dashboard_page_weekly_v1(
  p_ano integer DEFAULT NULL::integer,
  p_semana integer DEFAULT NULL::integer,
  p_praca text DEFAULT NULL::text,
  p_sub_praca text DEFAULT NULL::text,
  p_origem text DEFAULT NULL::text,
  p_data_inicial date DEFAULT NULL::date,
  p_data_final date DEFAULT NULL::date,
  p_organization_id text DEFAULT NULL::text,
  p_only_dedicados boolean DEFAULT false,
  p_search text DEFAULT NULL::text,
  p_semanas integer[] DEFAULT NULL::integer[],
  p_limit integer DEFAULT '-1'::integer,
  p_page integer DEFAULT 1,
  p_sort_field text DEFAULT 'aderencia_percentual'::text,
  p_sort_direction text DEFAULT 'desc'::text,
  p_only_inactive boolean DEFAULT false
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_organization_id uuid;
  v_data_inicial date := p_data_inicial;
  v_data_final date := p_data_final;
  v_pracas text[];
  v_sub_pracas text[];
  v_origens text[];
  v_search text := nullif(btrim(p_search), '');
  v_selected_weeks integer[];
  v_requested_week_count integer := 0;
  v_valid_week_count integer := 0;
  v_week_filter boolean := false;
  v_has_invalid_week boolean := false;
  v_missing_week boolean := false;
  v_use_calendar_year boolean := false;
  v_result jsonb;
  v_sort_field text;
  v_sort_direction text;
  v_dir_sql text;
  v_order_by text;
  v_sql text;
  v_query_started_at timestamptz;
  v_query_ms numeric;
BEGIN
  IF p_limit IS NULL OR p_limit < -1 OR p_limit > 200 THEN
    RAISE EXCEPTION 'p_limit deve ser -1, 0 ou estar entre 1 e 200.' USING ERRCODE = '22023';
  END IF;
  IF p_page IS NULL OR p_page < 1 OR p_page > 1000000 THEN
    RAISE EXCEPTION 'p_page inválida.' USING ERRCODE = '22023';
  END IF;

  BEGIN
    v_organization_id := nullif(btrim(p_organization_id), '')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_organization_id := NULL;
  END;

  IF v_data_inicial IS NULL AND v_data_final IS NULL AND p_ano BETWEEN 2000 AND 2100 THEN
    IF coalesce(p_semana, 0) <> 0 OR coalesce(cardinality(p_semanas), 0) > 0 THEN
      v_has_invalid_week :=
        (p_semana IS NOT NULL AND p_semana <> 0 AND p_semana NOT BETWEEN 1 AND 53)
        OR (p_semanas IS NOT NULL AND EXISTS (
          SELECT 1 FROM unnest(p_semanas) AS selected(week_number)
          WHERE selected.week_number IS NULL OR selected.week_number NOT BETWEEN 1 AND 53
        ));

      IF NOT v_has_invalid_week THEN
        WITH requested_weeks AS (
          SELECT selected.week_number
          FROM unnest(coalesce(p_semanas, '{}'::integer[])) AS selected(week_number)
          WHERE selected.week_number BETWEEN 1 AND 53
          UNION
          SELECT p_semana WHERE p_semana BETWEEN 1 AND 53
        ), calculated_weeks AS (
          SELECT requested.week_number,
            date_trunc('week', make_date(p_ano, 1, 4)::timestamp)::date
              + ((requested.week_number - 1) * 7) AS week_start
          FROM requested_weeks requested
        ), valid_weeks AS (
          SELECT calculated.week_number, calculated.week_start
          FROM calculated_weeks calculated
          WHERE extract(isoyear FROM calculated.week_start)::integer = p_ano
            AND extract(week FROM calculated.week_start)::integer = calculated.week_number
        )
        SELECT
          (SELECT count(*)::integer FROM requested_weeks),
          (SELECT count(*)::integer FROM valid_weeks),
          (SELECT array_agg(week_number ORDER BY week_number) FROM valid_weeks),
          (SELECT min(week_start) FROM valid_weeks),
          (SELECT max(week_start) + 6 FROM valid_weeks)
        INTO v_requested_week_count, v_valid_week_count, v_selected_weeks, v_data_inicial, v_data_final;

        v_has_invalid_week := v_requested_week_count <> v_valid_week_count;
        v_week_filter := NOT v_has_invalid_week AND coalesce(cardinality(v_selected_weeks), 0) > 0;
      END IF;
    ELSE
      v_data_inicial := make_date(p_ano, 1, 1);
      v_data_final := make_date(p_ano, 12, 31);
    END IF;
  END IF;

  IF v_organization_id IS NULL
     OR v_data_inicial IS NULL
     OR v_data_final IS NULL
     OR v_data_final < v_data_inicial
     OR v_data_final - v_data_inicial > 3660
     OR v_has_invalid_week
     OR (p_only_dedicados IS TRUE)
     OR ((coalesce(p_semana, 0) <> 0 OR coalesce(cardinality(p_semanas), 0) > 0)
         AND NOT v_week_filter) THEN
    RETURN public.listar_entregadores_dashboard_page_v1(
      p_ano := p_ano, p_semana := p_semana, p_praca := p_praca,
      p_sub_praca := p_sub_praca, p_origem := p_origem,
      p_data_inicial := p_data_inicial, p_data_final := p_data_final,
      p_organization_id := p_organization_id, p_only_dedicados := p_only_dedicados,
      p_search := p_search, p_semanas := p_semanas, p_limit := p_limit,
      p_page := p_page, p_sort_field := p_sort_field,
      p_sort_direction := p_sort_direction, p_only_inactive := p_only_inactive
    );
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.dashboard_entregadores_weekly_backfill queue
    WHERE queue.organization_id = v_organization_id
      AND queue.completed_at IS NULL
      AND queue.week_start_date >= date_trunc('week', v_data_inicial::timestamp)::date
      AND queue.week_start_date + 6 <= v_data_final
      AND (NOT v_week_filter OR (queue.ano_iso = p_ano AND queue.semana_numero = ANY(v_selected_weeks)))
  ) INTO v_missing_week;
  IF v_missing_week THEN
    RAISE EXCEPTION 'A agregação semanal está atualizando este período. Tente novamente em instantes.'
      USING ERRCODE = '55000';
  END IF;

  IF nullif(btrim(p_praca), '') IS NOT NULL
     AND lower(btrim(p_praca)) NOT IN ('todas', 'todos', 'all') THEN
    SELECT array_agg(btrim(selected.value)) INTO v_pracas
    FROM unnest(string_to_array(p_praca, ',')) AS selected(value)
    WHERE btrim(selected.value) <> '';
  END IF;
  IF nullif(btrim(p_sub_praca), '') IS NOT NULL
     AND lower(btrim(p_sub_praca)) NOT IN ('todas', 'todos', 'all') THEN
    SELECT array_agg(btrim(selected.value)) INTO v_sub_pracas
    FROM unnest(string_to_array(p_sub_praca, ',')) AS selected(value)
    WHERE btrim(selected.value) <> '';
  END IF;
  IF nullif(btrim(p_origem), '') IS NOT NULL
     AND lower(btrim(p_origem)) NOT IN ('todas', 'todos', 'all') THEN
    IF left(btrim(p_origem), length('__DASHBOARD_ORIGENS_JSON_V1__:')) = '__DASHBOARD_ORIGENS_JSON_V1__:' THEN
      BEGIN
        SELECT array_agg(btrim(selected.value)) INTO v_origens
        FROM jsonb_array_elements_text(
          substring(btrim(p_origem) FROM length('__DASHBOARD_ORIGENS_JSON_V1__:') + 1)::jsonb
        ) AS selected(value)
        WHERE btrim(selected.value) <> '';
      EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Filtro de origem em formato inválido.' USING ERRCODE = '22023';
      END;
    ELSE
      SELECT array_agg(btrim(selected.value)) INTO v_origens
      FROM unnest(string_to_array(p_origem, ',')) AS selected(value)
      WHERE btrim(selected.value) <> '';
    END IF;
  END IF;

  IF p_ano BETWEEN 2000 AND 2100
     AND v_data_inicial = make_date(p_ano, 1, 1)
     AND v_data_final = make_date(p_ano, 12, 31)
     AND coalesce(p_semana, 0) = 0
     AND coalesce(cardinality(p_semanas), 0) = 0
     AND NOT coalesce(p_only_dedicados, false)
     AND v_pracas IS NULL AND v_sub_pracas IS NULL AND v_origens IS NULL
     AND EXISTS (
       SELECT 1 FROM public.dashboard_entregadores_calendar_year_backfill year_state
       WHERE year_state.organization_id = v_organization_id
         AND year_state.calendar_year = p_ano
         AND year_state.completed_at IS NOT NULL
     )
     AND NOT EXISTS (
       SELECT 1 FROM public.dashboard_entregadores_weekly_backfill queue
       WHERE queue.organization_id = v_organization_id
         AND queue.completed_at IS NULL
         AND queue.week_start_date <= v_data_final
         AND queue.week_start_date + 6 >= v_data_inicial
     )
     AND NOT EXISTS (
       SELECT 1 FROM public.mv_refresh_impacts impact
       WHERE impact.source = 'corridas'
         AND impact.organization_id = v_organization_id
         AND impact.entregadores_agregado_processed_at IS NULL
         AND impact.data_do_periodo BETWEEN v_data_inicial - 6 AND v_data_final + 6
     ) THEN
    v_use_calendar_year := true;
  END IF;

  v_sort_field := CASE WHEN p_sort_field IN (
    'id_entregador', 'nome_entregador', 'corridas_ofertadas', 'corridas_aceitas',
    'corridas_rejeitadas', 'corridas_completadas', 'aderencia_percentual',
    'rejeicao_percentual', 'total_segundos', 'percentual_aceitas', 'percentual_completadas'
  ) THEN p_sort_field ELSE 'aderencia_percentual' END;
  v_sort_direction := CASE WHEN lower(p_sort_direction) = 'asc' THEN 'asc' ELSE 'desc' END;
  v_dir_sql := CASE WHEN v_sort_direction = 'asc' THEN 'ASC' ELSE 'DESC' END;

  v_order_by := CASE v_sort_field
    WHEN 'id_entregador' THEN format(
      'CASE WHEN row_data.id_entregador ~ ''^[0-9]+$'' THEN row_data.id_entregador::numeric END %1$s NULLS LAST, CASE WHEN row_data.id_entregador !~ ''^[0-9]+$'' THEN lower(row_data.id_entregador) END %1$s NULLS LAST, row_data.id_entregador ASC',
      v_dir_sql
    )
    WHEN 'nome_entregador' THEN format('lower(row_data.nome_entregador) %s NULLS LAST, row_data.id_entregador ASC', v_dir_sql)
    WHEN 'corridas_ofertadas' THEN format('row_data.corridas_ofertadas %s NULLS LAST, row_data.id_entregador ASC', v_dir_sql)
    WHEN 'corridas_aceitas' THEN format('row_data.corridas_aceitas %s NULLS LAST, row_data.id_entregador ASC', v_dir_sql)
    WHEN 'corridas_rejeitadas' THEN format('row_data.corridas_rejeitadas %s NULLS LAST, row_data.id_entregador ASC', v_dir_sql)
    WHEN 'corridas_completadas' THEN format('row_data.corridas_completadas %s NULLS LAST, row_data.id_entregador ASC', v_dir_sql)
    WHEN 'aderencia_percentual' THEN format('row_data.aderencia_percentual %s NULLS LAST, row_data.id_entregador ASC', v_dir_sql)
    WHEN 'rejeicao_percentual' THEN format('row_data.rejeicao_percentual %s NULLS LAST, row_data.id_entregador ASC', v_dir_sql)
    WHEN 'total_segundos' THEN format('row_data.total_segundos %s NULLS LAST, row_data.id_entregador ASC', v_dir_sql)
    WHEN 'percentual_aceitas' THEN format('coalesce(row_data.corridas_aceitas::numeric * 100 / nullif(row_data.corridas_ofertadas, 0), 0) %s NULLS LAST, row_data.id_entregador ASC', v_dir_sql)
    WHEN 'percentual_completadas' THEN format('coalesce(row_data.corridas_completadas::numeric * 100 / nullif(row_data.corridas_aceitas, 0), 0) %s NULLS LAST, row_data.id_entregador ASC', v_dir_sql)
    ELSE 'row_data.aderencia_percentual DESC NULLS LAST, row_data.id_entregador ASC'
  END;

  v_query_started_at := clock_timestamp();
  v_sql := format($sql$
    WITH full_week_rows AS (
      SELECT annual.id_entregador, annual.nome_entregador,
        annual.corridas_ofertadas, annual.corridas_aceitas,
        annual.corridas_rejeitadas, annual.corridas_completadas,
        annual.total_segundos
      FROM public.dashboard_entregadores_agregado_ano annual
      WHERE $1
        AND annual.organization_id = $2
        AND annual.calendar_year = $3
      UNION ALL
      SELECT rollup.id_entregador, rollup.nome_entregador,
        rollup.corridas_ofertadas, rollup.corridas_aceitas,
        rollup.corridas_rejeitadas, rollup.corridas_completadas,
        rollup.total_segundos
      FROM public.dashboard_entregadores_agregado_semanal_entregador rollup
      WHERE NOT $1
        AND rollup.organization_id = $2
        AND rollup.week_start_date >= $4
        AND rollup.week_start_date <= $5 - 6
        AND (NOT $6 OR (rollup.ano_iso = $3 AND rollup.semana_numero = ANY($7)))
        AND $8 IS NULL AND $9 IS NULL AND $10 IS NULL
      UNION ALL
      SELECT weekly.id_entregador, weekly.nome_entregador,
        weekly.corridas_ofertadas, weekly.corridas_aceitas,
        weekly.corridas_rejeitadas, weekly.corridas_completadas,
        weekly.total_segundos
      FROM public.dashboard_entregadores_agregado_semanal weekly
      WHERE NOT $1
        AND weekly.organization_id = $2
        AND weekly.week_start_date >= $4
        AND weekly.week_start_date <= $5 - 6
        AND (NOT $6 OR (weekly.ano_iso = $3 AND weekly.semana_numero = ANY($7)))
        AND ($8 IS NOT NULL OR $9 IS NOT NULL OR $10 IS NOT NULL)
        AND ($8 IS NULL OR weekly.praca = ANY($8))
        AND ($9 IS NULL OR weekly.sub_praca = ANY($9))
        AND ($10 IS NULL OR weekly.origem = ANY($10))
    ), incremental_scopes AS MATERIALIZED (
      SELECT scope.organization_id, scope.data_do_periodo, scope.praca, scope.sub_praca, scope.origem
      FROM public.dashboard_entregadores_incremental_scopes scope
      WHERE NOT $1
        AND NOT $6
        AND scope.organization_id = $2
        AND scope.data_do_periodo >= $4
        AND scope.data_do_periodo <= $5
        AND ($8 IS NULL OR scope.praca = ANY($8))
        AND ($9 IS NULL OR scope.sub_praca = ANY($9))
        AND ($10 IS NULL OR scope.origem = ANY($10))
        AND (
          (
            $4 > date_trunc('week', $4::timestamp)::date
            AND scope.data_do_periodo < date_trunc('week', $4::timestamp)::date + 7
          )
          OR (
            $5 < date_trunc('week', $5::timestamp)::date + 6
            AND scope.data_do_periodo >= date_trunc('week', $5::timestamp)::date
          )
        )
    ), partial_daily_rows AS (
      SELECT mv.id_entregador, mv.nome_entregador,
        mv.corridas_ofertadas, mv.corridas_aceitas, mv.corridas_rejeitadas,
        mv.corridas_completadas, mv.total_segundos
      FROM public.mv_entregadores_agregado mv
      WHERE NOT $1
        AND NOT $6
        AND mv.organization_id = $2
        AND mv.data_do_periodo >= $4
        AND mv.data_do_periodo <= $5
        AND mv.id_entregador IS NOT NULL AND mv.id_entregador <> ''
        AND mv.nome_entregador IS NOT NULL
        AND ($8 IS NULL OR mv.praca = ANY($8))
        AND ($9 IS NULL OR mv.sub_praca = ANY($9))
        AND ($10 IS NULL OR mv.origem = ANY($10))
        AND (
          (
            $4 > date_trunc('week', $4::timestamp)::date
            AND mv.data_do_periodo < date_trunc('week', $4::timestamp)::date + 7
          )
          OR (
            $5 < date_trunc('week', $5::timestamp)::date + 6
            AND mv.data_do_periodo >= date_trunc('week', $5::timestamp)::date
          )
        )
        AND NOT EXISTS (
          SELECT 1 FROM incremental_scopes scope
          WHERE scope.organization_id = mv.organization_id
            AND scope.data_do_periodo = mv.data_do_periodo
            AND scope.praca IS NOT DISTINCT FROM mv.praca
            AND scope.sub_praca IS NOT DISTINCT FROM mv.sub_praca
            AND scope.origem IS NOT DISTINCT FROM mv.origem
        )
      UNION ALL
      SELECT inc.id_entregador, inc.nome_entregador,
        inc.corridas_ofertadas, inc.corridas_aceitas, inc.corridas_rejeitadas,
        inc.corridas_completadas, inc.total_segundos
      FROM public.tb_entregadores_agregado_incremental inc
      WHERE NOT $1
        AND NOT $6
        AND inc.organization_id = $2
        AND inc.data_do_periodo >= $4
        AND inc.data_do_periodo <= $5
        AND inc.id_entregador IS NOT NULL AND inc.id_entregador <> ''
        AND inc.nome_entregador IS NOT NULL
        AND ($8 IS NULL OR inc.praca = ANY($8))
        AND ($9 IS NULL OR inc.sub_praca = ANY($9))
        AND ($10 IS NULL OR inc.origem = ANY($10))
        AND (
          (
            $4 > date_trunc('week', $4::timestamp)::date
            AND inc.data_do_periodo < date_trunc('week', $4::timestamp)::date + 7
          )
          OR (
            $5 < date_trunc('week', $5::timestamp)::date + 6
            AND inc.data_do_periodo >= date_trunc('week', $5::timestamp)::date
          )
        )
    ), source_rows AS (
      SELECT * FROM full_week_rows
      UNION ALL
      SELECT * FROM partial_daily_rows
    ), aggregated_rows AS (
      SELECT source.id_entregador,
        coalesce(
          max(nullif(btrim(source.nome_entregador), '')) FILTER (
            WHERE position(chr(195) IN source.nome_entregador) = 0
              AND position(chr(194) IN source.nome_entregador) = 0
          ),
          max(nullif(btrim(source.nome_entregador), '')),
          source.id_entregador
        ) AS nome_entregador,
        sum(source.corridas_ofertadas) AS corridas_ofertadas,
        sum(source.corridas_aceitas) AS corridas_aceitas,
        sum(source.corridas_rejeitadas) AS corridas_rejeitadas,
        sum(source.corridas_completadas) AS corridas_completadas,
        sum(source.total_segundos) AS total_segundos,
        CASE WHEN sum(source.corridas_ofertadas) > 0
          THEN round((sum(source.corridas_aceitas)::numeric / nullif(sum(source.corridas_ofertadas), 0)) * 100, 2)
          ELSE 0 END AS aderencia_percentual,
        CASE WHEN sum(source.corridas_ofertadas) > 0
          THEN round((sum(source.corridas_rejeitadas)::numeric / nullif(sum(source.corridas_ofertadas), 0)) * 100, 2)
          ELSE 0 END AS rejeicao_percentual
      FROM source_rows source
      GROUP BY source.id_entregador
    ), filtered_rows AS MATERIALIZED (
      SELECT aggregated.*
      FROM aggregated_rows aggregated
      WHERE ($11 IS NULL
        OR position(lower($11) IN lower(coalesce(aggregated.id_entregador, ''))) > 0
        OR position(lower($11) IN lower(coalesce(aggregated.nome_entregador, ''))) > 0)
        AND (NOT $12 OR coalesce(aggregated.corridas_completadas, 0) = 0)
    ), totals AS MATERIALIZED (
      SELECT count(*)::integer AS total,
        coalesce(avg(coalesce(aderencia_percentual, 0)), 0) AS aderencia_media,
        coalesce(avg(coalesce(rejeicao_percentual, 0)), 0) AS rejeicao_media,
        coalesce(sum(coalesce(corridas_completadas, 0)), 0) AS corridas_completadas,
        coalesce(sum(coalesce(total_segundos, 0)), 0) AS total_segundos
      FROM filtered_rows
    ), page_size AS MATERIALIZED (
      SELECT CASE
        WHEN $13 <> -1 THEN $13
        WHEN totals.total > 1000 THEN 24
        WHEN totals.total > 400 THEN 35
        ELSE 50
      END AS value
      FROM totals
    ), ordered_slice AS (
      SELECT row_data.*, row_number() OVER () AS rn
      FROM (
        SELECT *
        FROM filtered_rows row_data
        ORDER BY %s
        LIMIT (SELECT CASE WHEN $13 = 0 THEN NULL ELSE page_size.value END FROM page_size)
        OFFSET (SELECT CASE WHEN $13 = 0 THEN 0 ELSE ($14 - 1) * page_size.value END FROM page_size)
      ) row_data
    ), page_rows AS (
      SELECT coalesce(jsonb_agg(to_jsonb(slice_row) - 'rn' ORDER BY slice_row.rn), '[]'::jsonb) AS rows
      FROM ordered_slice slice_row
    )
    SELECT jsonb_build_object(
      'entregadores', page_rows.rows,
      'total', totals.total,
      'page', $14,
      'page_size', page_size.value,
      'periodo_resolvido', jsonb_build_object(
        'ano', $3,
        'semana', CASE WHEN $6 AND coalesce($15, 0) > 0 THEN $15 ELSE NULL END,
        'semanas', CASE WHEN $6 THEN coalesce(to_jsonb($7), '[]'::jsonb) ELSE '[]'::jsonb END,
        'auto_semana', false,
        'search', CASE WHEN length(coalesce($11, '')) >= 3 THEN $11 ELSE NULL END
      ),
      'summary', jsonb_build_object(
        'total_entregadores', totals.total,
        'aderencia_media', totals.aderencia_media,
        'rejeicao_media', totals.rejeicao_media,
        'corridas_completadas', totals.corridas_completadas,
        'total_segundos', totals.total_segundos
      ),
      'performers_by_metric', '{}'::jsonb
    )
    FROM totals CROSS JOIN page_rows CROSS JOIN page_size
  $sql$, v_order_by);

  EXECUTE v_sql
  INTO v_result
  USING
    v_use_calendar_year,            -- $1
    v_organization_id,              -- $2
    p_ano,                          -- $3
    v_data_inicial,                 -- $4
    v_data_final,                   -- $5
    v_week_filter,                  -- $6
    v_selected_weeks,               -- $7
    v_pracas,                       -- $8
    v_sub_pracas,                   -- $9
    v_origens,                      -- $10
    v_search,                       -- $11
    coalesce(p_only_inactive, false), -- $12
    p_limit,                        -- $13
    p_page,                         -- $14
    p_semana,                       -- $15
    p_semanas;                      -- $16

  v_query_ms := round(extract(epoch FROM clock_timestamp() - v_query_started_at) * 1000, 2);
  RETURN coalesce(v_result, jsonb_build_object(
    'entregadores', '[]'::jsonb, 'total', 0, 'page', p_page, 'page_size', 0,
    'periodo_resolvido', jsonb_build_object('ano', p_ano, 'semana', NULL, 'semanas', '[]'::jsonb, 'auto_semana', false, 'search', NULL),
    'summary', jsonb_build_object('total_entregadores', 0, 'aderencia_media', 0, 'rejeicao_media', 0, 'corridas_completadas', 0, 'total_segundos', 0),
    'performers_by_metric', '{}'::jsonb
  )) || jsonb_build_object('_diagnostics', jsonb_build_object('aggregation_ms', v_query_ms));
END;
$function$;

-- 2. Update listar_entregadores_dashboard_page_v2 circuit breaker:
--    3 consecutive strikes > 3000ms instead of instant single-spike rollback > 1200ms
CREATE OR REPLACE FUNCTION public.listar_entregadores_dashboard_page_v2(
  p_ano integer DEFAULT NULL::integer,
  p_semana integer DEFAULT NULL::integer,
  p_praca text DEFAULT NULL::text,
  p_sub_praca text DEFAULT NULL::text,
  p_origem text DEFAULT NULL::text,
  p_data_inicial date DEFAULT NULL::date,
  p_data_final date DEFAULT NULL::date,
  p_organization_id text DEFAULT NULL::text,
  p_only_dedicados boolean DEFAULT false,
  p_search text DEFAULT NULL::text,
  p_semanas integer[] DEFAULT NULL::integer[],
  p_limit integer DEFAULT '-1'::integer,
  p_page integer DEFAULT 1,
  p_sort_field text DEFAULT 'aderencia_percentual'::text,
  p_sort_direction text DEFAULT 'desc'::text,
  p_only_inactive boolean DEFAULT false
)
 RETURNS jsonb
 LANGUAGE plpgsql
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
  v_streak integer := 0;
BEGIN
  SELECT coalesce(state.enabled, false), coalesce(state.shadow_enabled, false), coalesce(state.latency_regression_streak, 0)
  INTO v_enabled, v_shadow_enabled, v_streak
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

    IF v_weekly_ms > 3000 THEN
      UPDATE public.dashboard_entregadores_rollout_state state
      SET latency_regression_streak = coalesce(state.latency_regression_streak, 0) + 1,
          last_weekly_aggregation_ms = v_weekly_ms,
          enabled = CASE WHEN coalesce(state.latency_regression_streak, 0) + 1 >= 3 THEN false ELSE state.enabled END,
          shadow_enabled = CASE WHEN coalesce(state.latency_regression_streak, 0) + 1 >= 3 THEN false ELSE state.shadow_enabled END,
          last_rollback_reason = CASE WHEN coalesce(state.latency_regression_streak, 0) + 1 >= 3 THEN 'weekly_aggregation_over_3000ms_3x' ELSE state.last_rollback_reason END,
          updated_at = clock_timestamp()
      WHERE state.singleton = true;
    ELSIF v_streak > 0 THEN
      UPDATE public.dashboard_entregadores_rollout_state state
      SET latency_regression_streak = 0,
          last_weekly_aggregation_ms = v_weekly_ms,
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
           OR v_legacy_result->'summary' IS DISTINCT FROM v_weekly_result->'summary' THEN
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
         OR v_result->'summary' IS DISTINCT FROM v_weekly_result->'summary' THEN
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

-- 3. Optimize listar_valores_entregadores_page_fast_v1 using dashboard_entregadores_agregado_semanal_entregador
CREATE OR REPLACE FUNCTION public.listar_valores_entregadores_page_fast_v1(
  p_ano integer,
  p_semana integer DEFAULT NULL::integer,
  p_praca text DEFAULT NULL::text,
  p_sub_praca text DEFAULT NULL::text,
  p_origem text DEFAULT NULL::text,
  p_data_inicial date DEFAULT NULL::date,
  p_data_final date DEFAULT NULL::date,
  p_organization_id text DEFAULT NULL::text,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_search text DEFAULT NULL::text,
  p_sort_field text DEFAULT 'total_taxas'::text,
  p_sort_direction text DEFAULT 'desc'::text,
  p_snapshot text DEFAULT NULL::text
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_org_filter uuid;
  v_limit integer;
  v_offset integer;
  v_search text;
  v_snapshot text;
  v_result jsonb;
  v_use_weekly_rollup boolean := false;
  v_iso_year_start date;
  v_iso_year_end date;
BEGIN
  IF p_ano IS NULL OR p_ano < 2000 OR p_ano > 2100 OR p_semana IS NOT NULL
     OR p_data_inicial IS NOT NULL OR p_data_final IS NOT NULL
     OR (p_praca IS NOT NULL AND btrim(p_praca) <> '' AND lower(btrim(p_praca)) NOT IN ('todas', 'todos', 'all'))
     OR (p_sub_praca IS NOT NULL AND btrim(p_sub_praca) <> '' AND lower(btrim(p_sub_praca)) NOT IN ('todas', 'todos', 'all'))
     OR (p_origem IS NOT NULL AND btrim(p_origem) <> '' AND lower(btrim(p_origem)) NOT IN ('todas', 'todos', 'all')) THEN
    RAISE EXCEPTION 'A paginação rápida aceita apenas o escopo anual sem filtros de dimensão.'
      USING ERRCODE = '22023';
  END IF;

  IF coalesce(nullif(btrim(p_sort_field), ''), 'total_taxas') <> 'total_taxas'
     OR coalesce(lower(nullif(btrim(p_sort_direction), '')), 'desc') <> 'desc' THEN
    RAISE EXCEPTION 'A paginação rápida aceita a ordenação padrão por total de taxas.'
      USING ERRCODE = '22023';
  END IF;

  v_org_filter := nullif(btrim(p_organization_id), '')::uuid;
  IF v_org_filter IS NULL THEN
    RAISE EXCEPTION 'A organização é obrigatória para a paginação rápida de valores.'
      USING ERRCODE = '22023';
  END IF;

  v_limit := least(greatest(coalesce(p_limit, 100), 1), 100);
  v_offset := least(greatest(coalesce(p_offset, 0), 0), 1000000);
  v_search := lower(btrim(coalesce(p_search, '')));
  v_iso_year_start := date_trunc('week', make_date(p_ano, 1, 4)::timestamp)::date;
  v_iso_year_end := date_trunc('week', make_date(p_ano + 1, 1, 4)::timestamp)::date - 1;

  v_use_weekly_rollup :=
    NOT EXISTS (
      SELECT 1 FROM public.dashboard_entregadores_weekly_backfill queue
      WHERE queue.organization_id = v_org_filter
        AND queue.ano_iso = p_ano
        AND queue.completed_at IS NULL
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.mv_refresh_impacts impact
      WHERE impact.source = 'corridas'
        AND impact.organization_id = v_org_filter
        AND impact.ano_iso = p_ano
        AND impact.entregadores_agregado_processed_at IS NULL
    )
    AND EXISTS (
      SELECT 1 FROM public.dashboard_entregadores_agregado_semanal_entregador rollup
      WHERE rollup.organization_id = v_org_filter
        AND rollup.ano_iso = p_ano
    );

  IF v_use_weekly_rollup THEN
    WITH aggregated_data AS (
      SELECT
        coalesce(
          max(nullif(btrim(rollup.nome_entregador), '')) FILTER (
            WHERE position(chr(195) IN rollup.nome_entregador) = 0
              AND position(chr(194) IN rollup.nome_entregador) = 0
          ),
          max(nullif(btrim(rollup.nome_entregador), '')),
          rollup.id_entregador
        ) AS nome_entregador,
        rollup.id_entregador,
        round((sum(rollup.soma_taxas_aceitas)::numeric / 100), 2) AS total_taxas,
        sum(rollup.corridas_aceitas) AS numero_corridas_aceitas
      FROM public.dashboard_entregadores_agregado_semanal_entregador rollup
      WHERE rollup.organization_id = v_org_filter
        AND rollup.ano_iso = p_ano
        AND rollup.nome_entregador IS NOT NULL
      GROUP BY rollup.id_entregador
    ),
    prepared AS (
      SELECT
        btrim(id_entregador) AS id_entregador,
        coalesce(nullif(btrim(nome_entregador), ''), btrim(id_entregador)) AS nome_entregador,
        total_taxas,
        numero_corridas_aceitas,
        CASE
          WHEN numero_corridas_aceitas > 0 THEN total_taxas / numero_corridas_aceitas
          ELSE 0::numeric
        END AS taxa_media
      FROM aggregated_data
      WHERE nullif(btrim(id_entregador), '') IS NOT NULL
        AND (
          v_search = ''
          OR strpos(lower(coalesce(nome_entregador, '') || ' ' || btrim(id_entregador)), v_search) > 0
        )
    ),
    ranked AS MATERIALIZED (
      SELECT
        prepared.*,
        row_number() OVER (
          ORDER BY
            total_taxas DESC,
            lower(nome_entregador) COLLATE "pt-BR-x-icu",
            lower(id_entregador) COLLATE "pt-BR-x-icu",
            id_entregador
        ) AS page_row
      FROM prepared
    )
    SELECT jsonb_build_object(
      'entregadores', coalesce(
        jsonb_agg(jsonb_build_object(
          'id_entregador', ranked.id_entregador,
          'nome_entregador', ranked.nome_entregador,
          'total_taxas', ranked.total_taxas,
          'numero_corridas_aceitas', ranked.numero_corridas_aceitas,
          'taxa_media', ranked.taxa_media
        ) ORDER BY ranked.page_row) FILTER (
          WHERE ranked.page_row > v_offset
            AND ranked.page_row <= v_offset + v_limit
        ),
        '[]'::jsonb
      ),
      'total', count(*)::integer,
      'total_geral', coalesce(sum(ranked.total_taxas), 0::numeric),
      'total_corridas', coalesce(sum(ranked.numero_corridas_aceitas), 0::numeric),
      'taxa_media_geral', CASE
        WHEN coalesce(sum(ranked.numero_corridas_aceitas), 0::numeric) > 0
          THEN coalesce(sum(ranked.total_taxas), 0::numeric) / sum(ranked.numero_corridas_aceitas)
        ELSE 0::numeric
      END,
      'limit', v_limit,
      'offset', v_offset,
      'has_more', count(*) > v_offset + v_limit,
      'snapshot', encode(extensions.digest(
        convert_to(coalesce(string_agg(
          jsonb_build_array(
            ranked.id_entregador,
            ranked.nome_entregador,
            ranked.total_taxas,
            ranked.numero_corridas_aceitas
          )::text,
          E'\n' ORDER BY ranked.page_row
        ), ''), 'UTF8'),
        'sha256'
      ), 'hex')
    )
    INTO v_result
    FROM ranked;
  ELSE
    WITH incremental_scopes AS MATERIALIZED (
      SELECT
        scope.organization_id,
        scope.data_do_periodo,
        scope.praca,
        scope.sub_praca,
        scope.origem,
        pg_catalog.hash_record_extended(row(scope.praca, scope.sub_praca, scope.origem), 0) AS dimension_hash
      FROM public.dashboard_entregadores_incremental_scopes scope
      WHERE scope.organization_id = v_org_filter
        AND scope.data_do_periodo BETWEEN v_iso_year_start AND v_iso_year_end
    ),
    filtered_data AS (
      SELECT
        mv.id_entregador,
        mv.nome_entregador,
        mv.corridas_aceitas AS numero_corridas_aceitas,
        mv.soma_taxas_aceitas
      FROM public.mv_entregadores_agregado mv
      WHERE mv.organization_id = v_org_filter
        AND mv.ano_iso = p_ano
        AND mv.nome_entregador IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM incremental_scopes s
          WHERE s.organization_id = mv.organization_id
            AND s.data_do_periodo = mv.data_do_periodo
            AND s.dimension_hash = pg_catalog.hash_record_extended(row(mv.praca, mv.sub_praca, mv.origem), 0)
            AND s.praca IS NOT DISTINCT FROM mv.praca
            AND s.sub_praca IS NOT DISTINCT FROM mv.sub_praca
            AND s.origem IS NOT DISTINCT FROM mv.origem
        )
      UNION ALL
      SELECT
        inc.id_entregador,
        inc.nome_entregador,
        inc.corridas_aceitas AS numero_corridas_aceitas,
        inc.soma_taxas_aceitas
      FROM public.tb_entregadores_agregado_incremental inc
      WHERE inc.organization_id = v_org_filter
        AND inc.ano_iso = p_ano
        AND inc.nome_entregador IS NOT NULL
    ),
    aggregated_data AS MATERIALIZED (
      SELECT
        coalesce(
          max(nullif(btrim(nome_entregador), '')) FILTER (
            WHERE position(chr(195) IN nome_entregador) = 0
              AND position(chr(194) IN nome_entregador) = 0
          ),
          max(nullif(btrim(nome_entregador), '')),
          id_entregador
        ) AS nome_entregador,
        id_entregador,
        round((sum(soma_taxas_aceitas)::numeric / 100), 2) AS total_taxas,
        sum(numero_corridas_aceitas) AS numero_corridas_aceitas
      FROM filtered_data
      GROUP BY id_entregador
    ),
    prepared AS MATERIALIZED (
      SELECT
        btrim(id_entregador) AS id_entregador,
        coalesce(nullif(btrim(nome_entregador), ''), btrim(id_entregador)) AS nome_entregador,
        total_taxas,
        numero_corridas_aceitas,
        CASE
          WHEN numero_corridas_aceitas > 0 THEN total_taxas / numero_corridas_aceitas
          ELSE 0::numeric
        END AS taxa_media
      FROM aggregated_data
      WHERE nullif(btrim(id_entregador), '') IS NOT NULL
        AND (
          v_search = ''
          OR strpos(lower(coalesce(nome_entregador, '') || ' ' || btrim(id_entregador)), v_search) > 0
        )
    ),
    ranked AS MATERIALIZED (
      SELECT
        prepared.*,
        row_number() OVER (
          ORDER BY
            total_taxas DESC,
            lower(nome_entregador) COLLATE "pt-BR-x-icu",
            lower(id_entregador) COLLATE "pt-BR-x-icu",
            id_entregador
        ) AS page_row
      FROM prepared
    )
    SELECT jsonb_build_object(
      'entregadores', coalesce(
        jsonb_agg(jsonb_build_object(
          'id_entregador', ranked.id_entregador,
          'nome_entregador', ranked.nome_entregador,
          'total_taxas', ranked.total_taxas,
          'numero_corridas_aceitas', ranked.numero_corridas_aceitas,
          'taxa_media', ranked.taxa_media
        ) ORDER BY ranked.page_row) FILTER (
          WHERE ranked.page_row > v_offset
            AND ranked.page_row <= v_offset + v_limit
        ),
        '[]'::jsonb
      ),
      'total', count(*)::integer,
      'total_geral', coalesce(sum(ranked.total_taxas), 0::numeric),
      'total_corridas', coalesce(sum(ranked.numero_corridas_aceitas), 0::numeric),
      'taxa_media_geral', CASE
        WHEN coalesce(sum(ranked.numero_corridas_aceitas), 0::numeric) > 0
          THEN coalesce(sum(ranked.total_taxas), 0::numeric) / sum(ranked.numero_corridas_aceitas)
        ELSE 0::numeric
      END,
      'limit', v_limit,
      'offset', v_offset,
      'has_more', count(*) > v_offset + v_limit,
      'snapshot', encode(extensions.digest(
        convert_to(coalesce(string_agg(
          jsonb_build_array(
            ranked.id_entregador,
            ranked.nome_entregador,
            ranked.total_taxas,
            ranked.numero_corridas_aceitas
          )::text,
          E'\n' ORDER BY ranked.page_row
        ), ''), 'UTF8'),
        'sha256'
      ), 'hex')
    )
    INTO v_result
    FROM ranked;
  END IF;

  v_snapshot := v_result->>'snapshot';
  IF p_snapshot IS NOT NULL AND p_snapshot <> v_snapshot THEN
    RAISE EXCEPTION 'Os valores mudaram enquanto a lista era carregada. Atualize a consulta para evitar linhas repetidas ou ausentes.'
      USING ERRCODE = '40001';
  END IF;

  RETURN v_result;
END;
$function$;

-- 4. Filter metadata RPCs: recursive loose index scans & single-pass GROUPING SETS
CREATE OR REPLACE FUNCTION public.list_pracas_disponiveis(p_organization_id uuid)
 RETURNS TABLE(praca text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF p_organization_id IS NOT NULL THEN
    RETURN QUERY
    WITH RECURSIVE
    mv_pracas(praca) AS (
      (
        SELECT mv.praca
        FROM public.mv_dashboard_resumo mv
        WHERE mv.organization_id = p_organization_id
          AND mv.praca IS NOT NULL
        ORDER BY mv.praca ASC
        LIMIT 1
      )
      UNION ALL
      SELECT (
        SELECT mv.praca
        FROM public.mv_dashboard_resumo mv
        WHERE mv.organization_id = p_organization_id
          AND mv.praca > mv_pracas.praca
        ORDER BY mv.praca ASC
        LIMIT 1
      )
      FROM mv_pracas
      WHERE mv_pracas.praca IS NOT NULL
    ),
    inc_pracas(praca) AS (
      (
        SELECT inc.praca
        FROM public.tb_dashboard_resumo_incremental inc
        WHERE inc.organization_id = p_organization_id
          AND inc.praca IS NOT NULL
        ORDER BY inc.praca ASC
        LIMIT 1
      )
      UNION ALL
      SELECT (
        SELECT inc.praca
        FROM public.tb_dashboard_resumo_incremental inc
        WHERE inc.organization_id = p_organization_id
          AND inc.praca > inc_pracas.praca
        ORDER BY inc.praca ASC
        LIMIT 1
      )
      FROM inc_pracas
      WHERE inc_pracas.praca IS NOT NULL
    )
    SELECT available.praca
    FROM (
      SELECT m.praca FROM mv_pracas m WHERE m.praca IS NOT NULL AND btrim(m.praca) <> ''
      UNION
      SELECT i.praca FROM inc_pracas i WHERE i.praca IS NOT NULL AND btrim(i.praca) <> ''
    ) available
    ORDER BY available.praca ASC;
  ELSE
    RETURN QUERY
    SELECT available.praca
    FROM (
      SELECT DISTINCT mv.praca
      FROM public.mv_dashboard_resumo AS mv
      WHERE mv.praca IS NOT NULL
        AND btrim(mv.praca) <> ''
      UNION
      SELECT DISTINCT inc.praca
      FROM public.tb_dashboard_resumo_incremental AS inc
      WHERE inc.praca IS NOT NULL
        AND btrim(inc.praca) <> ''
    ) AS available
    ORDER BY available.praca ASC;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.listar_anos_disponiveis(p_organization_id uuid)
 RETURNS SETOF integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF p_organization_id IS NOT NULL THEN
    RETURN QUERY
    WITH RECURSIVE
    mv_years(ano_iso) AS (
      (
        SELECT mv.ano_iso
        FROM public.mv_dashboard_resumo mv
        WHERE mv.organization_id = p_organization_id
          AND mv.ano_iso IS NOT NULL
        ORDER BY mv.ano_iso DESC
        LIMIT 1
      )
      UNION ALL
      SELECT (
        SELECT mv.ano_iso
        FROM public.mv_dashboard_resumo mv
        WHERE mv.organization_id = p_organization_id
          AND mv.ano_iso IS NOT NULL
          AND mv.ano_iso < mv_years.ano_iso
        ORDER BY mv.ano_iso DESC
        LIMIT 1
      )
      FROM mv_years
      WHERE mv_years.ano_iso IS NOT NULL
    ),
    inc_years(ano_iso) AS (
      (
        SELECT inc.ano_iso
        FROM public.tb_dashboard_resumo_incremental inc
        WHERE inc.organization_id = p_organization_id
          AND inc.ano_iso IS NOT NULL
        ORDER BY inc.ano_iso DESC
        LIMIT 1
      )
      UNION ALL
      SELECT (
        SELECT inc.ano_iso
        FROM public.tb_dashboard_resumo_incremental inc
        WHERE inc.organization_id = p_organization_id
          AND inc.ano_iso IS NOT NULL
          AND inc.ano_iso < inc_years.ano_iso
        ORDER BY inc.ano_iso DESC
        LIMIT 1
      )
      FROM inc_years
      WHERE inc_years.ano_iso IS NOT NULL
    )
    SELECT years.ano_iso
    FROM (
      SELECT ano_iso FROM mv_years WHERE ano_iso IS NOT NULL
      UNION
      SELECT ano_iso FROM inc_years WHERE ano_iso IS NOT NULL
    ) years
    ORDER BY years.ano_iso DESC;
  ELSE
    RETURN QUERY SELECT * FROM public.listar_anos_disponiveis();
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_available_weeks(p_ano_iso integer, p_organization_id uuid)
 RETURNS TABLE(semana_iso integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF p_organization_id IS NOT NULL THEN
    RETURN QUERY
    WITH RECURSIVE
    mv_weeks(semana_iso) AS (
      (
        SELECT mv.semana_iso
        FROM public.mv_dashboard_resumo mv
        WHERE mv.organization_id = p_organization_id
          AND mv.ano_iso = p_ano_iso
          AND mv.semana_iso IS NOT NULL
        ORDER BY mv.semana_iso DESC
        LIMIT 1
      )
      UNION ALL
      SELECT (
        SELECT mv.semana_iso
        FROM public.mv_dashboard_resumo mv
        WHERE mv.organization_id = p_organization_id
          AND mv.ano_iso = p_ano_iso
          AND mv.semana_iso IS NOT NULL
          AND mv.semana_iso < mv_weeks.semana_iso
        ORDER BY mv.semana_iso DESC
        LIMIT 1
      )
      FROM mv_weeks
      WHERE mv_weeks.semana_iso IS NOT NULL
    ),
    inc_weeks(semana_iso) AS (
      (
        SELECT inc.semana_iso
        FROM public.tb_dashboard_resumo_incremental inc
        WHERE inc.organization_id = p_organization_id
          AND inc.ano_iso = p_ano_iso
          AND inc.semana_iso IS NOT NULL
        ORDER BY inc.semana_iso DESC
        LIMIT 1
      )
      UNION ALL
      SELECT (
        SELECT inc.semana_iso
        FROM public.tb_dashboard_resumo_incremental inc
        WHERE inc.organization_id = p_organization_id
          AND inc.ano_iso = p_ano_iso
          AND inc.semana_iso IS NOT NULL
          AND inc.semana_iso < inc_weeks.semana_iso
        ORDER BY inc.semana_iso DESC
        LIMIT 1
      )
      FROM inc_weeks
      WHERE inc_weeks.semana_iso IS NOT NULL
    )
    SELECT weeks.semana_iso
    FROM (
      SELECT w.semana_iso FROM mv_weeks w WHERE w.semana_iso IS NOT NULL
      UNION
      SELECT w.semana_iso FROM inc_weeks w WHERE w.semana_iso IS NOT NULL
    ) weeks
    ORDER BY weeks.semana_iso DESC;
  ELSE
    RETURN QUERY SELECT * FROM public.get_available_weeks(p_ano_iso);
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_city_last_updates(p_organization_id text DEFAULT NULL::text)
 RETURNS TABLE(city text, last_update_date text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_org_filter uuid;
    v_user_id uuid;
    v_cutoff date := (CURRENT_DATE - INTERVAL '6 months')::date;
BEGIN
    v_user_id := auth.uid();

    IF p_organization_id IS NOT NULL AND p_organization_id != '' THEN
        BEGIN
            v_org_filter := p_organization_id::uuid;
        EXCEPTION WHEN OTHERS THEN
            SELECT organization_id INTO v_org_filter
            FROM public.user_profiles
            WHERE id = v_user_id;
        END;
    ELSE
        SELECT organization_id INTO v_org_filter
        FROM public.user_profiles
        WHERE id = v_user_id;
    END IF;

    IF v_org_filter IS NOT NULL THEN
        RETURN QUERY
        WITH RECURSIVE
        mv_pracas(praca) AS (
            (
                SELECT mv.praca
                FROM public.mv_dashboard_resumo mv
                WHERE mv.organization_id = v_org_filter AND mv.praca IS NOT NULL
                ORDER BY mv.praca ASC LIMIT 1
            )
            UNION ALL
            SELECT (
                SELECT mv.praca
                FROM public.mv_dashboard_resumo mv
                WHERE mv.organization_id = v_org_filter AND mv.praca > mv_pracas.praca
                ORDER BY mv.praca ASC LIMIT 1
            )
            FROM mv_pracas WHERE mv_pracas.praca IS NOT NULL
        ),
        inc_pracas(praca) AS (
            (
                SELECT inc.praca
                FROM public.tb_dashboard_resumo_incremental inc
                WHERE inc.organization_id = v_org_filter AND inc.praca IS NOT NULL
                ORDER BY inc.praca ASC LIMIT 1
            )
            UNION ALL
            SELECT (
                SELECT inc.praca
                FROM public.tb_dashboard_resumo_incremental inc
                WHERE inc.organization_id = v_org_filter AND inc.praca > inc_pracas.praca
                ORDER BY inc.praca ASC LIMIT 1
            )
            FROM inc_pracas WHERE inc_pracas.praca IS NOT NULL
        ),
        distinct_pracas AS (
            SELECT p.praca FROM mv_pracas p WHERE p.praca IS NOT NULL
            UNION
            SELECT p.praca FROM inc_pracas p WHERE p.praca IS NOT NULL
        ),
        per_city AS (
            SELECT
                dp.praca,
                greatest(
                    (
                        SELECT mv.data_do_periodo
                        FROM public.mv_dashboard_resumo mv
                        WHERE mv.organization_id = v_org_filter
                          AND mv.praca = dp.praca
                          AND mv.data_do_periodo >= v_cutoff
                        ORDER BY mv.data_do_periodo DESC
                        LIMIT 1
                    ),
                    (
                        SELECT inc.data_do_periodo
                        FROM public.tb_dashboard_resumo_incremental inc
                        WHERE inc.organization_id = v_org_filter
                          AND inc.praca = dp.praca
                          AND inc.data_do_periodo >= v_cutoff
                        ORDER BY inc.data_do_periodo DESC
                        LIMIT 1
                    )
                ) AS max_date
            FROM distinct_pracas dp
        )
        SELECT
            per_city.praca::text AS city,
            to_char(per_city.max_date, 'YYYY-MM-DD"T"HH24:MI:SS') AS last_update_date
        FROM per_city
        WHERE per_city.max_date IS NOT NULL
        ORDER BY city;
    ELSE
        RETURN QUERY
        WITH current_rows AS (
            SELECT mv.praca, mv.data_do_periodo
            FROM public.mv_dashboard_resumo mv
            WHERE mv.data_do_periodo >= v_cutoff
              AND mv.praca IS NOT NULL
            UNION ALL
            SELECT t.praca, t.data_do_periodo
            FROM public.tb_dashboard_resumo_incremental t
            WHERE t.data_do_periodo >= v_cutoff
              AND t.praca IS NOT NULL
        )
        SELECT
            current_rows.praca::text AS city,
            to_char(MAX(current_rows.data_do_periodo), 'YYYY-MM-DD"T"HH24:MI:SS') AS last_update_date
        FROM current_rows
        GROUP BY current_rows.praca
        ORDER BY city;
    END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_dashboard_dimension_options(p_pracas text[] DEFAULT NULL::text[], p_organization_id text DEFAULT NULL::text)
 RETURNS TABLE(sub_pracas text[], origens text[], turnos text[])
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_user_id uuid;
  v_org_filter uuid;
  v_pracas text[];
begin
  if p_organization_id is not null and btrim(p_organization_id) <> '' then
    begin
      v_org_filter := p_organization_id::uuid;
    exception when others then
      v_org_filter := null;
    end;
  end if;

  if v_org_filter is null then
    v_user_id := auth.uid();

    if v_user_id is not null then
      select up.organization_id
      into v_org_filter
      from public.user_profiles up
      where up.id = v_user_id;
    end if;
  end if;

  if p_pracas is not null and cardinality(p_pracas) > 0 then
    select array_agg(item)
    into v_pracas
    from (
      select distinct btrim(value) as item
      from unnest(p_pracas) as value
      where value is not null
        and btrim(value) <> ''
        and lower(btrim(value)) not in ('todas', 'todos', 'all')
    ) normalized_pracas;
  end if;

  return query
  with mv_dims as (
    select mv.sub_praca, mv.origem, mv.turno
    from public.mv_dashboard_resumo mv
    where (v_org_filter is null or mv.organization_id = v_org_filter)
      and (v_pracas is null or mv.praca = any(v_pracas))
    group by grouping sets ((mv.sub_praca), (mv.origem), (mv.turno))
  ),
  inc_dims as (
    select inc.sub_praca, inc.origem, inc.turno
    from public.tb_dashboard_resumo_incremental inc
    where (v_org_filter is null or inc.organization_id = v_org_filter)
      and (v_pracas is null or inc.praca = any(v_pracas))
    group by grouping sets ((inc.sub_praca), (inc.origem), (inc.turno))
  ),
  combined as (
    select sub_praca, origem, turno from mv_dims
    union all
    select sub_praca, origem, turno from inc_dims
  )
  select
    coalesce((select array_agg(distinct sub_praca order by sub_praca) from combined where sub_praca is not null and sub_praca <> ''), '{}'::text[]) as sub_pracas,
    coalesce((select array_agg(distinct origem order by origem) from combined where origem is not null and origem <> ''), '{}'::text[]) as origens,
    coalesce((select array_agg(distinct turno order by turno) from combined where turno is not null and turno <> ''), '{}'::text[]) as turnos;
end;
$function$;

-- 5. Materialize filtered_data in dashboard_resumo (15-param overload) so vw_dashboard_resumo_current runs ONCE
CREATE OR REPLACE FUNCTION public.dashboard_resumo(
  p_ano integer DEFAULT NULL::integer,
  p_semana integer DEFAULT NULL::integer,
  p_semanas integer[] DEFAULT NULL::integer[],
  p_praca text DEFAULT NULL::text,
  p_sub_praca text DEFAULT NULL::text,
  p_origem text DEFAULT NULL::text,
  p_turno text DEFAULT NULL::text,
  p_sub_pracas text[] DEFAULT NULL::text[],
  p_origens text[] DEFAULT NULL::text[],
  p_turnos text[] DEFAULT NULL::text[],
  p_filtro_modo text DEFAULT 'ano_semana'::text,
  p_data_inicial date DEFAULT NULL::date,
  p_data_final date DEFAULT NULL::date,
  p_organization_id text DEFAULT NULL::text,
  detailed boolean DEFAULT NULL::boolean
)
 RETURNS TABLE(total_ofertadas bigint, total_aceitas bigint, total_completadas bigint, total_rejeitadas bigint, numero_de_pedidos_aceitos_e_concluidos bigint, aderencia_semanal jsonb, aderencia_dia jsonb, aderencia_turno jsonb, aderencia_sub_praca jsonb, aderencia_origem jsonb, aderencia_dia_origem jsonb, dimensoes jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
    v_org_filter uuid;
    v_is_admin boolean;
    v_user_id uuid;
    
    v_praca_list text[];
    v_sub_praca_list text[];
    v_origem_list text[];
    v_turno_list text[];
    
    v_sql text;
    v_where_clauses text[];
    v_where_text text;
BEGIN
    v_user_id := auth.uid();
    
    SELECT (role IN ('admin', 'marketing', 'master') OR is_admin = true) 
    INTO v_is_admin 
    FROM public.user_profiles 
    WHERE id = v_user_id;

    IF v_user_id IS NULL AND auth.role() = 'service_role' THEN
        v_is_admin := true;
    END IF;

    IF v_is_admin THEN
        IF p_organization_id IS NOT NULL AND p_organization_id != 'null' AND length(p_organization_id) > 0 THEN
            BEGIN
                v_org_filter := p_organization_id::uuid;
            EXCEPTION WHEN OTHERS THEN
                v_org_filter := NULL;
            END;
        ELSE
            v_org_filter := NULL;
        END IF;
    ELSE
        IF p_organization_id IS NOT NULL AND p_organization_id != 'null' AND length(p_organization_id) > 0 THEN
            BEGIN
                v_org_filter := p_organization_id::uuid;
                IF NOT EXISTS (
                    SELECT 1 FROM public.user_profiles 
                    WHERE id = v_user_id AND organization_id = v_org_filter
                ) THEN
                    SELECT organization_id INTO v_org_filter 
                    FROM public.user_profiles 
                    WHERE id = v_user_id;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                SELECT organization_id INTO v_org_filter 
                FROM public.user_profiles 
                WHERE id = v_user_id;
            END;
        ELSE
            SELECT organization_id INTO v_org_filter 
            FROM public.user_profiles 
            WHERE id = v_user_id;
        END IF;
    END IF;

    IF p_praca IS NOT NULL AND length(trim(p_praca)) > 0 AND lower(trim(p_praca)) != 'todas' THEN
        v_praca_list := string_to_array(p_praca, ',');
    ELSE
        v_praca_list := NULL;
    END IF;

    IF p_sub_praca IS NOT NULL AND length(trim(p_sub_praca)) > 0 AND lower(trim(p_sub_praca)) != 'todas' THEN
        v_sub_praca_list := string_to_array(p_sub_praca, ',');
    ELSE
        v_sub_praca_list := NULL;
    END IF;

    IF p_origem IS NOT NULL AND length(trim(p_origem)) > 0 AND lower(trim(p_origem)) != 'todas' THEN
        v_origem_list := string_to_array(p_origem, ',');
    ELSE
        v_origem_list := NULL;
    END IF;

    IF p_turno IS NOT NULL AND length(trim(p_turno)) > 0 AND lower(trim(p_turno)) != 'todos' THEN
        v_turno_list := string_to_array(p_turno, ',');
    ELSE
        v_turno_list := NULL;
    END IF;

    IF v_is_admin
       AND p_ano IS NOT NULL
       AND p_semana IS NULL
       AND (p_semanas IS NULL OR array_length(p_semanas, 1) IS NULL)
       AND v_praca_list IS NULL
       AND v_sub_praca_list IS NULL
       AND v_origem_list IS NULL
       AND v_turno_list IS NULL
       AND p_data_inicial IS NULL
       AND p_data_final IS NULL THEN
        PERFORM set_config('work_mem', '32MB', true);
    END IF;

    v_where_clauses := ARRAY[]::text[];
    
    IF v_org_filter IS NOT NULL THEN
        v_where_clauses := array_append(v_where_clauses, 'organization_id = $1');
    END IF;
    
    IF p_ano IS NOT NULL THEN
        v_where_clauses := array_append(v_where_clauses, 'ano_iso = $2');
    END IF;
    
    IF p_semana IS NOT NULL THEN
        v_where_clauses := array_append(v_where_clauses, 'semana_iso = $3');
    END IF;
    
    IF p_semanas IS NOT NULL AND array_length(p_semanas, 1) > 0 THEN
        v_where_clauses := array_append(v_where_clauses, 'semana_iso = ANY($4)');
    END IF;
    
    IF v_praca_list IS NOT NULL THEN
        v_where_clauses := array_append(v_where_clauses, 'praca = ANY($5)');
    END IF;
    
    IF v_sub_praca_list IS NOT NULL AND p_sub_pracas IS NOT NULL AND array_length(p_sub_pracas, 1) > 0 THEN
        v_where_clauses := array_append(v_where_clauses, '(sub_praca = ANY($6) OR sub_praca = ANY($7))');
    ELSIF v_sub_praca_list IS NOT NULL THEN
        v_where_clauses := array_append(v_where_clauses, 'sub_praca = ANY($6)');
    ELSIF p_sub_pracas IS NOT NULL AND array_length(p_sub_pracas, 1) > 0 THEN
        v_where_clauses := array_append(v_where_clauses, 'sub_praca = ANY($7)');
    END IF;
    
    IF v_origem_list IS NOT NULL AND p_origens IS NOT NULL AND array_length(p_origens, 1) > 0 THEN
        v_where_clauses := array_append(v_where_clauses, '(origem = ANY($8) OR origem = ANY($9))');
    ELSIF v_origem_list IS NOT NULL THEN
        v_where_clauses := array_append(v_where_clauses, 'origem = ANY($8)');
    ELSIF p_origens IS NOT NULL AND array_length(p_origens, 1) > 0 THEN
        v_where_clauses := array_append(v_where_clauses, 'origem = ANY($9)');
    END IF;
    
    IF v_turno_list IS NOT NULL AND p_turnos IS NOT NULL AND array_length(p_turnos, 1) > 0 THEN
        v_where_clauses := array_append(v_where_clauses, '(turno = ANY($10) OR turno = ANY($11))');
    ELSIF v_turno_list IS NOT NULL THEN
        v_where_clauses := array_append(v_where_clauses, 'turno = ANY($10)');
    ELSIF p_turnos IS NOT NULL AND array_length(p_turnos, 1) > 0 THEN
        v_where_clauses := array_append(v_where_clauses, 'turno = ANY($11)');
    END IF;
    
    IF p_data_inicial IS NOT NULL THEN
        v_where_clauses := array_append(v_where_clauses, 'data_do_periodo >= $12');
    END IF;
    
    IF p_data_final IS NOT NULL THEN
        v_where_clauses := array_append(v_where_clauses, 'data_do_periodo <= $13');
    END IF;

    IF array_length(v_where_clauses, 1) > 0 THEN
        v_where_text := ' WHERE ' || array_to_string(v_where_clauses, ' AND ');
    ELSE
        v_where_text := '';
    END IF;

    v_sql := format($f$
    WITH filtered_data AS MATERIALIZED (
      SELECT *, 
       EXTRACT(ISODOW FROM data_do_periodo)::integer as dia_iso_calc,
        CASE EXTRACT(ISODOW FROM data_do_periodo)::integer
          WHEN 1 THEN 'Segunda' WHEN 2 THEN 'Terça' WHEN 3 THEN 'Quarta'
          WHEN 4 THEN 'Quinta' WHEN 5 THEN 'Sexta' WHEN 6 THEN 'Sábado' WHEN 7 THEN 'Domingo'
        END as dia_semana_calc
      FROM public.vw_dashboard_resumo_current
      %s
    ),
    dimensoes_calc AS (
      SELECT jsonb_build_object(
        'anos', COALESCE(jsonb_agg(DISTINCT fd.ano_iso), '[]'::jsonb),
        'semanas', COALESCE(jsonb_agg(DISTINCT fd.semana_iso), '[]'::jsonb),
        'pracas', COALESCE(jsonb_agg(DISTINCT fd.praca) FILTER (WHERE fd.praca IS NOT NULL), '[]'::jsonb),
        'sub_pracas', COALESCE(jsonb_agg(DISTINCT fd.sub_praca) FILTER (WHERE fd.sub_praca IS NOT NULL), '[]'::jsonb),
        'origens', COALESCE(jsonb_agg(DISTINCT fd.origem) FILTER (WHERE fd.origem IS NOT NULL), '[]'::jsonb),
        'turnos', COALESCE(jsonb_agg(DISTINCT fd.turno) FILTER (WHERE fd.turno IS NOT NULL), '[]'::jsonb)
      ) as dimensoes_json
      FROM filtered_data fd
    )
    SELECT 
        COALESCE(SUM(fd.total_ofertadas), 0)::bigint as total_ofertadas,
        COALESCE(SUM(fd.total_aceitas), 0)::bigint as total_aceitas,
        COALESCE(SUM(fd.total_completadas), 0)::bigint as total_completadas,
        COALESCE(SUM(fd.total_rejeitadas), 0)::bigint as total_rejeitadas,
        COALESCE(SUM(fd.total_pedidos_aceitos_e_concluidos), 0)::bigint as numero_de_pedidos_aceitos_e_concluidos,
        
        COALESCE((
            SELECT jsonb_agg(t) FROM (
                SELECT 
                    fd.semana_iso as semana,
                    SUM(fd.segundos_planejados) as segundos_planejados,
                    SUM(fd.segundos_realizados) as segundos_realizados,
                    CASE WHEN SUM(fd.segundos_planejados) > 0 
                         THEN (SUM(fd.segundos_realizados)::numeric / SUM(fd.segundos_planejados)::numeric) * 100 
                         ELSE 0 END as aderencia_percentual,
                    SUM(fd.total_ofertadas) as corridas_ofertadas,
                    SUM(fd.total_aceitas) as corridas_aceitas,
                    SUM(fd.total_rejeitadas) as corridas_rejeitadas,
                    SUM(fd.total_completadas) as corridas_completadas,
                    SUM(fd.total_pedidos_aceitos_e_concluidos) as numero_de_pedidos_aceitos_e_concluidos
                FROM filtered_data fd
                WHERE fd.semana_iso IS NOT NULL
                GROUP BY fd.semana_iso
                ORDER BY fd.semana_iso
            ) t
        ), '[]'::jsonb) as aderencia_semanal,
        
        COALESCE((
            SELECT jsonb_agg(t) FROM (
                SELECT 
                    fd.dia_semana_calc as dia,
                    fd.dia_iso_calc as dia_iso,
                    SUM(fd.segundos_planejados) as segundos_planejados,
                    SUM(fd.segundos_realizados) as segundos_realizados,
                    CASE WHEN SUM(fd.segundos_planejados) > 0 
                         THEN (SUM(fd.segundos_realizados)::numeric / SUM(fd.segundos_planejados)::numeric) * 100 
                         ELSE 0 END as aderencia_percentual,
                    SUM(fd.total_ofertadas) as corridas_ofertadas,
                    SUM(fd.total_aceitas) as corridas_aceitas,
                    SUM(fd.total_rejeitadas) as corridas_rejeitadas,
                    SUM(fd.total_completadas) as corridas_completadas,
                    SUM(fd.total_pedidos_aceitos_e_concluidos) as numero_de_pedidos_aceitos_e_concluidos
                FROM filtered_data fd
                WHERE fd.dia_semana_calc IS NOT NULL
                GROUP BY fd.dia_semana_calc, fd.dia_iso_calc
                ORDER BY fd.dia_iso_calc
            ) t
        ), '[]'::jsonb) as aderencia_dia,

        COALESCE((
            SELECT jsonb_agg(t) FROM (
                SELECT 
                    fd.turno,
                    SUM(fd.segundos_planejados) as segundos_planejados,
                    SUM(fd.segundos_realizados) as segundos_realizados,
                    CASE WHEN SUM(fd.segundos_planejados) > 0 
                         THEN (SUM(fd.segundos_realizados)::numeric / SUM(fd.segundos_planejados)::numeric) * 100 
                         ELSE 0 END as aderencia_percentual,
                    SUM(fd.total_ofertadas) as corridas_ofertadas,
                    SUM(fd.total_aceitas) as corridas_aceitas,
                    SUM(fd.total_rejeitadas) as corridas_rejeitadas,
                    SUM(fd.total_completadas) as corridas_completadas,
                    SUM(fd.total_pedidos_aceitos_e_concluidos) as numero_de_pedidos_aceitos_e_concluidos
                FROM filtered_data fd
                WHERE fd.turno IS NOT NULL
                GROUP BY fd.turno
                ORDER BY fd.turno
            ) t
        ), '[]'::jsonb) as aderencia_turno,

        COALESCE((
            SELECT jsonb_agg(t) FROM (
                SELECT 
                    fd.sub_praca,
                    SUM(fd.segundos_planejados) as segundos_planejados,
                    SUM(fd.segundos_realizados) as segundos_realizados,
                    CASE WHEN SUM(fd.segundos_planejados) > 0 
                         THEN (SUM(fd.segundos_realizados)::numeric / SUM(fd.segundos_planejados)::numeric) * 100 
                         ELSE 0 END as aderencia_percentual,
                    SUM(fd.total_ofertadas) as corridas_ofertadas,
                    SUM(fd.total_aceitas) as corridas_aceitas,
                    SUM(fd.total_rejeitadas) as corridas_rejeitadas,
                    SUM(fd.total_completadas) as corridas_completadas,
                    SUM(fd.total_pedidos_aceitos_e_concluidos) as numero_de_pedidos_aceitos_e_concluidos
                FROM filtered_data fd
                WHERE fd.sub_praca IS NOT NULL
                GROUP BY fd.sub_praca
                ORDER BY fd.sub_praca
            ) t
        ), '[]'::jsonb) as aderencia_sub_praca,

        COALESCE((
            SELECT jsonb_agg(t) FROM (
                SELECT 
                    fd.origem,
                    SUM(fd.segundos_planejados) as segundos_planejados,
                    SUM(fd.segundos_realizados) as segundos_realizados,
                    CASE WHEN SUM(fd.segundos_planejados) > 0 
                         THEN (SUM(fd.segundos_realizados)::numeric / SUM(fd.segundos_planejados)::numeric) * 100 
                         ELSE 0 END as aderencia_percentual,
                    SUM(fd.total_ofertadas) as corridas_ofertadas,
                    SUM(fd.total_aceitas) as corridas_aceitas,
                    SUM(fd.total_rejeitadas) as corridas_rejeitadas,
                    SUM(fd.total_completadas) as corridas_completadas,
                    SUM(fd.total_pedidos_aceitos_e_concluidos) as numero_de_pedidos_aceitos_e_concluidos
                FROM filtered_data fd
                WHERE fd.origem IS NOT NULL
                GROUP BY fd.origem
                ORDER BY fd.origem
            ) t
        ), '[]'::jsonb) as aderencia_origem,
        
        COALESCE((
            SELECT jsonb_agg(t) FROM (
                SELECT 
                    fd.dia_semana_calc as dia,
                    fd.dia_iso_calc as dia_iso,
                    fd.origem,
                    SUM(fd.segundos_planejados) as segundos_planejados,
                    SUM(fd.segundos_realizados) as segundos_realizados,
                    CASE WHEN SUM(fd.segundos_planejados) > 0 
                         THEN (SUM(fd.segundos_realizados)::numeric / SUM(fd.segundos_planejados)::numeric) * 100 
                         ELSE 0 END as aderencia_percentual,
                    SUM(fd.total_ofertadas) as corridas_ofertadas,
                    SUM(fd.total_aceitas) as corridas_aceitas,
                    SUM(fd.total_rejeitadas) as corridas_rejeitadas,
                    SUM(fd.total_completadas) as corridas_completadas,
                    SUM(fd.total_pedidos_aceitos_e_concluidos) as numero_de_pedidos_aceitos_e_concluidos
                FROM filtered_data fd
                WHERE fd.dia_semana_calc IS NOT NULL AND fd.origem IS NOT NULL
                GROUP BY fd.dia_semana_calc, fd.dia_iso_calc, fd.origem
                ORDER BY fd.dia_iso_calc, fd.origem
            ) t
        ), '[]'::jsonb) as aderencia_dia_origem,

        (SELECT dimensoes_json FROM dimensoes_calc) as dimensoes
    FROM filtered_data fd
    $f$, v_where_text);

    RETURN QUERY EXECUTE v_sql 
    USING v_org_filter, p_ano, p_semana, p_semanas, v_praca_list, v_sub_praca_list, p_sub_pracas, v_origem_list, p_origens, v_turno_list, p_turnos, p_data_inicial, p_data_final;
END;
$function$;
