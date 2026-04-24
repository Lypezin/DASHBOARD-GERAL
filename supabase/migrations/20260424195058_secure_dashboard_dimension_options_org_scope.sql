create or replace function public.get_dashboard_dimension_options(
  p_pracas text[] default null,
  p_organization_id text default null
)
returns table (
  sub_pracas text[],
  origens text[],
  turnos text[]
)
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid;
  v_org_filter uuid;
  v_pracas text[];
  v_can_choose_org boolean := false;
begin
  v_user_id := auth.uid();

  if v_user_id is not null then
    begin
      v_can_choose_org := coalesce(public.is_global_admin(), false);
    exception when others then
      v_can_choose_org := false;
    end;
  end if;

  if p_organization_id is not null and btrim(p_organization_id) <> '' and v_can_choose_org then
    begin
      v_org_filter := p_organization_id::uuid;
    exception when others then
      v_org_filter := null;
    end;
  end if;

  if v_org_filter is null and v_user_id is not null then
    select up.organization_id
    into v_org_filter
    from public.user_profiles up
    where up.id = v_user_id;
  end if;

  if p_pracas is not null and cardinality(p_pracas) > 0 then
    select array_agg(item)
    into v_pracas
    from (
      select distinct btrim(value) as item
      from unnest(p_pracas) as value
      where value is not null
        and btrim(value) <> ''
        and lower(btrim(value)) not in ('todas', 'todos', 'all')
    ) normalized_pracas;
  end if;

  return query
  select
    coalesce(array_agg(distinct mv.sub_praca) filter (where mv.sub_praca is not null and mv.sub_praca <> ''), '{}'::text[]) as sub_pracas,
    coalesce(array_agg(distinct mv.origem) filter (where mv.origem is not null and mv.origem <> ''), '{}'::text[]) as origens,
    coalesce(array_agg(distinct mv.turno) filter (where mv.turno is not null and mv.turno <> ''), '{}'::text[]) as turnos
  from public.mv_dashboard_resumo mv
  where (v_org_filter is null or mv.organization_id = v_org_filter)
    and (v_pracas is null or mv.praca = any(v_pracas));
end;
$function$;

grant execute on function public.get_dashboard_dimension_options(text[], text) to authenticated;

notify pgrst, 'reload schema';
