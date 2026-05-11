create or replace function public.get_available_weeks(p_ano_iso integer)
returns table(semana_iso integer)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select distinct semana_iso
  from public.vw_dashboard_resumo_current
  where ano_iso = p_ano_iso
    and semana_iso is not null
  order by semana_iso desc;
$$;

create or replace function public.get_available_weeks(
  p_ano_iso integer,
  p_organization_id uuid default null
)
returns table(semana_iso integer)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select distinct semana_iso
  from public.vw_dashboard_resumo_current
  where ano_iso = p_ano_iso
    and (p_organization_id is null or organization_id = p_organization_id)
    and semana_iso is not null
  order by semana_iso desc;
$$;

grant execute on function public.get_available_weeks(integer) to authenticated, service_role;
grant execute on function public.get_available_weeks(integer, uuid) to authenticated, service_role;
