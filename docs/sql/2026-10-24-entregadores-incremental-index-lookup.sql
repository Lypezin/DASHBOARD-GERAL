-- Use the existing expression index for each affected courier scope.
-- The original NULL-safe predicates remain to preserve exact matching,
-- including when a real dimension value is the index's NULL sentinel.
CREATE OR REPLACE FUNCTION public.refresh_entregadores_agregado_incremental(p_limit integer DEFAULT 500)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_limit integer := greatest(1, least(coalesce(p_limit, 500), 5000));
  v_impact_count integer := 0;
  v_deleted_count integer := 0;
  v_upserted_count integer := 0;
  v_weekly_rows bigint := 0;
  v_started_at timestamptz := clock_timestamp();
  v_week record;
  v_year record;
BEGIN
  IF NOT pg_catalog.pg_try_advisory_xact_lock(
    pg_catalog.hashtextextended('refresh_incremental:entregadores_agregado', 0)
  ) THEN
    RETURN json_build_object(
      'success', true,
      'skipped', true,
      'reason', 'entregadores incremental refresh already running'
    );
  END IF;

  DROP TABLE IF EXISTS pg_temp.tmp_entregadores_agregado_impacts;
  CREATE TEMPORARY TABLE tmp_entregadores_agregado_impacts (
    id bigint PRIMARY KEY,
    organization_id uuid NOT NULL,
    data_do_periodo date NOT NULL,
    praca text,
    sub_praca text,
    origem text
  ) ON COMMIT DROP;

  INSERT INTO tmp_entregadores_agregado_impacts (
    id, organization_id, data_do_periodo, praca, sub_praca, origem
  )
  SELECT id, organization_id, data_do_periodo, praca, sub_praca, origem
  FROM public.mv_refresh_impacts
  WHERE source = 'corridas'
    AND entregadores_agregado_processed_at IS NULL
  ORDER BY id
  LIMIT v_limit
  FOR UPDATE SKIP LOCKED;
  GET DIAGNOSTICS v_impact_count = ROW_COUNT;

  IF v_impact_count = 0 THEN
    RETURN json_build_object(
      'success', true,
      'processed_impacts', 0,
      'deleted_rows', 0,
      'upserted_rows', 0,
      'weekly_rows', 0,
      'duration_ms', round(extract(epoch FROM clock_timestamp() - v_started_at) * 1000)
    );
  END IF;

  INSERT INTO public.dashboard_entregadores_incremental_scopes (
    organization_id, data_do_periodo, praca, sub_praca, origem, processed_at
  )
  SELECT DISTINCT organization_id, data_do_periodo, praca, sub_praca, origem, now()
  FROM pg_temp.tmp_entregadores_agregado_impacts
  ON CONFLICT ON CONSTRAINT dashboard_entregadores_incremental_scopes_scope_key
  DO UPDATE SET processed_at = excluded.processed_at;

  DELETE FROM public.tb_entregadores_agregado_incremental existing
  USING pg_temp.tmp_entregadores_agregado_impacts impact
  WHERE existing.organization_id = impact.organization_id
    AND existing.data_do_periodo = impact.data_do_periodo
    AND existing.praca IS NOT DISTINCT FROM impact.praca
    AND existing.sub_praca IS NOT DISTINCT FROM impact.sub_praca
    AND existing.origem IS NOT DISTINCT FROM impact.origem;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  WITH affected AS (
    SELECT DISTINCT organization_id, data_do_periodo, praca, sub_praca, origem
    FROM pg_temp.tmp_entregadores_agregado_impacts
  ), upserted AS (
    INSERT INTO public.tb_entregadores_agregado_incremental (
      id_entregador, nome_entregador, praca, sub_praca, origem,
      ano_iso, semana_numero, data_do_periodo, organization_id,
      corridas_ofertadas, corridas_aceitas, corridas_rejeitadas,
      corridas_completadas, total_segundos, soma_taxas_aceitas, updated_at
    )
    SELECT
      d.id_da_pessoa_entregadora,
      max(d.pessoa_entregadora),
      d.praca, d.sub_praca, d.origem, d.ano_iso, d.semana_numero,
      d.data_do_periodo, d.organization_id,
      sum(d.numero_de_corridas_ofertadas),
      sum(d.numero_de_corridas_aceitas),
      sum(d.numero_de_corridas_rejeitadas),
      sum(d.numero_de_corridas_completadas),
      sum(d.tempo_disponivel_absoluto_segundos),
      sum(d.soma_das_taxas_das_corridas_aceitas),
      now()
    FROM public.dados_corridas d
    JOIN affected a
      ON d.organization_id = a.organization_id
     AND d.data_do_periodo = a.data_do_periodo
     AND coalesce(d.praca, '__NULL__') = coalesce(a.praca, '__NULL__')
     AND coalesce(d.sub_praca, '__NULL__') = coalesce(a.sub_praca, '__NULL__')
     AND coalesce(d.origem, '__NULL__') = coalesce(a.origem, '__NULL__')
     AND d.praca IS NOT DISTINCT FROM a.praca
     AND d.sub_praca IS NOT DISTINCT FROM a.sub_praca
     AND d.origem IS NOT DISTINCT FROM a.origem
    WHERE d.id_da_pessoa_entregadora IS NOT NULL
    GROUP BY d.id_da_pessoa_entregadora, d.praca, d.sub_praca, d.origem,
      d.ano_iso, d.semana_numero, d.data_do_periodo, d.organization_id
    ON CONFLICT (
      id_entregador, praca, sub_praca, origem, ano_iso, semana_numero,
      data_do_periodo, organization_id
    ) DO UPDATE SET
      nome_entregador = excluded.nome_entregador,
      corridas_ofertadas = excluded.corridas_ofertadas,
      corridas_aceitas = excluded.corridas_aceitas,
      corridas_rejeitadas = excluded.corridas_rejeitadas,
      corridas_completadas = excluded.corridas_completadas,
      total_segundos = excluded.total_segundos,
      soma_taxas_aceitas = excluded.soma_taxas_aceitas,
      updated_at = now()
    RETURNING 1
  )
  SELECT count(*) INTO v_upserted_count FROM upserted;

  FOR v_week IN
    SELECT DISTINCT
      impact.organization_id,
      extract(isoyear FROM impact.data_do_periodo)::integer AS ano_iso,
      extract(week FROM impact.data_do_periodo)::integer AS semana_numero
    FROM pg_temp.tmp_entregadores_agregado_impacts impact
    ORDER BY impact.organization_id,
      extract(isoyear FROM impact.data_do_periodo)::integer,
      extract(week FROM impact.data_do_periodo)::integer
  LOOP
    v_weekly_rows := v_weekly_rows + public.dashboard_entregadores_rebuild_week(
      v_week.organization_id, v_week.ano_iso, v_week.semana_numero
    );
  END LOOP;

  UPDATE public.mv_refresh_impacts impact
  SET entregadores_agregado_processed_at = now(), updated_at = now()
  FROM pg_temp.tmp_entregadores_agregado_impacts batch
  WHERE impact.id = batch.id;

  -- Refresh the compact calendar-year summary once all queued impacts for this
  -- organization are applied. The page RPC reads it only after this condition.
  FOR v_year IN
    SELECT DISTINCT impact.organization_id, affected_year.calendar_year
    FROM pg_temp.tmp_entregadores_agregado_impacts impact
    CROSS JOIN LATERAL (VALUES
      (extract(year FROM impact.data_do_periodo)::integer),
      (extract(year FROM (date_trunc('week', impact.data_do_periodo::timestamp)::date + 6))::integer)
    ) AS affected_year(calendar_year)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.mv_refresh_impacts pending
      WHERE pending.source = 'corridas'
        AND pending.organization_id = impact.organization_id
        AND pending.entregadores_agregado_processed_at IS NULL
    )
    ORDER BY impact.organization_id, affected_year.calendar_year
  LOOP
    PERFORM public.dashboard_entregadores_rebuild_calendar_year(
      v_year.organization_id, v_year.calendar_year
    );
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'processed_impacts', v_impact_count,
    'deleted_rows', v_deleted_count,
    'upserted_rows', v_upserted_count,
    'weekly_rows', v_weekly_rows,
    'duration_ms', round(extract(epoch FROM clock_timestamp() - v_started_at) * 1000)
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'processed_impacts', v_impact_count,
    'deleted_rows', v_deleted_count,
    'upserted_rows', v_upserted_count,
    'weekly_rows', v_weekly_rows,
    'error', SQLERRM,
    'duration_ms', round(extract(epoch FROM clock_timestamp() - v_started_at) * 1000)
  );
END;
$function$;
