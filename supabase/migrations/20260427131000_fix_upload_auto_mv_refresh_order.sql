create or replace function public.get_pending_mvs()
returns table(mv_name text, priority integer, needs_refresh boolean, last_refresh timestamp with time zone)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  return query
  select
    mrc.mv_name,
    case mrc.mv_name
      -- Base usada por Entrada/Saida e por MVs de entregadores/marketing.
      when 'mv_corridas_agregadas' then 0

      -- MVs mais visiveis no fluxo pos-upload.
      when 'mv_dashboard_resumo' then 10
      when 'mv_utr_stats' then 20
      when 'mv_entregadores_agregado' then 30
      when 'mv_dashboard_aderencia_metricas' then 40
      when 'mv_aderencia_agregada' then 50
      when 'mv_comparison_weekly' then 60

      -- Dependem de mv_corridas_agregadas, entao ficam depois da base.
      when 'mv_entregadores_ativacao' then 70
      when 'mv_entregadores_summary' then 80

      -- Secundarias/legadas: fora do caminho automatico imediato do upload.
      when 'mv_entregadores_marketing' then 90
      when 'mv_aderencia_dia' then 100
      when 'mv_aderencia_semana' then 100
      when 'mv_dashboard_admin' then 110
      when 'mv_dashboard_lite' then 110
      when 'mv_dashboard_micro' then 110
      else 200
    end as priority,
    mrc.needs_refresh,
    mrc.last_refresh
  from public.mv_refresh_control mrc
  where mrc.needs_refresh = true
    and coalesce(mrc.refresh_in_progress, false) = false
  order by priority asc, mrc.mv_name asc;
end;
$function$;

create or replace function public.refresh_mvs_prioritized(refresh_critical_only boolean default false)
returns json
language plpgsql
security definer
set search_path to 'public'
set statement_timeout to '0'
as $function$
declare
  results json[] := '{}';
  total_start timestamp;
  mv_record record;
  single_mv_result json;
  success_count integer := 0;
  fail_count integer := 0;
  skipped_count integer := 0;
begin
  total_start := clock_timestamp();

  for mv_record in
    select pending.mv_name, pending.priority
    from public.get_pending_mvs() pending
    where refresh_critical_only = false
       or pending.priority <= 80
    order by pending.priority, pending.mv_name
  loop
    begin
      single_mv_result := public.refresh_single_mv(mv_record.mv_name, false);

      if coalesce((single_mv_result->>'skipped')::boolean, false) then
        skipped_count := skipped_count + 1;
      elsif coalesce((single_mv_result->>'success')::boolean, false) then
        success_count := success_count + 1;
      else
        fail_count := fail_count + 1;
      end if;

      results := array_append(results, json_build_object(
        'view', mv_record.mv_name,
        'success', coalesce((single_mv_result->>'success')::boolean, false),
        'skipped', coalesce((single_mv_result->>'skipped')::boolean, false),
        'duration_seconds', nullif(single_mv_result->>'duration_seconds', '')::numeric,
        'method', coalesce(single_mv_result->>'method', 'NORMAL'),
        'priority', mv_record.priority,
        'reason', single_mv_result->>'reason',
        'error', single_mv_result->>'error'
      ));
    exception when others then
      fail_count := fail_count + 1;
      results := array_append(results, json_build_object(
        'view', mv_record.mv_name,
        'success', false,
        'error', sqlerrm,
        'priority', mv_record.priority
      ));
    end;
  end loop;

  return json_build_object(
    'success', fail_count = 0,
    'total_duration_seconds', extract(epoch from (clock_timestamp() - total_start)),
    'views_refreshed', success_count,
    'views_failed', fail_count,
    'views_skipped', skipped_count,
    'critical_only', refresh_critical_only,
    'results', results
  );
end;
$function$;

grant execute on function public.get_pending_mvs() to authenticated;
grant execute on function public.refresh_mvs_prioritized(boolean) to authenticated;

notify pgrst, 'reload schema';
