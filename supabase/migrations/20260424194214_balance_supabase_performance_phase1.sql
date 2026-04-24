-- Balanced performance phase 1:
-- - Reduce repeated dimension RPCs with one org-aware function.
-- - Keep upload refresh focused on active product paths.
-- - Add advisory-lock dedupe to MV refreshes to avoid duplicate WAL-heavy work.

create index if not exists idx_mv_dashboard_resumo_org_praca_date_v4
on public.mv_dashboard_resumo (organization_id, praca, data_do_periodo desc);

create or replace function public.get_dashboard_dimension_options(
  p_pracas text[] default null,
  p_organization_id text default null
)
returns table (
  sub_pracas text[],
  origens text[],
  turnos text[]
)
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid;
  v_org_filter uuid;
  v_pracas text[];
begin
  v_user_id := auth.uid();

  if p_organization_id is not null and btrim(p_organization_id) <> '' then
    begin
      v_org_filter := p_organization_id::uuid;
    exception when others then
      select up.organization_id
      into v_org_filter
      from public.user_profiles up
      where up.id = v_user_id;
    end;
  else
    select up.organization_id
    into v_org_filter
    from public.user_profiles up
    where up.id = v_user_id;
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
  select
    coalesce(array_agg(distinct mv.sub_praca) filter (where mv.sub_praca is not null and mv.sub_praca <> ''), '{}'::text[]) as sub_pracas,
    coalesce(array_agg(distinct mv.origem) filter (where mv.origem is not null and mv.origem <> ''), '{}'::text[]) as origens,
    coalesce(array_agg(distinct mv.turno) filter (where mv.turno is not null and mv.turno <> ''), '{}'::text[]) as turnos
  from public.mv_dashboard_resumo mv
  where (v_org_filter is null or mv.organization_id = v_org_filter)
    and (v_pracas is null or mv.praca = any(v_pracas));
end;
$function$;

grant execute on function public.get_dashboard_dimension_options(text[], text) to authenticated;

create or replace function public.refresh_mvs_after_bulk_insert(delay_seconds integer default 300)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  mv_count integer;
begin
  update public.mv_refresh_control
  set
    needs_refresh = true,
    updated_at = now()
  where mv_name = any(array[
    'mv_corridas_agregadas',
    'mv_entregadores_ativacao',
    'mv_dashboard_resumo',
    'mv_dashboard_aderencia_metricas',
    'mv_aderencia_agregada',
    'mv_utr_stats',
    'mv_entregadores_agregado',
    'mv_comparison_weekly',
    'mv_entregadores_summary'
  ]);

  select count(*)
  into mv_count
  from public.mv_refresh_control
  where needs_refresh = true
    and mv_name = any(array[
      'mv_corridas_agregadas',
      'mv_entregadores_ativacao',
      'mv_dashboard_resumo',
      'mv_dashboard_aderencia_metricas',
      'mv_aderencia_agregada',
      'mv_utr_stats',
      'mv_entregadores_agregado',
      'mv_comparison_weekly',
      'mv_entregadores_summary'
    ]);

  return format(
    'Marcadas %s MVs ativas para refresh. O refresh sera processado automaticamente em ate %s minutos.',
    mv_count,
    case
      when delay_seconds < 60 then '1'
      else (delay_seconds / 60)::text
    end
  );
end;
$function$;

create or replace function public.get_pending_mvs()
returns table(mv_name text, priority integer, needs_refresh boolean, last_refresh timestamp with time zone)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  return query
  select
    mrc.mv_name,
    case mrc.mv_name
      when 'mv_corridas_agregadas' then 0
      when 'mv_entregadores_ativacao' then 1
      when 'mv_dashboard_resumo' then 1
      when 'mv_dashboard_aderencia_metricas' then 1
      when 'mv_aderencia_agregada' then 1
      when 'mv_utr_stats' then 1
      when 'mv_entregadores_agregado' then 1
      when 'mv_comparison_weekly' then 1
      when 'mv_entregadores_summary' then 1
      when 'mv_entregadores_marketing' then 3
      when 'mv_aderencia_dia' then 4
      when 'mv_aderencia_semana' then 4
      when 'mv_dashboard_admin' then 4
      when 'mv_dashboard_lite' then 4
      when 'mv_dashboard_micro' then 4
      else 5
    end as priority,
    mrc.needs_refresh,
    mrc.last_refresh
  from public.mv_refresh_control mrc
  where mrc.needs_refresh = true
    and mrc.refresh_in_progress = false
  order by priority asc, mrc.mv_name asc;
end;
$function$;

create or replace function public.refresh_mvs_prioritized(refresh_critical_only boolean default false)
returns json
language plpgsql
security definer
set search_path to 'public'
set statement_timeout to '0'
as $function$
declare
  results json[] := '{}';
  total_start timestamp;
  mv_record record;
  single_mv_result json;
begin
  total_start := clock_timestamp();

  for mv_record in
    select mv_name, priority
    from (
      values
        ('mv_corridas_agregadas', 0),
        ('mv_entregadores_ativacao', 1),
        ('mv_dashboard_resumo', 1),
        ('mv_dashboard_aderencia_metricas', 1),
        ('mv_aderencia_agregada', 1),
        ('mv_utr_stats', 1),
        ('mv_entregadores_agregado', 1),
        ('mv_comparison_weekly', 1),
        ('mv_entregadores_summary', 1),
        ('mv_entregadores_marketing', 3),
        ('mv_aderencia_dia', 4),
        ('mv_aderencia_semana', 4),
        ('mv_dashboard_admin', 4),
        ('mv_dashboard_lite', 4),
        ('mv_dashboard_micro', 4)
    ) as mvs(mv_name, priority)
    where (refresh_critical_only = false or priority <= 1)
    order by priority, mv_name
  loop
    begin
      single_mv_result := public.refresh_single_mv(mv_record.mv_name, false);

      results := array_append(results, json_build_object(
        'view', mv_record.mv_name,
        'success', coalesce((single_mv_result->>'success')::boolean, false),
        'skipped', coalesce((single_mv_result->>'skipped')::boolean, false),
        'duration_seconds', nullif(single_mv_result->>'duration_seconds', '')::numeric,
        'method', coalesce(single_mv_result->>'method', 'NORMAL'),
        'priority', mv_record.priority,
        'error', single_mv_result->>'error'
      ));
    exception when others then
      results := array_append(results, json_build_object(
        'view', mv_record.mv_name,
        'success', false,
        'error', sqlerrm,
        'priority', mv_record.priority
      ));
    end;
  end loop;

  return json_build_object(
    'success', true,
    'total_duration_seconds', extract(epoch from (clock_timestamp() - total_start)),
    'views_refreshed', coalesce(array_length(results, 1), 0),
    'critical_only', refresh_critical_only,
    'results', results
  );
end;
$function$;

create or replace function public.refresh_single_mv(mv_name_param text, force_normal boolean default false)
returns json
language plpgsql
security definer
set search_path to 'public'
set statement_timeout to '0'
as $function$
declare
  refresh_sql text;
  can_use_concurrently boolean;
  mv_size_bytes bigint;
  estimated_timeout_seconds integer;
  start_time timestamp;
  duration_seconds numeric;
  is_already_in_progress boolean;
begin
  if not exists (
    select 1
    from pg_matviews
    where schemaname = 'public'
      and matviewname = mv_name_param
  ) then
    return json_build_object(
      'success', false,
      'error', format('Materialized view %s nao existe', mv_name_param),
      'skipped', true
    );
  end if;

  if not pg_try_advisory_xact_lock(hashtextextended('refresh_mv:' || mv_name_param, 0)) then
    return json_build_object(
      'success', true,
      'view', mv_name_param,
      'skipped', true,
      'method', 'SKIPPED',
      'reason', 'refresh ja em execucao'
    );
  end if;

  update public.mv_refresh_control
  set refresh_in_progress = false,
      updated_at = now()
  where mv_name = mv_name_param
    and refresh_in_progress = true
    and updated_at < now() - interval '2 hours';

  select coalesce(mrc.refresh_in_progress, false)
  into is_already_in_progress
  from public.mv_refresh_control mrc
  where mrc.mv_name = mv_name_param;

  if coalesce(is_already_in_progress, false) then
    return json_build_object(
      'success', true,
      'view', mv_name_param,
      'skipped', true,
      'method', 'SKIPPED',
      'reason', 'refresh_in_progress ativo'
    );
  end if;

  select exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = mv_name_param
      and indexdef like '%UNIQUE%'
  )
  into can_use_concurrently;

  if force_normal then
    can_use_concurrently := false;
  end if;

  select pg_total_relation_size(format('public.%I', mv_name_param)::regclass)
  into mv_size_bytes;

  estimated_timeout_seconds := case
    when mv_size_bytes < 1048576 then 30
    when mv_size_bytes < 10485760 then 120
    when mv_size_bytes < 52428800 then 300
    else 600
  end;

  update public.mv_refresh_control
  set refresh_in_progress = true,
      updated_at = now()
  where mv_name = mv_name_param;

  start_time := clock_timestamp();

  begin
    if can_use_concurrently then
      refresh_sql := format('refresh materialized view concurrently public.%I', mv_name_param);
    else
      refresh_sql := format('refresh materialized view public.%I', mv_name_param);
    end if;

    execute refresh_sql;

    duration_seconds := extract(epoch from (clock_timestamp() - start_time));

    update public.mv_refresh_control
    set
      needs_refresh = false,
      refresh_in_progress = false,
      last_refresh = now(),
      updated_at = now()
    where mv_name = mv_name_param;

    return json_build_object(
      'success', true,
      'view', mv_name_param,
      'duration_seconds', duration_seconds,
      'estimated_timeout_seconds', estimated_timeout_seconds,
      'method', case when can_use_concurrently then 'CONCURRENTLY' else 'NORMAL' end
    );
  exception when others then
    update public.mv_refresh_control
    set refresh_in_progress = false,
        updated_at = now()
    where mv_name = mv_name_param;

    if can_use_concurrently and not force_normal then
      begin
        refresh_sql := format('refresh materialized view public.%I', mv_name_param);
        execute refresh_sql;

        update public.mv_refresh_control
        set
          needs_refresh = false,
          refresh_in_progress = false,
          last_refresh = now(),
          updated_at = now()
        where mv_name = mv_name_param;

        return json_build_object(
          'success', true,
          'view', mv_name_param,
          'duration_seconds', extract(epoch from (clock_timestamp() - start_time)),
          'method', 'NORMAL (fallback)',
          'warning', 'CONCURRENTLY falhou, usado metodo normal',
          'original_error', sqlerrm
        );
      exception when others then
        return json_build_object(
          'success', false,
          'view', mv_name_param,
          'error', sqlerrm,
          'duration_seconds', duration_seconds,
          'method', 'FAILED'
        );
      end;
    else
      return json_build_object(
        'success', false,
        'view', mv_name_param,
        'error', sqlerrm,
        'duration_seconds', duration_seconds,
        'method', case when can_use_concurrently then 'CONCURRENTLY' else 'NORMAL' end
      );
    end if;
  end;
end;
$function$;
