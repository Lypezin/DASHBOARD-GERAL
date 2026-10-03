-- Keep existing service-side clients on listar_entregadores_v2 while routing
-- annual and bounded-period requests through the indexed fast RPC.
alter function public.listar_entregadores_v2(
  integer, integer, text, text, text, date, date, text, boolean, text, integer[]
) rename to _listar_entregadores_v2_previous_20261002;

revoke all on function public._listar_entregadores_v2_previous_20261002(
  integer, integer, text, text, text, date, date, text, boolean, text, integer[]
) from public, anon, authenticated, service_role;

create function public.listar_entregadores_v2(
  p_ano integer default null,
  p_semana integer default null,
  p_praca text default null,
  p_sub_praca text default null,
  p_origem text default null,
  p_data_inicial date default null,
  p_data_final date default null,
  p_organization_id text default null,
  p_only_dedicados boolean default false,
  p_search text default null,
  p_semanas integer[] default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_organization_id uuid;
  v_data_inicial date := p_data_inicial;
  v_data_final date := p_data_final;
begin
  if auth.role() = 'service_role' then
    begin
      v_organization_id := nullif(btrim(p_organization_id), '')::uuid;
    exception when others then
      v_organization_id := null;
    end;

    if v_data_inicial is null
       and v_data_final is null
       and p_ano between 2000 and 2100 then
      v_data_inicial := make_date(p_ano, 1, 1);
      v_data_final := make_date(p_ano, 12, 31);
    end if;

    if v_organization_id is not null
       and v_data_inicial is not null
       and v_data_final is not null
       and v_data_final >= v_data_inicial
       and v_data_final - v_data_inicial <= 366
       and coalesce(p_semana, 0) = 0
       and (p_semanas is null or cardinality(p_semanas) = 0)
       and not coalesce(p_only_dedicados, false)
       and nullif(btrim(p_search), '') is null then
      return public.listar_entregadores_dashboard_fast_v1(
        p_ano := p_ano,
        p_semana := p_semana,
        p_praca := p_praca,
        p_sub_praca := p_sub_praca,
        p_origem := p_origem,
        p_data_inicial := v_data_inicial,
        p_data_final := v_data_final,
        p_organization_id := p_organization_id,
        p_only_dedicados := p_only_dedicados,
        p_search := p_search,
        p_semanas := p_semanas
      );
    end if;
  end if;

  return public._listar_entregadores_v2_previous_20261002(
    p_ano := p_ano,
    p_semana := p_semana,
    p_praca := p_praca,
    p_sub_praca := p_sub_praca,
    p_origem := p_origem,
    p_data_inicial := p_data_inicial,
    p_data_final := p_data_final,
    p_organization_id := p_organization_id,
    p_only_dedicados := p_only_dedicados,
    p_search := p_search,
    p_semanas := p_semanas
  );
end;
$function$;

revoke all on function public.listar_entregadores_v2(
  integer, integer, text, text, text, date, date, text, boolean, text, integer[]
) from public, anon, authenticated, service_role;
grant execute on function public.listar_entregadores_v2(
  integer, integer, text, text, text, date, date, text, boolean, text, integer[]
) to service_role;
