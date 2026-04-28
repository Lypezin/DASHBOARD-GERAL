create or replace function public.refresh_next_pending_mv(max_priority integer default 200)
returns json
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
set statement_timeout to '0'
as $function$
declare
  mv_record record;
  active_refresh_count integer;
  active_upload_count integer;
  active_user_facing_query_count integer;
  refresh_result json;
begin
  if not pg_try_advisory_xact_lock(hashtextextended('refresh_mv:global', 0)) then
    return json_build_object(
      'success', true,
      'skipped', true,
      'reason', 'another refresh is already running'
    );
  end if;

  select count(*)
  into active_refresh_count
  from public.mv_refresh_control
  where needs_refresh = true
    and coalesce(refresh_in_progress, false) = true;

  if active_refresh_count > 0 then
    return json_build_object(
      'success', true,
      'skipped', true,
      'reason', 'another refresh is already marked as running',
      'active_refresh_count', active_refresh_count
    );
  end if;

  select count(*)
  into active_upload_count
  from pg_stat_activity
  where datname = current_database()
    and pid <> pg_backend_pid()
    and state <> 'idle'
    and query like '%insert_dados_corridas_batch%';

  if active_upload_count > 0 then
    return json_build_object(
      'success', true,
      'skipped', true,
      'reason', 'upload batch is currently running',
      'active_upload_count', active_upload_count
    );
  end if;

  select count(*)
  into active_user_facing_query_count
  from pg_stat_activity
  where datname = current_database()
    and pid <> pg_backend_pid()
    and usename = 'authenticator'
    and state <> 'idle'
    and (
      query ilike '%listar_entregadores_v2%'
      or query ilike '%listar_valores_entregadores%'
      or query ilike '%listar_valores_entregadores_detalhado%'
      or query ilike '%obter_resumo_valores_breakdown%'
    );

  select pending.mv_name, pending.priority
  into mv_record
  from public.get_pending_mvs() pending
  join public.mv_refresh_control mrc on mrc.mv_name = pending.mv_name
  where pending.priority <= max_priority
    and coalesce(mrc.refresh_in_progress, false) = false
    and not (
      active_user_facing_query_count > 0
      and pending.mv_name = any(array[
        'mv_dashboard_resumo',
        'mv_entregadores_agregado',
        'mv_entregadores_ativacao',
        'mv_entregadores_marketing',
        'mv_entregadores_summary'
      ])
    )
  order by pending.priority, pending.mv_name
  limit 1;

  if mv_record.mv_name is null then
    if active_user_facing_query_count > 0 then
      return json_build_object(
        'success', true,
        'skipped', true,
        'reason', 'user-facing entregadores/valores queries are active',
        'active_user_facing_query_count', active_user_facing_query_count
      );
    end if;

    return json_build_object(
      'success', true,
      'skipped', true,
      'reason', 'no pending materialized views',
      'max_priority', max_priority
    );
  end if;

  refresh_result := public.refresh_single_mv(mv_record.mv_name, false);

  return json_build_object(
    'success', coalesce((refresh_result->>'success')::boolean, false),
    'mv_name', mv_record.mv_name,
    'priority', mv_record.priority,
    'result', refresh_result
  );
end;
$function$;
