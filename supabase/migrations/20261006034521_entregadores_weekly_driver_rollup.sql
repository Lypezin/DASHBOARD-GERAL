-- Add a compact weekly aggregate for unfiltered and search-only views.
-- Filtered city/subcity/origin views continue to use the dimensioned rollup.
CREATE TABLE IF NOT EXISTS public.dashboard_entregadores_agregado_semanal_entregador (
  organization_id uuid NOT NULL,
  ano_iso integer NOT NULL,
  semana_numero integer NOT NULL,
  week_start_date date NOT NULL,
  id_entregador text NOT NULL,
  nome_entregador text NOT NULL,
  corridas_ofertadas bigint,
  corridas_aceitas bigint,
  corridas_rejeitadas bigint,
  corridas_completadas bigint,
  total_segundos numeric,
  soma_taxas_aceitas numeric,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dashboard_entregadores_agregado_semanal_entregador_pkey
    PRIMARY KEY (organization_id, ano_iso, semana_numero, id_entregador)
);

CREATE INDEX IF NOT EXISTS idx_dashboard_entregadores_driver_weekly_org_week_start
  ON public.dashboard_entregadores_agregado_semanal_entregador (organization_id, week_start_date);

ALTER TABLE public.dashboard_entregadores_agregado_semanal_entregador ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.dashboard_entregadores_agregado_semanal_entregador FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dashboard_entregadores_agregado_semanal_entregador TO service_role;

ALTER TABLE public.dashboard_entregadores_weekly_backfill
  ADD COLUMN IF NOT EXISTS driver_completed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_dashboard_entregadores_weekly_backfill_driver_pending
  ON public.dashboard_entregadores_weekly_backfill (week_start_date, organization_id)
  WHERE completed_at IS NOT NULL AND driver_completed_at IS NULL;

CREATE OR REPLACE FUNCTION public.dashboard_entregadores_rebuild_week(
  p_organization_id uuid,
  p_ano_iso integer,
  p_semana_numero integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_week_start date;
  v_rows integer := 0;
BEGIN
  IF p_organization_id IS NULL OR p_ano_iso NOT BETWEEN 2000 AND 2100 OR p_semana_numero NOT BETWEEN 1 AND 53 THEN
    RAISE EXCEPTION 'Escopo ISO inválido para agregação semanal.' USING ERRCODE = '22023';
  END IF;

  v_week_start := date_trunc('week', make_date(p_ano_iso, 1, 4)::timestamp)::date
    + ((p_semana_numero - 1) * 7);
  IF extract(isoyear FROM v_week_start)::integer <> p_ano_iso
     OR extract(week FROM v_week_start)::integer <> p_semana_numero THEN
    RAISE EXCEPTION 'Ano e semana ISO inválidos para agregação semanal.' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_organization_id::text || ':' || p_ano_iso::text || ':' || p_semana_numero::text,
      0
    )
  );

  DELETE FROM public.dashboard_entregadores_agregado_semanal weekly
  WHERE weekly.organization_id = p_organization_id
    AND weekly.ano_iso = p_ano_iso
    AND weekly.semana_numero = p_semana_numero;

  WITH incremental_scopes AS MATERIALIZED (
    SELECT scope.organization_id, scope.data_do_periodo, scope.praca, scope.sub_praca, scope.origem
    FROM public.dashboard_entregadores_incremental_scopes scope
    WHERE scope.organization_id = p_organization_id
      AND scope.data_do_periodo >= v_week_start
      AND scope.data_do_periodo < v_week_start + 7
  ), effective_daily AS (
    SELECT
      mv.id_entregador, mv.nome_entregador, mv.praca, mv.sub_praca, mv.origem,
      mv.corridas_ofertadas, mv.corridas_aceitas, mv.corridas_rejeitadas,
      mv.corridas_completadas, mv.total_segundos, mv.soma_taxas_aceitas
    FROM public.mv_entregadores_agregado mv
    WHERE mv.organization_id = p_organization_id
      AND mv.data_do_periodo >= v_week_start
      AND mv.data_do_periodo < v_week_start + 7
      AND mv.id_entregador IS NOT NULL
      AND mv.id_entregador <> ''
      AND mv.nome_entregador IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM incremental_scopes scope
        WHERE scope.organization_id = mv.organization_id
          AND scope.data_do_periodo = mv.data_do_periodo
          AND scope.praca IS NOT DISTINCT FROM mv.praca
          AND scope.sub_praca IS NOT DISTINCT FROM mv.sub_praca
          AND scope.origem IS NOT DISTINCT FROM mv.origem
      )
    UNION ALL
    SELECT
      inc.id_entregador, inc.nome_entregador, inc.praca, inc.sub_praca, inc.origem,
      inc.corridas_ofertadas, inc.corridas_aceitas, inc.corridas_rejeitadas,
      inc.corridas_completadas, inc.total_segundos, inc.soma_taxas_aceitas
    FROM public.tb_entregadores_agregado_incremental inc
    WHERE inc.organization_id = p_organization_id
      AND inc.data_do_periodo >= v_week_start
      AND inc.data_do_periodo < v_week_start + 7
      AND inc.id_entregador IS NOT NULL
      AND inc.id_entregador <> ''
      AND inc.nome_entregador IS NOT NULL
  )
  INSERT INTO public.dashboard_entregadores_agregado_semanal (
    organization_id, ano_iso, semana_numero, week_start_date,
    id_entregador, nome_entregador, praca, sub_praca, origem,
    corridas_ofertadas, corridas_aceitas, corridas_rejeitadas,
    corridas_completadas, total_segundos, soma_taxas_aceitas, updated_at
  )
  SELECT
    p_organization_id, p_ano_iso, p_semana_numero, v_week_start,
    effective.id_entregador,
    coalesce(
      max(nullif(btrim(effective.nome_entregador), '')) FILTER (
        WHERE position(chr(195) IN effective.nome_entregador) = 0
          AND position(chr(194) IN effective.nome_entregador) = 0
      ),
      max(nullif(btrim(effective.nome_entregador), '')),
      effective.id_entregador
    ),
    effective.praca, effective.sub_praca, effective.origem,
    sum(effective.corridas_ofertadas), sum(effective.corridas_aceitas),
    sum(effective.corridas_rejeitadas), sum(effective.corridas_completadas),
    sum(effective.total_segundos), sum(effective.soma_taxas_aceitas), now()
  FROM effective_daily effective
  GROUP BY effective.id_entregador, effective.praca, effective.sub_praca, effective.origem;

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  DELETE FROM public.dashboard_entregadores_agregado_semanal_entregador rollup
  WHERE rollup.organization_id = p_organization_id
    AND rollup.ano_iso = p_ano_iso
    AND rollup.semana_numero = p_semana_numero;

  INSERT INTO public.dashboard_entregadores_agregado_semanal_entregador (
    organization_id, ano_iso, semana_numero, week_start_date,
    id_entregador, nome_entregador, corridas_ofertadas, corridas_aceitas,
    corridas_rejeitadas, corridas_completadas, total_segundos,
    soma_taxas_aceitas, updated_at
  )
  SELECT
    weekly.organization_id, weekly.ano_iso, weekly.semana_numero, weekly.week_start_date,
    weekly.id_entregador,
    coalesce(
      max(nullif(btrim(weekly.nome_entregador), '')) FILTER (
        WHERE position(chr(195) IN weekly.nome_entregador) = 0
          AND position(chr(194) IN weekly.nome_entregador) = 0
      ),
      max(nullif(btrim(weekly.nome_entregador), '')),
      weekly.id_entregador
    ),
    sum(weekly.corridas_ofertadas), sum(weekly.corridas_aceitas),
    sum(weekly.corridas_rejeitadas), sum(weekly.corridas_completadas),
    sum(weekly.total_segundos), sum(weekly.soma_taxas_aceitas), now()
  FROM public.dashboard_entregadores_agregado_semanal weekly
  WHERE weekly.organization_id = p_organization_id
    AND weekly.ano_iso = p_ano_iso
    AND weekly.semana_numero = p_semana_numero
  GROUP BY weekly.organization_id, weekly.ano_iso, weekly.semana_numero,
    weekly.week_start_date, weekly.id_entregador;

  INSERT INTO public.dashboard_entregadores_weekly_backfill (
    organization_id, ano_iso, semana_numero, week_start_date, completed_at, driver_completed_at, updated_at
  ) VALUES (p_organization_id, p_ano_iso, p_semana_numero, v_week_start, now(), now(), now())
  ON CONFLICT (organization_id, ano_iso, semana_numero)
  DO UPDATE SET week_start_date = excluded.week_start_date,
                completed_at = now(),
                driver_completed_at = now(),
                updated_at = now();

  RETURN v_rows;
END;
$function$;

CREATE OR REPLACE FUNCTION public.backfill_dashboard_entregadores_driver_weekly(p_limit integer DEFAULT 8)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_scope record;
  v_processed integer := 0;
  v_rows bigint := 0;
  v_week_rows bigint := 0;
BEGIN
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 32 THEN
    RAISE EXCEPTION 'p_limit deve estar entre 1 e 32.' USING ERRCODE = '22023';
  END IF;

  FOR v_scope IN
    SELECT queue.organization_id, queue.ano_iso, queue.semana_numero, queue.week_start_date
    FROM public.dashboard_entregadores_weekly_backfill queue
    WHERE queue.completed_at IS NOT NULL
      AND queue.driver_completed_at IS NULL
    ORDER BY queue.week_start_date, queue.organization_id
    LIMIT p_limit
  LOOP
    PERFORM pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(
        v_scope.organization_id::text || ':' || v_scope.ano_iso::text || ':' || v_scope.semana_numero::text,
        0
      )
    );

    IF NOT EXISTS (
      SELECT 1 FROM public.dashboard_entregadores_weekly_backfill queue
      WHERE queue.organization_id = v_scope.organization_id
        AND queue.ano_iso = v_scope.ano_iso
        AND queue.semana_numero = v_scope.semana_numero
        AND queue.completed_at IS NOT NULL
        AND queue.driver_completed_at IS NULL
    ) THEN
      CONTINUE;
    END IF;

    DELETE FROM public.dashboard_entregadores_agregado_semanal_entregador rollup
    WHERE rollup.organization_id = v_scope.organization_id
      AND rollup.ano_iso = v_scope.ano_iso
      AND rollup.semana_numero = v_scope.semana_numero;

    INSERT INTO public.dashboard_entregadores_agregado_semanal_entregador (
      organization_id, ano_iso, semana_numero, week_start_date,
      id_entregador, nome_entregador, corridas_ofertadas, corridas_aceitas,
      corridas_rejeitadas, corridas_completadas, total_segundos,
      soma_taxas_aceitas, updated_at
    )
    SELECT
      weekly.organization_id, weekly.ano_iso, weekly.semana_numero, weekly.week_start_date,
      weekly.id_entregador,
      coalesce(
        max(nullif(btrim(weekly.nome_entregador), '')) FILTER (
          WHERE position(chr(195) IN weekly.nome_entregador) = 0
            AND position(chr(194) IN weekly.nome_entregador) = 0
        ),
        max(nullif(btrim(weekly.nome_entregador), '')),
        weekly.id_entregador
      ),
      sum(weekly.corridas_ofertadas), sum(weekly.corridas_aceitas),
      sum(weekly.corridas_rejeitadas), sum(weekly.corridas_completadas),
      sum(weekly.total_segundos), sum(weekly.soma_taxas_aceitas), now()
    FROM public.dashboard_entregadores_agregado_semanal weekly
    WHERE weekly.organization_id = v_scope.organization_id
      AND weekly.ano_iso = v_scope.ano_iso
      AND weekly.semana_numero = v_scope.semana_numero
    GROUP BY weekly.organization_id, weekly.ano_iso, weekly.semana_numero,
      weekly.week_start_date, weekly.id_entregador;

    GET DIAGNOSTICS v_week_rows = ROW_COUNT;
    v_rows := v_rows + v_week_rows;
    v_processed := v_processed + 1;

    UPDATE public.dashboard_entregadores_weekly_backfill queue
    SET driver_completed_at = now(), updated_at = now()
    WHERE queue.organization_id = v_scope.organization_id
      AND queue.ano_iso = v_scope.ano_iso
      AND queue.semana_numero = v_scope.semana_numero;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'processed_weeks', v_processed,
    'driver_rows', v_rows,
    'pending_weeks', (
      SELECT count(*)::integer
      FROM public.dashboard_entregadores_weekly_backfill queue
      WHERE queue.completed_at IS NOT NULL AND queue.driver_completed_at IS NULL
    )
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.backfill_dashboard_entregadores_driver_weekly(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.backfill_dashboard_entregadores_driver_weekly(integer) TO service_role;

CREATE OR REPLACE FUNCTION public.listar_entregadores_dashboard_page_weekly_v1(
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
  v_result jsonb;
  v_sort_field text;
  v_sort_direction text;
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

  -- Keep the legacy implementation authoritative for unsupported or special
  -- scopes until a weekly row can be safely selected.
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

  -- Never read a full week whose backfill/refresh is pending. Returning an
  -- explicit retryable error prevents a successful response with stale totals.
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

  v_sort_field := CASE WHEN p_sort_field IN (
    'id_entregador', 'nome_entregador', 'corridas_ofertadas', 'corridas_aceitas',
    'corridas_rejeitadas', 'corridas_completadas', 'aderencia_percentual',
    'rejeicao_percentual', 'total_segundos', 'percentual_aceitas', 'percentual_completadas'
  ) THEN p_sort_field ELSE 'aderencia_percentual' END;
  v_sort_direction := CASE WHEN lower(p_sort_direction) = 'asc' THEN 'asc' ELSE 'desc' END;

  v_query_started_at := clock_timestamp();
  WITH full_week_rows AS MATERIALIZED (
    SELECT rollup.id_entregador, rollup.nome_entregador,
      rollup.corridas_ofertadas, rollup.corridas_aceitas,
      rollup.corridas_rejeitadas, rollup.corridas_completadas,
      rollup.total_segundos
    FROM public.dashboard_entregadores_agregado_semanal_entregador rollup
    WHERE rollup.organization_id = v_organization_id
      AND rollup.week_start_date >= v_data_inicial
      AND rollup.week_start_date <= v_data_final - 6
      AND (NOT v_week_filter OR (rollup.ano_iso = p_ano AND rollup.semana_numero = ANY(v_selected_weeks)))
      AND v_pracas IS NULL AND v_sub_pracas IS NULL AND v_origens IS NULL
    UNION ALL
    SELECT weekly.id_entregador, weekly.nome_entregador,
      weekly.corridas_ofertadas, weekly.corridas_aceitas,
      weekly.corridas_rejeitadas, weekly.corridas_completadas,
      weekly.total_segundos
    FROM public.dashboard_entregadores_agregado_semanal weekly
    WHERE weekly.organization_id = v_organization_id
      AND weekly.week_start_date >= v_data_inicial
      AND weekly.week_start_date <= v_data_final - 6
      AND (NOT v_week_filter OR (weekly.ano_iso = p_ano AND weekly.semana_numero = ANY(v_selected_weeks)))
      AND (v_pracas IS NOT NULL OR v_sub_pracas IS NOT NULL OR v_origens IS NOT NULL)
      AND (v_pracas IS NULL OR weekly.praca = ANY(v_pracas))
      AND (v_sub_pracas IS NULL OR weekly.sub_praca = ANY(v_sub_pracas))
      AND (v_origens IS NULL OR weekly.origem = ANY(v_origens))
  ), incremental_scopes AS MATERIALIZED (
    SELECT scope.organization_id, scope.data_do_periodo, scope.praca, scope.sub_praca, scope.origem
    FROM public.dashboard_entregadores_incremental_scopes scope
    WHERE scope.organization_id = v_organization_id
      AND scope.data_do_periodo >= v_data_inicial
      AND scope.data_do_periodo <= v_data_final
      AND (v_pracas IS NULL OR scope.praca = ANY(v_pracas))
      AND (v_sub_pracas IS NULL OR scope.sub_praca = ANY(v_sub_pracas))
      AND (v_origens IS NULL OR scope.origem = ANY(v_origens))
      AND (
        (
          v_data_inicial > date_trunc('week', v_data_inicial::timestamp)::date
          AND scope.data_do_periodo < date_trunc('week', v_data_inicial::timestamp)::date + 7
        )
        OR (
          v_data_final < date_trunc('week', v_data_final::timestamp)::date + 6
          AND scope.data_do_periodo >= date_trunc('week', v_data_final::timestamp)::date
        )
      )
  ), partial_daily_rows AS MATERIALIZED (
    SELECT mv.id_entregador, mv.nome_entregador,
      mv.corridas_ofertadas, mv.corridas_aceitas, mv.corridas_rejeitadas,
      mv.corridas_completadas, mv.total_segundos
    FROM public.mv_entregadores_agregado mv
    WHERE mv.organization_id = v_organization_id
      AND mv.data_do_periodo >= v_data_inicial
      AND mv.data_do_periodo <= v_data_final
      AND mv.id_entregador IS NOT NULL AND mv.id_entregador <> ''
      AND mv.nome_entregador IS NOT NULL
      AND (v_pracas IS NULL OR mv.praca = ANY(v_pracas))
      AND (v_sub_pracas IS NULL OR mv.sub_praca = ANY(v_sub_pracas))
      AND (v_origens IS NULL OR mv.origem = ANY(v_origens))
      AND (
        (
          v_data_inicial > date_trunc('week', v_data_inicial::timestamp)::date
          AND mv.data_do_periodo < date_trunc('week', v_data_inicial::timestamp)::date + 7
        )
        OR (
          v_data_final < date_trunc('week', v_data_final::timestamp)::date + 6
          AND mv.data_do_periodo >= date_trunc('week', v_data_final::timestamp)::date
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
    WHERE inc.organization_id = v_organization_id
      AND inc.data_do_periodo >= v_data_inicial
      AND inc.data_do_periodo <= v_data_final
      AND inc.id_entregador IS NOT NULL AND inc.id_entregador <> ''
      AND inc.nome_entregador IS NOT NULL
      AND (v_pracas IS NULL OR inc.praca = ANY(v_pracas))
      AND (v_sub_pracas IS NULL OR inc.sub_praca = ANY(v_sub_pracas))
      AND (v_origens IS NULL OR inc.origem = ANY(v_origens))
      AND (
        (
          v_data_inicial > date_trunc('week', v_data_inicial::timestamp)::date
          AND inc.data_do_periodo < date_trunc('week', v_data_inicial::timestamp)::date + 7
        )
        OR (
          v_data_final < date_trunc('week', v_data_final::timestamp)::date + 6
          AND inc.data_do_periodo >= date_trunc('week', v_data_final::timestamp)::date
        )
      )
  ), source_rows AS (
    SELECT * FROM full_week_rows
    UNION ALL
    SELECT * FROM partial_daily_rows
  ), aggregated_rows AS MATERIALIZED (
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
    WHERE (v_search IS NULL
      OR position(lower(v_search) IN lower(coalesce(aggregated.id_entregador, ''))) > 0
      OR position(lower(v_search) IN lower(coalesce(aggregated.nome_entregador, ''))) > 0)
      AND (NOT coalesce(p_only_inactive, false) OR coalesce(aggregated.corridas_completadas, 0) = 0)
  ), totals AS (
    SELECT count(*)::integer AS total,
      coalesce(avg(coalesce(aderencia_percentual, 0)), 0) AS aderencia_media,
      coalesce(avg(coalesce(rejeicao_percentual, 0)), 0) AS rejeicao_media,
      coalesce(sum(coalesce(corridas_completadas, 0)), 0) AS corridas_completadas,
      coalesce(sum(coalesce(total_segundos, 0)), 0) AS total_segundos
    FROM filtered_rows
  ), page_size AS (
    SELECT CASE
      WHEN p_limit <> -1 THEN p_limit
      WHEN totals.total > 1000 THEN 24
      WHEN totals.total > 400 THEN 35
      ELSE 50
    END AS value
    FROM totals
  ), ordered_rows AS MATERIALIZED (
    SELECT row_data.*,
      row_number() OVER (ORDER BY
        CASE WHEN v_sort_field = 'id_entregador' AND v_sort_direction = 'asc' AND row_data.id_entregador ~ '^[0-9]+$' THEN row_data.id_entregador::numeric END ASC NULLS LAST,
        CASE WHEN v_sort_field = 'id_entregador' AND v_sort_direction = 'desc' AND row_data.id_entregador ~ '^[0-9]+$' THEN row_data.id_entregador::numeric END DESC NULLS LAST,
        CASE WHEN v_sort_field = 'id_entregador' AND v_sort_direction = 'asc' AND row_data.id_entregador !~ '^[0-9]+$' THEN lower(row_data.id_entregador) END ASC NULLS LAST,
        CASE WHEN v_sort_field = 'id_entregador' AND v_sort_direction = 'desc' AND row_data.id_entregador !~ '^[0-9]+$' THEN lower(row_data.id_entregador) END DESC NULLS LAST,
        CASE WHEN v_sort_field = 'nome_entregador' AND v_sort_direction = 'asc' THEN lower(row_data.nome_entregador) END ASC NULLS LAST,
        CASE WHEN v_sort_field = 'nome_entregador' AND v_sort_direction = 'desc' THEN lower(row_data.nome_entregador) END DESC NULLS LAST,
        CASE WHEN v_sort_field = 'corridas_ofertadas' AND v_sort_direction = 'asc' THEN row_data.corridas_ofertadas END ASC NULLS LAST,
        CASE WHEN v_sort_field = 'corridas_ofertadas' AND v_sort_direction = 'desc' THEN row_data.corridas_ofertadas END DESC NULLS LAST,
        CASE WHEN v_sort_field = 'corridas_aceitas' AND v_sort_direction = 'asc' THEN row_data.corridas_aceitas END ASC NULLS LAST,
        CASE WHEN v_sort_field = 'corridas_aceitas' AND v_sort_direction = 'desc' THEN row_data.corridas_aceitas END DESC NULLS LAST,
        CASE WHEN v_sort_field = 'corridas_rejeitadas' AND v_sort_direction = 'asc' THEN row_data.corridas_rejeitadas END ASC NULLS LAST,
        CASE WHEN v_sort_field = 'corridas_rejeitadas' AND v_sort_direction = 'desc' THEN row_data.corridas_rejeitadas END DESC NULLS LAST,
        CASE WHEN v_sort_field = 'corridas_completadas' AND v_sort_direction = 'asc' THEN row_data.corridas_completadas END ASC NULLS LAST,
        CASE WHEN v_sort_field = 'corridas_completadas' AND v_sort_direction = 'desc' THEN row_data.corridas_completadas END DESC NULLS LAST,
        CASE WHEN v_sort_field = 'aderencia_percentual' AND v_sort_direction = 'asc' THEN row_data.aderencia_percentual END ASC NULLS LAST,
        CASE WHEN v_sort_field = 'aderencia_percentual' AND v_sort_direction = 'desc' THEN row_data.aderencia_percentual END DESC NULLS LAST,
        CASE WHEN v_sort_field = 'rejeicao_percentual' AND v_sort_direction = 'asc' THEN row_data.rejeicao_percentual END ASC NULLS LAST,
        CASE WHEN v_sort_field = 'rejeicao_percentual' AND v_sort_direction = 'desc' THEN row_data.rejeicao_percentual END DESC NULLS LAST,
        CASE WHEN v_sort_field = 'total_segundos' AND v_sort_direction = 'asc' THEN row_data.total_segundos END ASC NULLS LAST,
        CASE WHEN v_sort_field = 'total_segundos' AND v_sort_direction = 'desc' THEN row_data.total_segundos END DESC NULLS LAST,
        CASE WHEN v_sort_field = 'percentual_aceitas' AND v_sort_direction = 'asc' THEN coalesce(row_data.corridas_aceitas::numeric * 100 / nullif(row_data.corridas_ofertadas, 0), 0) END ASC NULLS LAST,
        CASE WHEN v_sort_field = 'percentual_aceitas' AND v_sort_direction = 'desc' THEN coalesce(row_data.corridas_aceitas::numeric * 100 / nullif(row_data.corridas_ofertadas, 0), 0) END DESC NULLS LAST,
        CASE WHEN v_sort_field = 'percentual_completadas' AND v_sort_direction = 'asc' THEN coalesce(row_data.corridas_completadas::numeric * 100 / nullif(row_data.corridas_aceitas, 0), 0) END ASC NULLS LAST,
        CASE WHEN v_sort_field = 'percentual_completadas' AND v_sort_direction = 'desc' THEN coalesce(row_data.corridas_completadas::numeric * 100 / nullif(row_data.corridas_aceitas, 0), 0) END DESC NULLS LAST,
        row_data.id_entregador ASC
      ) AS row_number
    FROM filtered_rows row_data
  ), page_rows AS (
    SELECT coalesce(jsonb_agg(to_jsonb(page_row) - 'row_number' ORDER BY page_row.row_number), '[]'::jsonb) AS rows
    FROM ordered_rows page_row
    CROSS JOIN page_size
    WHERE (p_limit = 0 OR page_row.row_number > ((p_page - 1) * page_size.value))
      AND (p_limit = 0 OR page_row.row_number <= (p_page * page_size.value))
  ), performers AS (
    SELECT jsonb_build_object(
      'aderencia', jsonb_build_object(
        'top', (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM (SELECT * FROM filtered_rows ORDER BY aderencia_percentual DESC NULLS LAST, id_entregador ASC LIMIT 10) x),
        'bottom', (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM (SELECT * FROM filtered_rows ORDER BY aderencia_percentual ASC NULLS LAST, id_entregador ASC LIMIT 10) x)
      ),
      'completadas', jsonb_build_object(
        'top', (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM (SELECT * FROM filtered_rows ORDER BY corridas_completadas DESC NULLS LAST, id_entregador ASC LIMIT 10) x),
        'bottom', (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM (SELECT * FROM filtered_rows ORDER BY corridas_completadas ASC NULLS LAST, id_entregador ASC LIMIT 10) x)
      ),
      'horas', jsonb_build_object(
        'top', (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM (SELECT * FROM filtered_rows ORDER BY total_segundos DESC NULLS LAST, id_entregador ASC LIMIT 10) x),
        'bottom', (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM (SELECT * FROM filtered_rows ORDER BY total_segundos ASC NULLS LAST, id_entregador ASC LIMIT 10) x)
      ),
      'rejeicao', jsonb_build_object(
        'top', (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM (SELECT * FROM filtered_rows ORDER BY rejeicao_percentual ASC NULLS LAST, id_entregador ASC LIMIT 10) x),
        'bottom', (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM (SELECT * FROM filtered_rows ORDER BY rejeicao_percentual DESC NULLS LAST, id_entregador ASC LIMIT 10) x)
      )
    ) AS data
  )
  SELECT jsonb_build_object(
    'entregadores', page_rows.rows,
    'total', totals.total,
    'page', p_page,
    'page_size', page_size.value,
    'periodo_resolvido', jsonb_build_object(
      'ano', p_ano,
      'semana', CASE WHEN v_week_filter AND coalesce(p_semana, 0) > 0 THEN p_semana ELSE NULL END,
      'semanas', CASE WHEN v_week_filter THEN coalesce(to_jsonb(v_selected_weeks), '[]'::jsonb) ELSE '[]'::jsonb END,
      'auto_semana', false,
      'search', CASE WHEN length(coalesce(v_search, '')) >= 3 THEN v_search ELSE NULL END
    ),
    'summary', jsonb_build_object(
      'total_entregadores', totals.total,
      'aderencia_media', totals.aderencia_media,
      'rejeicao_media', totals.rejeicao_media,
      'corridas_completadas', totals.corridas_completadas,
      'total_segundos', totals.total_segundos
    ),
    'performers_by_metric', performers.data
  ) INTO v_result
  FROM totals CROSS JOIN page_rows CROSS JOIN performers CROSS JOIN page_size;

  v_query_ms := round(extract(epoch FROM clock_timestamp() - v_query_started_at) * 1000, 2);
  RETURN coalesce(v_result, jsonb_build_object(
    'entregadores', '[]'::jsonb, 'total', 0, 'page', p_page, 'page_size', 0,
    'periodo_resolvido', jsonb_build_object('ano', p_ano, 'semana', NULL, 'semanas', '[]'::jsonb, 'auto_semana', false, 'search', NULL),
    'summary', jsonb_build_object('total_entregadores', 0, 'aderencia_media', 0, 'rejeicao_media', 0, 'corridas_completadas', 0, 'total_segundos', 0),
    'performers_by_metric', '{}'::jsonb
  )) || jsonb_build_object('_diagnostics', jsonb_build_object('aggregation_ms', v_query_ms));
END;
$function$;
