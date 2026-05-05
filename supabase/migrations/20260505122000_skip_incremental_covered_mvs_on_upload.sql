-- Upload refreshes can skip the heavy MVs already covered by incremental overlays.
-- Manual/admin refreshes still enqueue everything.

create or replace function public.enqueue_mv_refresh(include_secondary boolean default true, reason text default 'manual')
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  marked_count integer := 0;
  skipped_covered_count integer := 0;
  pending_count_before integer;
  pending_count integer;
  worker_result json;
  reason_normalized text := lower(coalesce(reason, 'manual'));
  should_mark boolean;
  is_upload_reason boolean;
  incremental_covered_mvs text[] := array[
    'mv_corridas_agregadas',
    'mv_dashboard_resumo',
    'mv_entregadores_agregado'
  ];
begin
  is_upload_reason := reason_normalized in ('upload', 'bulk_insert')
    or reason_normalized like 'upload:%'
    or reason_normalized like 'bulk_insert:%';

  if is_upload_reason then
    update public.mv_refresh_control
    set needs_refresh = false,
        refresh_in_progress = false,
        updated_at = now()
    where mv_name = any(incremental_covered_mvs)
      and coalesce(refresh_in_progress, false) = false
      and coalesce(needs_refresh, false) = true;

    get diagnostics skipped_covered_count = row_count;
  end if;

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
        and not (is_upload_reason and mv_name = any(incremental_covered_mvs))
        and (
          include_secondary = true
          or mv_name = any(array[
            'mv_utr_stats',
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
    'skipped_incremental_covered', skipped_covered_count,
    'incremental_covered_mvs', incremental_covered_mvs,
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

update public.mv_refresh_control
set needs_refresh = false,
    refresh_in_progress = false,
    updated_at = now()
where mv_name in ('mv_corridas_agregadas', 'mv_dashboard_resumo', 'mv_entregadores_agregado')
  and coalesce(refresh_in_progress, false) = false
  and coalesce(needs_refresh, false) = true;
