-- Fast, fresh weekly source for the Entregadores dashboard.
-- The rollout flag stays off until the backfill and parity checks finish.

CREATE TABLE IF NOT EXISTS public.dashboard_entregadores_incremental_scopes (
  organization_id uuid NOT NULL,
  data_do_periodo date NOT NULL,
  praca text,
  sub_praca text,
  origem text,
  processed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dashboard_entregadores_incremental_scopes_scope_key
    UNIQUE NULLS NOT DISTINCT (organization_id, data_do_periodo, praca, sub_praca, origem)
);

CREATE TABLE IF NOT EXISTS public.dashboard_entregadores_agregado_semanal (
  organization_id uuid NOT NULL,
  ano_iso integer NOT NULL,
  semana_numero integer NOT NULL,
  week_start_date date NOT NULL,
  id_entregador text NOT NULL,
  nome_entregador text NOT NULL,
  praca text,
  sub_praca text,
  origem text,
  corridas_ofertadas bigint,
  corridas_aceitas bigint,
  corridas_rejeitadas bigint,
  corridas_completadas bigint,
  total_segundos numeric,
  soma_taxas_aceitas numeric,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dashboard_entregadores_agregado_semanal_scope_key
    UNIQUE NULLS NOT DISTINCT (
      organization_id, ano_iso, semana_numero, id_entregador, praca, sub_praca, origem
    )
);

CREATE TABLE IF NOT EXISTS public.dashboard_entregadores_weekly_backfill (
  organization_id uuid NOT NULL,
  ano_iso integer NOT NULL,
  semana_numero integer NOT NULL,
  week_start_date date NOT NULL,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dashboard_entregadores_weekly_backfill_pkey
    PRIMARY KEY (organization_id, ano_iso, semana_numero)
);

CREATE INDEX IF NOT EXISTS idx_dashboard_entregadores_weekly_backfill_pending
  ON public.dashboard_entregadores_weekly_backfill (week_start_date, organization_id)
  WHERE completed_at IS NULL;

CREATE TABLE IF NOT EXISTS public.dashboard_entregadores_rollout_state (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  enabled boolean NOT NULL DEFAULT false,
  shadow_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.dashboard_entregadores_rollout_state (singleton, enabled, shadow_enabled)
VALUES (true, false, false)
ON CONFLICT (singleton) DO NOTHING;

ALTER TABLE public.dashboard_entregadores_incremental_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_entregadores_agregado_semanal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_entregadores_weekly_backfill ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_entregadores_rollout_state ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.dashboard_entregadores_incremental_scopes,
  public.dashboard_entregadores_agregado_semanal,
  public.dashboard_entregadores_weekly_backfill,
  public.dashboard_entregadores_rollout_state
FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dashboard_entregadores_incremental_scopes,
  public.dashboard_entregadores_agregado_semanal,
  public.dashboard_entregadores_weekly_backfill,
  public.dashboard_entregadores_rollout_state
TO service_role;

-- Keep previously refreshed, empty daily scopes as tombstones. Without these
-- rows an old MV row becomes visible again after the last source row is deleted.
INSERT INTO public.dashboard_entregadores_incremental_scopes (
  organization_id, data_do_periodo, praca, sub_praca, origem, processed_at
)
SELECT DISTINCT
  inc.organization_id, inc.data_do_periodo, inc.praca, inc.sub_praca, inc.origem, now()
FROM public.tb_entregadores_agregado_incremental inc
WHERE inc.organization_id IS NOT NULL
  AND inc.data_do_periodo IS NOT NULL
ON CONFLICT ON CONSTRAINT dashboard_entregadores_incremental_scopes_scope_key
DO UPDATE SET processed_at = greatest(
  public.dashboard_entregadores_incremental_scopes.processed_at,
  excluded.processed_at
);

INSERT INTO public.dashboard_entregadores_incremental_scopes (
  organization_id, data_do_periodo, praca, sub_praca, origem, processed_at
)
SELECT DISTINCT
  impact.organization_id,
  impact.data_do_periodo,
  impact.praca,
  impact.sub_praca,
  impact.origem,
  coalesce(impact.entregadores_agregado_processed_at, now())
FROM public.mv_refresh_impacts impact
WHERE impact.source = 'corridas'
  AND impact.entregadores_agregado_processed_at IS NOT NULL
ON CONFLICT ON CONSTRAINT dashboard_entregadores_incremental_scopes_scope_key
DO UPDATE SET processed_at = greatest(
  public.dashboard_entregadores_incremental_scopes.processed_at,
  excluded.processed_at
);

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

  INSERT INTO public.dashboard_entregadores_weekly_backfill (
    organization_id, ano_iso, semana_numero, week_start_date, completed_at, updated_at
  ) VALUES (p_organization_id, p_ano_iso, p_semana_numero, v_week_start, now(), now())
  ON CONFLICT (organization_id, ano_iso, semana_numero)
  DO UPDATE SET week_start_date = excluded.week_start_date,
                completed_at = now(),
                updated_at = now();

  RETURN v_rows;
END;
$function$;

REVOKE ALL ON FUNCTION public.dashboard_entregadores_rebuild_week(uuid, integer, integer)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dashboard_entregadores_rebuild_week(uuid, integer, integer)
TO service_role;

CREATE OR REPLACE FUNCTION public.backfill_dashboard_entregadores_weekly(p_limit integer DEFAULT 4)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_limit integer := greatest(1, least(coalesce(p_limit, 4), 16));
  v_processed integer := 0;
  v_rows bigint := 0;
  v_pending bigint := 0;
  v_week record;
  v_started_at timestamptz := clock_timestamp();
BEGIN
  -- Pick up an impact that may have completed while this migration was being
  -- installed with the previous refresh function body.
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

-- Rebuild daily scopes and their weekly rollups in the same transaction before
-- a refresh impact is marked complete. Empty scopes are retained as tombstones.
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

REVOKE ALL ON FUNCTION public.refresh_entregadores_agregado_incremental(integer)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_entregadores_agregado_incremental(integer)
TO service_role;

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
    SELECT weekly.id_entregador, weekly.nome_entregador,
      weekly.corridas_ofertadas, weekly.corridas_aceitas,
      weekly.corridas_rejeitadas, weekly.corridas_completadas,
      weekly.total_segundos
    FROM public.dashboard_entregadores_agregado_semanal weekly
    WHERE weekly.organization_id = v_organization_id
      AND weekly.week_start_date >= v_data_inicial
      AND weekly.week_start_date + 6 <= v_data_final
      AND (NOT v_week_filter OR (weekly.ano_iso = p_ano AND weekly.semana_numero = ANY(v_selected_weeks)))
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

REVOKE ALL ON FUNCTION public.listar_entregadores_dashboard_page_weekly_v1(
  integer, integer, text, text, text, date, date, text, boolean, text,
  integer[], integer, integer, text, text, boolean
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listar_entregadores_dashboard_page_weekly_v1(
  integer, integer, text, text, text, date, date, text, boolean, text,
  integer[], integer, integer, text, text, boolean
) TO service_role;

-- Feature gate retains a one-statement rollback path to the old page RPC.
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
  v_enabled boolean := false;
  v_organization_id uuid;
  v_week_start date;
  v_single_week_requested boolean := false;
  v_result jsonb;
  v_search text := nullif(btrim(p_search), '');
BEGIN
  SELECT coalesce(state.enabled, false) INTO v_enabled
  FROM public.dashboard_entregadores_rollout_state state
  WHERE state.singleton = true;

  IF v_enabled THEN
    RETURN public.listar_entregadores_dashboard_page_weekly_v1(
      p_ano := p_ano, p_semana := p_semana, p_praca := p_praca,
      p_sub_praca := p_sub_praca, p_origem := p_origem,
      p_data_inicial := p_data_inicial, p_data_final := p_data_final,
      p_organization_id := p_organization_id, p_only_dedicados := p_only_dedicados,
      p_search := p_search, p_semanas := p_semanas, p_limit := p_limit,
      p_page := p_page, p_sort_field := p_sort_field,
      p_sort_direction := p_sort_direction, p_only_inactive := p_only_inactive
    );
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
    RETURN jsonb_set(v_result, '{periodo_resolvido}', jsonb_build_object(
      'ano', p_ano, 'semana', p_semana,
      'semanas', coalesce(to_jsonb(p_semanas), '[]'::jsonb),
      'auto_semana', false, 'search', NULL
    ), true);
  END IF;

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
$function$;

REVOKE ALL ON FUNCTION public.listar_entregadores_dashboard_page_v2(
  integer, integer, text, text, text, date, date, text, boolean, text,
  integer[], integer, integer, text, text, boolean
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listar_entregadores_dashboard_page_v2(
  integer, integer, text, text, text, date, date, text, boolean, text,
  integer[], integer, integer, text, text, boolean
) TO service_role;

NOTIFY pgrst, 'reload schema';
