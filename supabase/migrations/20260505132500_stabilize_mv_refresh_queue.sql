create or replace function public.get_mv_refresh_queue_state()
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  full_pending_count integer;
  full_in_progress_count integer;
  incremental_pending_count integer;
  full_worker_job_id bigint;
  incremental_worker_job_id bigint;
begin
  select
    count(*) filter (where needs_refresh = true),
    count(*) filter (where refresh_in_progress = true)
  into full_pending_count, full_in_progress_count
  from public.mv_refresh_control;

  select count(*)
  into incremental_pending_count
  from public.mv_refresh_impacts
  where dashboard_resumo_processed_at is null
     or entregadores_agregado_processed_at is null
     or corridas_agregadas_processed_at is null;

  select jobid
  into full_worker_job_id
  from cron.job
  where jobname = 'refresh-pending-mvs-on-demand'
  limit 1;

  select jobid
  into incremental_worker_job_id
  from cron.job
  where jobname = 'incremental-refresh-impacts-on-demand'
  limit 1;

  return json_build_object(
    'success', true,
    'full_pending_count', full_pending_count,
    'full_in_progress_count', full_in_progress_count,
    'incremental_pending_count', incremental_pending_count,
    'full_worker_scheduled', full_worker_job_id is not null,
    'full_worker_job_id', full_worker_job_id,
    'incremental_worker_scheduled', incremental_worker_job_id is not null,
    'incremental_worker_job_id', incremental_worker_job_id
  );
end;
$$;

create or replace function public.clear_stale_full_mv_refresh_flags(
  p_min_age interval default interval '2 minutes'
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  full_worker_exists boolean;
  active_worker_exists boolean;
  active_refresh_exists boolean;
  cleared_count integer := 0;
begin
  select exists (
    select 1
    from cron.job
    where jobname = 'refresh-pending-mvs-on-demand'
  )
  into full_worker_exists;

  select exists (
    select 1
    from pg_stat_activity
    where pid <> pg_backend_pid()
      and query ilike '%process_mv_refresh_queue_job%'
      and state <> 'idle'
  )
  into active_worker_exists;

  select exists (
    select 1
    from public.mv_refresh_control
    where refresh_in_progress = true
  )
  into active_refresh_exists;

  if full_worker_exists or active_worker_exists or active_refresh_exists then
    return json_build_object(
      'success', true,
      'cleared', 0,
      'skipped', true,
      'reason', 'full refresh worker or refresh is active'
    );
  end if;

  update public.mv_refresh_control
  set needs_refresh = false,
      refresh_in_progress = false,
      updated_at = now()
  where needs_refresh = true
    and coalesce(refresh_in_progress, false) = false
    and updated_at < now() - p_min_age;

  get diagnostics cleared_count = row_count;

  return json_build_object(
    'success', true,
    'cleared', cleared_count,
    'skipped', false,
    'min_age', p_min_age
  );
end;
$$;

create or replace function public.ensure_mv_refresh_worker_scheduled()
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  pending_count integer;
  in_progress_count integer;
  worker_job_id bigint;
begin
  update public.mv_refresh_control
  set refresh_in_progress = false,
      updated_at = now()
  where refresh_in_progress = true
    and needs_refresh = false;

  select
    count(*) filter (where needs_refresh = true),
    count(*) filter (where refresh_in_progress = true)
  into pending_count, in_progress_count
  from public.mv_refresh_control;

  if pending_count = 0 then
    return json_build_object(
      'success', true,
      'scheduled', false,
      'reason', 'no pending materialized views',
      'pending_count', pending_count,
      'in_progress_count', in_progress_count
    );
  end if;

  select jobid
  into worker_job_id
  from cron.job
  where jobname = 'refresh-pending-mvs-on-demand'
  limit 1;

  if worker_job_id is not null then
    return json_build_object(
      'success', true,
      'scheduled', false,
      'reason', 'worker already scheduled',
      'jobid', worker_job_id,
      'pending_count', pending_count,
      'in_progress_count', in_progress_count
    );
  end if;

  select cron.schedule(
    'refresh-pending-mvs-on-demand',
    '* * * * *',
    'set statement_timeout = 0; select public.process_mv_refresh_queue_job();'
  )
  into worker_job_id;

  return json_build_object(
    'success', true,
    'scheduled', true,
    'reason', 'worker scheduled on demand',
    'jobid', worker_job_id,
    'pending_count', pending_count,
    'in_progress_count', in_progress_count
  );
end;
$$;

revoke all on function public.get_mv_refresh_queue_state() from public, anon, authenticated;
revoke all on function public.clear_stale_full_mv_refresh_flags(interval) from public, anon, authenticated;
grant execute on function public.get_mv_refresh_queue_state() to service_role;
grant execute on function public.clear_stale_full_mv_refresh_flags(interval) to service_role;
