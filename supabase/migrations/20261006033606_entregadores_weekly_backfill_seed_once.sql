ALTER TABLE public.dashboard_entregadores_rollout_state
  ADD COLUMN backfill_seeded boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.backfill_dashboard_entregadores_weekly(p_limit integer DEFAULT 4)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_limit integer := greatest(1, least(coalesce(p_limit, 4), 16));
  v_seeded boolean := false;
  v_processed integer := 0;
  v_rows bigint := 0;
  v_pending bigint := 0;
  v_week record;
  v_started_at timestamptz := clock_timestamp();
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('entregadores_weekly_backfill_seed', 0)
  );

  SELECT coalesce(state.backfill_seeded, false) INTO v_seeded
  FROM public.dashboard_entregadores_rollout_state state
  WHERE state.singleton = true
  FOR UPDATE;

  -- Catch an impact that may have completed while the first migration was
  -- installing the previous refresh function body.
  INSERT INTO public.dashboard_entregadores_incremental_scopes (
    organization_id, data_do_periodo, praca, sub_praca, origem, processed_at
  )
  SELECT DISTINCT impact.organization_id, impact.data_do_periodo,
    impact.praca, impact.sub_praca, impact.origem,
    coalesce(impact.entregadores_agregado_processed_at, now())
  FROM public.mv_refresh_impacts impact
  WHERE impact.source = 'corridas'
    AND impact.entregadores_agregado_processed_at IS NOT NULL
  ON CONFLICT ON CONSTRAINT dashboard_entregadores_incremental_scopes_scope_key
  DO UPDATE SET processed_at = greatest(
    public.dashboard_entregadores_incremental_scopes.processed_at,
    excluded.processed_at
  );

  IF NOT v_seeded THEN
    INSERT INTO public.dashboard_entregadores_weekly_backfill (
      organization_id, ano_iso, semana_numero, week_start_date
    )
    SELECT DISTINCT source.organization_id, source.ano_iso, source.semana_numero,
      date_trunc('week', source.data_do_periodo::timestamp)::date
    FROM (
      SELECT mv.organization_id, mv.ano_iso, mv.semana_numero, mv.data_do_periodo
      FROM public.mv_entregadores_agregado mv
      WHERE mv.organization_id IS NOT NULL
        AND mv.data_do_periodo IS NOT NULL
        AND mv.ano_iso BETWEEN 2000 AND 2100
        AND mv.semana_numero BETWEEN 1 AND 53
      UNION ALL
      SELECT inc.organization_id, inc.ano_iso, inc.semana_numero, inc.data_do_periodo
      FROM public.tb_entregadores_agregado_incremental inc
      WHERE inc.organization_id IS NOT NULL
        AND inc.data_do_periodo IS NOT NULL
        AND inc.ano_iso BETWEEN 2000 AND 2100
        AND inc.semana_numero BETWEEN 1 AND 53
      UNION ALL
      SELECT impact.organization_id, impact.ano_iso, impact.semana_numero, impact.data_do_periodo
      FROM public.mv_refresh_impacts impact
      WHERE impact.source = 'corridas'
        AND impact.organization_id IS NOT NULL
        AND impact.ano_iso BETWEEN 2000 AND 2100
        AND impact.semana_numero BETWEEN 1 AND 53
    ) source
    GROUP BY source.organization_id, source.ano_iso, source.semana_numero,
      date_trunc('week', source.data_do_periodo::timestamp)::date
    ON CONFLICT (organization_id, ano_iso, semana_numero) DO NOTHING;

    UPDATE public.dashboard_entregadores_rollout_state
    SET backfill_seeded = true, updated_at = now()
    WHERE singleton = true;
  END IF;

  FOR v_week IN
    SELECT queue.organization_id, queue.ano_iso, queue.semana_numero
    FROM public.dashboard_entregadores_weekly_backfill queue
    WHERE queue.completed_at IS NULL
    ORDER BY queue.week_start_date, queue.organization_id, queue.ano_iso, queue.semana_numero
    LIMIT v_limit
    FOR UPDATE SKIP LOCKED
  LOOP
    v_rows := v_rows + public.dashboard_entregadores_rebuild_week(
      v_week.organization_id, v_week.ano_iso, v_week.semana_numero
    );
    v_processed := v_processed + 1;
  END LOOP;

  SELECT count(*) INTO v_pending
  FROM public.dashboard_entregadores_weekly_backfill queue
  WHERE queue.completed_at IS NULL;

  RETURN jsonb_build_object(
    'success', true,
    'seeded', v_seeded OR EXISTS (
      SELECT 1 FROM public.dashboard_entregadores_rollout_state state
      WHERE state.singleton = true AND state.backfill_seeded
    ),
    'processed_weeks', v_processed,
    'upserted_rows', v_rows,
    'pending_weeks', v_pending,
    'duration_ms', round(extract(epoch FROM clock_timestamp() - v_started_at) * 1000)
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'processed_weeks', v_processed,
    'upserted_rows', v_rows,
    'error', SQLERRM,
    'duration_ms', round(extract(epoch FROM clock_timestamp() - v_started_at) * 1000)
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.backfill_dashboard_entregadores_weekly(integer)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.backfill_dashboard_entregadores_weekly(integer)
TO service_role;
