-- Internal orchestrator for shadow incremental refresh validation.

create or replace function public.process_incremental_refresh_impacts(
  p_limit integer default 500,
  p_include_corridas boolean default true
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 500), 5000));
  v_dashboard_result json;
  v_entregadores_result json;
  v_corridas_result json := null;
  v_pending_dashboard integer := 0;
  v_pending_entregadores integer := 0;
  v_pending_corridas integer := 0;
  v_started_at timestamptz := clock_timestamp();
begin
  if not pg_try_advisory_xact_lock(hashtextextended('refresh_incremental:processor', 0)) then
    return json_build_object(
      'success', true,
      'skipped', true,
      'reason', 'incremental processor already running'
    );
  end if;

  v_dashboard_result := public.refresh_dashboard_resumo_incremental(v_limit);
  v_entregadores_result := public.refresh_entregadores_agregado_incremental(v_limit);

  if p_include_corridas then
    v_corridas_result := public.refresh_corridas_agregadas_incremental(v_limit);
  end if;

  select
    count(*) filter (where dashboard_resumo_processed_at is null),
    count(*) filter (where entregadores_agregado_processed_at is null),
    count(*) filter (where corridas_agregadas_processed_at is null)
  into
    v_pending_dashboard,
    v_pending_entregadores,
    v_pending_corridas
  from public.mv_refresh_impacts
  where source = 'corridas';

  return json_build_object(
    'success', coalesce((v_dashboard_result->>'success')::boolean, false)
      and coalesce((v_entregadores_result->>'success')::boolean, false)
      and (not p_include_corridas or coalesce((v_corridas_result->>'success')::boolean, false)),
    'dashboard_result', v_dashboard_result,
    'entregadores_result', v_entregadores_result,
    'corridas_result', v_corridas_result,
    'pending', json_build_object(
      'dashboard_resumo', v_pending_dashboard,
      'entregadores_agregado', v_pending_entregadores,
      'corridas_agregadas', v_pending_corridas
    ),
    'duration_ms', round(extract(epoch from clock_timestamp() - v_started_at) * 1000)
  );
end;
$function$;

revoke execute on function public.process_incremental_refresh_impacts(integer, boolean) from anon, authenticated, public;
grant execute on function public.process_incremental_refresh_impacts(integer, boolean) to service_role;
