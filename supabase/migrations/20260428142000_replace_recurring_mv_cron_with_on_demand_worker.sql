create or replace function public.process_mv_refresh_queue_job()
returns json
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
set statement_timeout to '0'
as $function$
declare
  refresh_result json;
  remaining_count integer;
  worker_job_id bigint;
begin
  refresh_result := public.refresh_next_pending_mv(200);

  select count(*)
  into remaining_count
  from public.mv_refresh_control
  where needs_refresh = true;

  if remaining_count = 0
     or coalesce(refresh_result->>'reason', '') = 'no pending materialized views' then
    select jobid
    into worker_job_id
    from cron.job
    where jobname = 'refresh-pending-mvs-on-demand'
    limit 1;

    if worker_job_id is not null then
      perform cron.unschedule(worker_job_id);
    end if;
  end if;

  return json_build_object(
    'success', true,
    'refresh_result', refresh_result,
    'remaining_pending', remaining_count
  );
end;
$function$;

create or replace function public.ensure_mv_refresh_worker_scheduled()
returns json
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  pending_count integer;
  worker_job_id bigint;
begin
  select count(*)
  into pending_count
  from public.mv_refresh_control
  where needs_refresh = true;

  if pending_count = 0 then
    return json_build_object(
      'success', true,
      'scheduled', false,
      'reason', 'no pending materialized views'
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
      'pending_count', pending_count
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
    'pending_count', pending_count
  );
end;
$function$;

create or replace function public.enqueue_mv_refresh(include_secondary boolean default true, reason text default 'manual')
returns json
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  marked_count integer;
  worker_result json;
begin
  update public.mv_refresh_control
  set needs_refresh = true,
      updated_at = now()
  where include_secondary = true
     or mv_name = any(array[
       'mv_corridas_agregadas',
       'mv_dashboard_resumo',
       'mv_utr_stats',
       'mv_entregadores_agregado',
       'mv_dashboard_aderencia_metricas',
       'mv_aderencia_agregada',
       'mv_comparison_weekly',
       'mv_entregadores_ativacao',
       'mv_entregadores_summary'
     ]);

  get diagnostics marked_count = row_count;
  worker_result := public.ensure_mv_refresh_worker_scheduled();

  return json_build_object(
    'success', true,
    'marked', marked_count,
    'include_secondary', include_secondary,
    'reason', reason,
    'worker_result', worker_result
  );
end;
$function$;

do $do$
declare
  recurring_job_id bigint;
begin
  select jobid
  into recurring_job_id
  from cron.job
  where jobname = 'refresh-pending-mvs-after-upload'
  limit 1;

  if recurring_job_id is not null then
    perform cron.unschedule(recurring_job_id);
  end if;
end;
$do$;

revoke execute on function public.process_mv_refresh_queue_job() from authenticated;
revoke execute on function public.process_mv_refresh_queue_job() from anon;
revoke execute on function public.process_mv_refresh_queue_job() from public;

revoke execute on function public.ensure_mv_refresh_worker_scheduled() from authenticated;
revoke execute on function public.ensure_mv_refresh_worker_scheduled() from anon;
revoke execute on function public.ensure_mv_refresh_worker_scheduled() from public;

grant execute on function public.process_mv_refresh_queue_job() to service_role;
grant execute on function public.ensure_mv_refresh_worker_scheduled() to service_role;

notify pgrst, 'reload schema';
