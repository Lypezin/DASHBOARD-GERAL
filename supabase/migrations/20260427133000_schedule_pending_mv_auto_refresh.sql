create or replace function public.refresh_next_pending_mv(max_priority integer default 80)
returns json
language plpgsql
security definer
set search_path to 'public'
set statement_timeout to '0'
as $function$
declare
  mv_record record;
  active_refresh_count integer;
  refresh_result json;
begin
  select count(*)
  into active_refresh_count
  from public.mv_refresh_control
  where needs_refresh = true
    and coalesce(refresh_in_progress, false) = true;

  if active_refresh_count > 0 then
    return json_build_object(
      'success', true,
      'skipped', true,
      'reason', 'another refresh is already running',
      'active_refresh_count', active_refresh_count
    );
  end if;

  select pending.mv_name, pending.priority
  into mv_record
  from public.get_pending_mvs() pending
  join public.mv_refresh_control mrc on mrc.mv_name = pending.mv_name
  where pending.priority <= max_priority
    and coalesce(mrc.refresh_in_progress, false) = false
  order by pending.priority, pending.mv_name
  limit 1;

  if mv_record.mv_name is null then
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

grant execute on function public.refresh_next_pending_mv(integer) to authenticated;

do $do$
declare
  existing_job_id bigint;
begin
  select jobid
  into existing_job_id
  from cron.job
  where jobname = 'refresh-pending-mvs-after-upload'
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'refresh-pending-mvs-after-upload',
    '*/2 * * * *',
    'select public.refresh_next_pending_mv(80);'
  );
end;
$do$;

notify pgrst, 'reload schema';
