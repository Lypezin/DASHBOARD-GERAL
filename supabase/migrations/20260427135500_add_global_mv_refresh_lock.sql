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

  if not pg_try_advisory_xact_lock(hashtextextended('refresh_mv:global', 0)) then
    return json_build_object(
      'success', true,
      'view', mv_name_param,
      'skipped', true,
      'method', 'SKIPPED',
      'reason', 'outro refresh de MV ja esta em execucao'
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

notify pgrst, 'reload schema';
