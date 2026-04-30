create or replace function public.enqueue_mv_refresh(include_secondary boolean default true, reason text default 'manual')
returns json
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  marked_count integer := 0;
  pending_count_before integer;
  pending_count integer;
  worker_result json;
  reason_normalized text := lower(coalesce(reason, 'manual'));
  should_mark boolean;
begin
  select count(*)
  into pending_count_before
  from public.mv_refresh_control
  where needs_refresh = true;

  should_mark := pending_count_before = 0
    or reason_normalized in ('upload', 'bulk_insert', 'scheduled', 'prioritized_rpc')
    or reason_normalized like 'upload:%'
    or reason_normalized like 'bulk_insert:%';

  if should_mark then
    with target as (
      select id
      from public.mv_refresh_control
      where coalesce(needs_refresh, false) = false
        and (
          $1 = true
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
          ])
        )
      for update skip locked
    ), marked as (
      update public.mv_refresh_control mrc
      set needs_refresh = true,
          updated_at = now()
      from target
      where mrc.id = target.id
      returning 1
    )
    select count(*) into marked_count from marked;
  end if;

  select count(*)
  into pending_count
  from public.mv_refresh_control
  where needs_refresh = true;

  worker_result := public.ensure_mv_refresh_worker_scheduled();

  return json_build_object(
    'success', true,
    'marked', marked_count,
    'pending_count_before', pending_count_before,
    'pending_count', pending_count,
    'include_secondary', include_secondary,
    'reason', reason,
    'skipped_marking_existing_queue', not should_mark,
    'worker_result', worker_result
  );
end;
$function$;

grant execute on function public.enqueue_mv_refresh(boolean, text) to service_role;
revoke execute on function public.enqueue_mv_refresh(boolean, text) from anon;
revoke execute on function public.enqueue_mv_refresh(boolean, text) from authenticated;
revoke execute on function public.enqueue_mv_refresh(boolean, text) from public;

notify pgrst, 'reload schema';
