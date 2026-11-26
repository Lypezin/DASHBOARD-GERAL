-- 1. Avoid redundant writes & MVCC bloat on mv_refresh_control when already marked pending
CREATE OR REPLACE FUNCTION public.mark_mv_refresh_needed()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  update public.mv_refresh_control
  set
    needs_refresh = true,
    updated_at = now()
  where mv_name in (
    'mv_aderencia_agregada',
    'mv_aderencia_dia',
    'mv_aderencia_semana',
    'mv_dashboard_aderencia_metricas',
    'mv_dashboard_admin',
    'mv_dashboard_lite',
    'mv_dashboard_micro',
    'mv_entregadores_ativacao',
    'mv_entregadores_marketing',
    'mv_entregadores_summary',
    'mv_utr_stats'
  )
    and needs_refresh = false;

  return new;
end;
$function$;

-- 2. Increase incremental refresh batch throughput from 40 to 150 impacts per run
CREATE OR REPLACE FUNCTION public.process_incremental_refresh_impacts_job()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  job_name constant text := 'incremental-refresh-impacts-on-demand';
  result json;
  pending_count integer;
  unscheduled_count integer := 0;
begin
  -- Process up to 150 impacts per run to batch entire weeks together and drain uploads faster
  result := public.process_incremental_refresh_impacts(150, true);

  select count(*)
  into pending_count
  from public.mv_refresh_impacts
  where dashboard_resumo_processed_at is null
     or entregadores_agregado_processed_at is null
     or comparison_weekly_processed_at is null
     or corridas_agregadas_processed_at is null;

  if pending_count = 0 then
    with removed as (
      select cron.unschedule(jobid) as ok
      from cron.job
      where jobname = job_name
    )
    select count(*) filter (where ok) into unscheduled_count from removed;
  end if;

  return json_build_object(
    'success', true,
    'result', result,
    'pending_count', pending_count,
    'unscheduled_count', unscheduled_count
  );
end;
$function$;

-- 3. Fix Week-24 zombie-row parity bug by using dashboard_entregadores_incremental_scopes
--    as the authoritative exclusion set (instead of tb_entregadores_agregado_incremental,
--    which misses deleted scopes whose incremental rows became empty).
CREATE OR REPLACE VIEW public.vw_entregadores_agregado_current AS
 SELECT mv.id_entregador,
    mv.nome_entregador,
    mv.praca,
    mv.sub_praca,
    mv.origem,
    mv.ano_iso,
    mv.semana_numero,
    mv.data_do_periodo,
    mv.organization_id,
    mv.corridas_ofertadas,
    mv.corridas_aceitas,
    mv.corridas_rejeitadas,
    mv.corridas_completadas,
    mv.total_segundos,
    mv.soma_taxas_aceitas
   FROM public.mv_entregadores_agregado mv
  WHERE (NOT (EXISTS ( SELECT 1
           FROM public.dashboard_entregadores_incremental_scopes scope
          WHERE ((scope.organization_id = mv.organization_id)
            AND (scope.data_do_periodo = mv.data_do_periodo)
            AND (NOT (scope.praca IS DISTINCT FROM mv.praca))
            AND (NOT (scope.sub_praca IS DISTINCT FROM mv.sub_praca))
            AND (NOT (scope.origem IS DISTINCT FROM mv.origem))))))
UNION ALL
 SELECT inc.id_entregador,
    inc.nome_entregador,
    inc.praca,
    inc.sub_praca,
    inc.origem,
    inc.ano_iso,
    inc.semana_numero,
    inc.data_do_periodo,
    inc.organization_id,
    inc.corridas_ofertadas,
    inc.corridas_aceitas,
    inc.corridas_rejeitadas,
    inc.corridas_completadas,
    inc.total_segundos,
    inc.soma_taxas_aceitas
   FROM public.tb_entregadores_agregado_incremental inc;

CREATE OR REPLACE FUNCTION public.entregadores_dashboard_rows_for_page_v1(
  p_organization_id uuid,
  p_data_inicial date,
  p_data_final date,
  p_praca text DEFAULT NULL::text,
  p_sub_praca text DEFAULT NULL::text,
  p_origem text DEFAULT NULL::text
)
 RETURNS TABLE(id_entregador text, nome_entregador text, corridas_ofertadas numeric, corridas_aceitas numeric, corridas_rejeitadas numeric, corridas_completadas numeric, total_segundos numeric, aderencia_percentual numeric, rejeicao_percentual numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  WITH normalized_filters AS (
    SELECT
      CASE
        WHEN nullif(btrim(p_praca), '') IS NULL
          OR lower(btrim(p_praca)) IN ('todas', 'todos', 'all') THEN NULL::text[]
        ELSE (
          SELECT array_agg(btrim(selected.value))
          FROM unnest(string_to_array(p_praca, ',')) AS selected(value)
          WHERE btrim(selected.value) <> ''
        )
      END AS pracas,
      CASE
        WHEN nullif(btrim(p_sub_praca), '') IS NULL
          OR lower(btrim(p_sub_praca)) IN ('todas', 'todos', 'all') THEN NULL::text[]
        ELSE (
          SELECT array_agg(btrim(selected.value))
          FROM unnest(string_to_array(p_sub_praca, ',')) AS selected(value)
          WHERE btrim(selected.value) <> ''
        )
      END AS sub_pracas,
      CASE
        WHEN nullif(btrim(p_origem), '') IS NULL
          OR lower(btrim(p_origem)) IN ('todas', 'todos', 'all') THEN NULL::text[]
        ELSE (
          SELECT array_agg(btrim(selected.value))
          FROM unnest(string_to_array(p_origem, ',')) AS selected(value)
          WHERE btrim(selected.value) <> ''
        )
      END AS origens
  ),
  incremental_scopes AS MATERIALIZED (
    SELECT
      scope.organization_id,
      scope.data_do_periodo,
      scope.praca,
      scope.sub_praca,
      scope.origem
    FROM public.dashboard_entregadores_incremental_scopes scope
    CROSS JOIN normalized_filters filters
    WHERE scope.organization_id = p_organization_id
      AND scope.data_do_periodo >= p_data_inicial
      AND scope.data_do_periodo <= p_data_final
      AND (filters.pracas IS NULL OR scope.praca = ANY(filters.pracas))
      AND (filters.sub_pracas IS NULL OR scope.sub_praca = ANY(filters.sub_pracas))
      AND (filters.origens IS NULL OR scope.origem = ANY(filters.origens))
  ),
  filtered_data AS (
    SELECT
      mv.id_entregador,
      mv.nome_entregador,
      mv.corridas_ofertadas,
      mv.corridas_aceitas,
      mv.corridas_rejeitadas,
      mv.corridas_completadas,
      mv.total_segundos
    FROM public.mv_entregadores_agregado mv
    CROSS JOIN normalized_filters filters
    WHERE mv.organization_id = p_organization_id
      AND mv.data_do_periodo >= p_data_inicial
      AND mv.data_do_periodo <= p_data_final
      AND mv.id_entregador IS NOT NULL
      AND mv.id_entregador <> ''
      AND mv.nome_entregador IS NOT NULL
      AND (filters.pracas IS NULL OR mv.praca = ANY(filters.pracas))
      AND (filters.sub_pracas IS NULL OR mv.sub_praca = ANY(filters.sub_pracas))
      AND (filters.origens IS NULL OR mv.origem = ANY(filters.origens))
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
      inc.id_entregador,
      inc.nome_entregador,
      inc.corridas_ofertadas,
      inc.corridas_aceitas,
      inc.corridas_rejeitadas,
      inc.corridas_completadas,
      inc.total_segundos
    FROM public.tb_entregadores_agregado_incremental inc
    CROSS JOIN normalized_filters filters
    WHERE inc.organization_id = p_organization_id
      AND inc.data_do_periodo >= p_data_inicial
      AND inc.data_do_periodo <= p_data_final
      AND inc.id_entregador IS NOT NULL
      AND inc.id_entregador <> ''
      AND inc.nome_entregador IS NOT NULL
      AND (filters.pracas IS NULL OR inc.praca = ANY(filters.pracas))
      AND (filters.sub_pracas IS NULL OR inc.sub_praca = ANY(filters.sub_pracas))
      AND (filters.origens IS NULL OR inc.origem = ANY(filters.origens))
  ),
  aggregated_data AS (
    SELECT
      id_entregador,
      coalesce(
        max(nullif(btrim(nome_entregador), '')) FILTER (
          WHERE position(chr(195) IN nome_entregador) = 0
            AND position(chr(194) IN nome_entregador) = 0
        ),
        max(nullif(btrim(nome_entregador), '')),
        id_entregador
      ) AS nome_entregador,
      sum(corridas_ofertadas) AS corridas_ofertadas,
      sum(corridas_aceitas) AS corridas_aceitas,
      sum(corridas_rejeitadas) AS corridas_rejeitadas,
      sum(corridas_completadas) AS corridas_completadas,
      sum(total_segundos) AS total_segundos,
      CASE WHEN sum(corridas_ofertadas) > 0
        THEN round((sum(corridas_aceitas)::numeric / nullif(sum(corridas_ofertadas), 0)) * 100, 2)
        ELSE 0
      END AS aderencia_percentual,
      CASE WHEN sum(corridas_ofertadas) > 0
        THEN round((sum(corridas_rejeitadas)::numeric / nullif(sum(corridas_ofertadas), 0)) * 100, 2)
        ELSE 0
      END AS rejeicao_percentual
    FROM filtered_data
    GROUP BY id_entregador
  )
  SELECT
    aggregated_data.id_entregador,
    aggregated_data.nome_entregador,
    aggregated_data.corridas_ofertadas,
    aggregated_data.corridas_aceitas,
    aggregated_data.corridas_rejeitadas,
    aggregated_data.corridas_completadas,
    aggregated_data.total_segundos,
    aggregated_data.aderencia_percentual,
    aggregated_data.rejeicao_percentual
  FROM aggregated_data;
$function$;

CREATE OR REPLACE FUNCTION public.listar_entregadores_dashboard_fast_v1(
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
  p_semanas integer[] DEFAULT NULL::integer[]
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_organization_id uuid;
  v_data_inicial date := p_data_inicial;
  v_data_final date := p_data_final;
  v_pracas text[];
  v_sub_pracas text[];
  v_origens text[];
  v_search text := nullif(btrim(p_search), '');
  v_search_like_lower text;
  v_search_is_uuid boolean := false;
  v_selected_weeks integer[];
  v_requested_week_count integer := 0;
  v_valid_week_count integer := 0;
  v_week_filter boolean := false;
  v_has_invalid_week boolean := false;
  v_result jsonb;
  v_enable_mergejoin text;
begin
  begin
    v_organization_id := nullif(btrim(p_organization_id), '')::uuid;
  exception when others then
    v_organization_id := null;
  end;

  if v_data_inicial is null
     and v_data_final is null
     and p_ano between 2000 and 2100 then
    if coalesce(p_semana, 0) <> 0
       or (p_semanas is not null and cardinality(p_semanas) > 0) then
      v_has_invalid_week :=
        (p_semana is not null and p_semana <> 0 and p_semana not between 1 and 53)
        or (p_semanas is not null and exists (
          select 1
          from unnest(p_semanas) as selected(week_number)
          where selected.week_number is null
             or selected.week_number not between 1 and 53
        ));

      if not v_has_invalid_week then
        with requested_weeks as (
          select selected.week_number
          from unnest(coalesce(p_semanas, '{}'::integer[])) as selected(week_number)
          where selected.week_number between 1 and 53
          union
          select p_semana
          where p_semana between 1 and 53
        ),
        calculated_weeks as (
          select
            requested.week_number,
            date_trunc('week', make_date(p_ano, 1, 4)::timestamp)::date
              + ((requested.week_number - 1) * 7) as week_start
          from requested_weeks requested
        ),
        valid_weeks as (
          select calculated.week_number, calculated.week_start
          from calculated_weeks calculated
          where extract(isoyear from calculated.week_start)::integer = p_ano
            and extract(week from calculated.week_start)::integer = calculated.week_number
        )
        select
          (select count(*)::integer from requested_weeks),
          (select count(*)::integer from valid_weeks),
          (select array_agg(week_number order by week_number) from valid_weeks),
          (select min(week_start) from valid_weeks),
          (select max(week_start) + 6 from valid_weeks)
        into
          v_requested_week_count,
          v_valid_week_count,
          v_selected_weeks,
          v_data_inicial,
          v_data_final;

        v_has_invalid_week := v_requested_week_count <> v_valid_week_count;
        v_week_filter := not v_has_invalid_week
          and coalesce(cardinality(v_selected_weeks), 0) > 0;
      end if;
    else
      v_data_inicial := make_date(p_ano, 1, 1);
      v_data_final := make_date(p_ano, 12, 31);
    end if;
  end if;

  if v_search is not null then
    v_search_like_lower := '%' || lower(v_search) || '%';
    v_search_is_uuid := v_search ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  end if;

  if v_organization_id is null
     or v_data_inicial is null
     or v_data_final is null
     or v_data_final < v_data_inicial
     or v_data_final - v_data_inicial > 3660
     or v_has_invalid_week
     or (
       (coalesce(p_semana, 0) <> 0 or (p_semanas is not null and cardinality(p_semanas) > 0))
       and not v_week_filter
     )
     or coalesce(p_only_dedicados, false) then
    return public.listar_entregadores_v2(
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
      p_semanas := p_semanas
    );
  end if;

  if nullif(btrim(p_praca), '') is not null
     and lower(btrim(p_praca)) not in ('todas', 'todos', 'all') then
    select array_agg(btrim(value)) into v_pracas
    from unnest(string_to_array(p_praca, ',')) as selected(value)
    where btrim(selected.value) <> '';
  end if;

  if nullif(btrim(p_sub_praca), '') is not null
     and lower(btrim(p_sub_praca)) not in ('todas', 'todos', 'all') then
    select array_agg(btrim(value)) into v_sub_pracas
    from unnest(string_to_array(p_sub_praca, ',')) as selected(value)
    where btrim(selected.value) <> '';
  end if;

  if nullif(btrim(p_origem), '') is not null
     and lower(btrim(p_origem)) not in ('todas', 'todos', 'all') then
    if left(btrim(p_origem), length('__DASHBOARD_ORIGENS_JSON_V1__:')) = '__DASHBOARD_ORIGENS_JSON_V1__:' then
      begin
        select array_agg(btrim(selected.value)) into v_origens
        from jsonb_array_elements_text(
          substring(btrim(p_origem) from length('__DASHBOARD_ORIGENS_JSON_V1__:') + 1)::jsonb
        ) as selected(value)
        where btrim(selected.value) <> '';
      exception when others then
        raise exception using
          errcode = '22023',
          message = 'Filtro de origem em formato inválido.';
      end;
    else
      select array_agg(btrim(value)) into v_origens
      from unnest(string_to_array(p_origem, ',')) as selected(value)
      where btrim(selected.value) <> '';
    end if;
  end if;

  v_enable_mergejoin := pg_catalog.current_setting('enable_mergejoin');
  perform pg_catalog.set_config('enable_mergejoin', 'off', true);

  with incremental_scopes as materialized (
    select
      scope.organization_id,
      scope.data_do_periodo,
      scope.praca,
      scope.sub_praca,
      scope.origem,
      pg_catalog.hash_record_extended(
        row(scope.praca, scope.sub_praca, scope.origem),
        0
      ) as dimension_hash
    from public.dashboard_entregadores_incremental_scopes scope
    where scope.organization_id = v_organization_id
      and scope.data_do_periodo >= v_data_inicial
      and scope.data_do_periodo <= v_data_final
      and (
        not v_week_filter
        or (
          extract(isoyear from scope.data_do_periodo)::integer = p_ano
          and extract(week from scope.data_do_periodo)::integer = any(v_selected_weeks)
        )
      )
      and (v_pracas is null or scope.praca = any(v_pracas))
      and (v_sub_pracas is null or scope.sub_praca = any(v_sub_pracas))
      and (v_origens is null or scope.origem = any(v_origens))
  ),
  filtered_data as (
    select
      mv.id_entregador,
      mv.nome_entregador,
      mv.corridas_ofertadas,
      mv.corridas_aceitas,
      mv.corridas_rejeitadas,
      mv.corridas_completadas,
      mv.total_segundos
    from public.mv_entregadores_agregado mv
    where mv.organization_id = v_organization_id
      and mv.data_do_periodo >= v_data_inicial
      and mv.data_do_periodo <= v_data_final
      and (
        not v_week_filter
        or (
          extract(isoyear from mv.data_do_periodo)::integer = p_ano
          and extract(week from mv.data_do_periodo)::integer = any(v_selected_weeks)
        )
      )
      and mv.id_entregador is not null
      and mv.id_entregador <> ''
      and mv.nome_entregador is not null
      and (v_pracas is null or mv.praca = any(v_pracas))
      and (v_sub_pracas is null or mv.sub_praca = any(v_sub_pracas))
      and (v_origens is null or mv.origem = any(v_origens))
      and (
        v_search is null
        or (v_search_is_uuid and mv.id_entregador = v_search)
        or (
          not v_search_is_uuid
          and length(v_search) >= 3
          and lower(mv.nome_entregador) ilike v_search_like_lower
        )
      )
      and not exists (
        select 1
        from incremental_scopes scope
        where scope.organization_id = mv.organization_id
          and scope.data_do_periodo = mv.data_do_periodo
          and scope.dimension_hash = pg_catalog.hash_record_extended(
            row(mv.praca, mv.sub_praca, mv.origem),
            0
          )
          and scope.praca is not distinct from mv.praca
          and scope.sub_praca is not distinct from mv.sub_praca
          and scope.origem is not distinct from mv.origem
      )
    union all
    select
      inc.id_entregador,
      inc.nome_entregador,
      inc.corridas_ofertadas,
      inc.corridas_aceitas,
      inc.corridas_rejeitadas,
      inc.corridas_completadas,
      inc.total_segundos
    from public.tb_entregadores_agregado_incremental inc
    where inc.organization_id = v_organization_id
      and inc.data_do_periodo >= v_data_inicial
      and inc.data_do_periodo <= v_data_final
      and (
        not v_week_filter
        or (
          extract(isoyear from inc.data_do_periodo)::integer = p_ano
          and extract(week from inc.data_do_periodo)::integer = any(v_selected_weeks)
        )
      )
      and inc.id_entregador is not null
      and inc.id_entregador <> ''
      and inc.nome_entregador is not null
      and (v_pracas is null or inc.praca = any(v_pracas))
      and (v_sub_pracas is null or inc.sub_praca = any(v_sub_pracas))
      and (v_origens is null or inc.origem = any(v_origens))
      and (
        v_search is null
        or (v_search_is_uuid and inc.id_entregador = v_search)
        or (
          not v_search_is_uuid
          and length(v_search) >= 3
          and lower(inc.nome_entregador) ilike v_search_like_lower
        )
      )
  ),
  aggregated_data as (
    select
      id_entregador,
      coalesce(
        max(nullif(btrim(nome_entregador), '')) filter (
          where position(chr(195) in nome_entregador) = 0
            and position(chr(194) in nome_entregador) = 0
        ),
        max(nullif(btrim(nome_entregador), '')),
        id_entregador
      ) as nome_entregador,
      sum(corridas_ofertadas) as corridas_ofertadas,
      sum(corridas_aceitas) as corridas_aceitas,
      sum(corridas_rejeitadas) as corridas_rejeitadas,
      sum(corridas_completadas) as corridas_completadas,
      sum(total_segundos) as total_segundos,
      case when sum(corridas_ofertadas) > 0
        then round((sum(corridas_aceitas)::numeric / nullif(sum(corridas_ofertadas), 0)) * 100, 2)
        else 0
      end as aderencia_percentual,
      case when sum(corridas_ofertadas) > 0
        then round((sum(corridas_rejeitadas)::numeric / nullif(sum(corridas_ofertadas), 0)) * 100, 2)
        else 0
      end as rejeicao_percentual
    from filtered_data
    group by id_entregador
  )
  select jsonb_build_object(
    'entregadores', coalesce(
      jsonb_agg(to_jsonb(aggregated_data) order by corridas_completadas desc),
      '[]'::jsonb
    ),
    'total', count(*),
    'periodo_resolvido', jsonb_build_object(
      'ano', p_ano,
      'semana', case when v_week_filter and coalesce(p_semana, 0) > 0 then p_semana else null end,
      'semanas', case when v_week_filter then coalesce(to_jsonb(p_semanas), '[]'::jsonb) else '[]'::jsonb end,
      'auto_semana', false,
      'search', v_search
    )
  )
  into v_result
  from aggregated_data;

  perform pg_catalog.set_config('enable_mergejoin', v_enable_mergejoin, true);

  return coalesce(v_result, jsonb_build_object(
    'entregadores', '[]'::jsonb,
    'total', 0,
    'periodo_resolvido', jsonb_build_object(
      'ano', p_ano,
      'semana', case when v_week_filter and coalesce(p_semana, 0) > 0 then p_semana else null end,
      'semanas', case when v_week_filter then coalesce(to_jsonb(p_semanas), '[]'::jsonb) else '[]'::jsonb end,
      'auto_semana', false,
      'search', v_search
    )
  ));
end;
$function$;
