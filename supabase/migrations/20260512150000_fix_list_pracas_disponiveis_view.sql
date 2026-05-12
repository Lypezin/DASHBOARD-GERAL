create or replace function public.list_pracas_disponiveis()
returns table(praca text)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  return query
  with recursive t as (
      (
        select v.praca
        from public.vw_dashboard_resumo_current v
        where v.praca is not null and btrim(v.praca) <> ''
        order by v.praca asc
        limit 1
      )
      union all
      select (
        select v.praca
        from public.vw_dashboard_resumo_current v
        where v.praca > t.praca
          and v.praca is not null
          and btrim(v.praca) <> ''
        order by v.praca asc
        limit 1
      )
      from t
      where t.praca is not null
  )
  select t.praca
  from t
  where t.praca is not null;
end;
$function$;

revoke execute on function public.list_pracas_disponiveis() from public, anon;
grant execute on function public.list_pracas_disponiveis() to authenticated, service_role;
