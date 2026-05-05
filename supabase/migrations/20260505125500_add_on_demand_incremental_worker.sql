create or replace function public.process_incremental_refresh_impacts_job()
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  job_name constant text := 'incremental-refresh-impacts-on-demand';
  result json;
  pending_count integer;
  unscheduled_count integer := 0;
begin
  result := public.process_incremental_refresh_impacts(10, true);

  select count(*)
  into pending_count
  from public.mv_refresh_impacts
  where dashboard_resumo_processed_at is null
     or entregadores_agregado_processed_at is null
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
$$;

create or replace function public.ensure_incremental_refresh_worker_scheduled()
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  job_name constant text := 'incremental-refresh-impacts-on-demand';
  pending_count integer;
  existing_job_id bigint;
  new_job_id bigint;
begin
  select count(*)
  into pending_count
  from public.mv_refresh_impacts
  where dashboard_resumo_processed_at is null
     or entregadores_agregado_processed_at is null
     or corridas_agregadas_processed_at is null;

  if pending_count = 0 then
    return json_build_object(
      'success', true,
      'scheduled', false,
      'reason', 'no_pending_impacts',
      'pending_count', pending_count
    );
  end if;

  select jobid
  into existing_job_id
  from cron.job
  where jobname = job_name
  limit 1;

  if existing_job_id is not null then
    return json_build_object(
      'success', true,
      'scheduled', true,
      'already_scheduled', true,
      'jobid', existing_job_id,
      'pending_count', pending_count
    );
  end if;

  new_job_id := cron.schedule(
    job_name,
    '* * * * *',
    'set statement_timeout = ''5min''; select public.process_incremental_refresh_impacts_job();'
  );

  return json_build_object(
    'success', true,
    'scheduled', true,
    'already_scheduled', false,
    'jobid', new_job_id,
    'pending_count', pending_count
  );
end;
$$;

revoke all on function public.process_incremental_refresh_impacts_job() from public, anon, authenticated;
revoke all on function public.ensure_incremental_refresh_worker_scheduled() from public, anon, authenticated;
grant execute on function public.process_incremental_refresh_impacts_job() to service_role;
grant execute on function public.ensure_incremental_refresh_worker_scheduled() to service_role;
