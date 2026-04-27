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
      when 'mv_corridas_agregadas' then 0
      when 'mv_dashboard_resumo' then 10
      when 'mv_utr_stats' then 20
      when 'mv_entregadores_agregado' then 30
      when 'mv_dashboard_aderencia_metricas' then 40
      when 'mv_aderencia_agregada' then 50
      when 'mv_comparison_weekly' then 60
      when 'mv_entregadores_ativacao' then 70
      when 'mv_entregadores_summary' then 80
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
  order by priority asc, coalesce(mrc.refresh_in_progress, false) desc, mrc.mv_name asc;
end;
$function$;

notify pgrst, 'reload schema';
