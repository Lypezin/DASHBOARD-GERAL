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
    'set statement_timeout = 0; select public.refresh_next_pending_mv(80);'
  );
end;
$do$;
