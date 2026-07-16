begin;

-- Keep Evolucao data behind the authenticated server proxy.
revoke execute on function public.dashboard_evolucao_bundle_org_year_fast(integer, text)
from public, anon, authenticated;
grant execute on function public.dashboard_evolucao_bundle_org_year_fast(integer, text)
to service_role;

revoke select on public.mv_dashboard_resumo from public, anon, authenticated;
revoke select on public.vw_dashboard_resumo_current from public, anon, authenticated;
grant select on public.mv_dashboard_resumo to service_role;
grant select on public.vw_dashboard_resumo_current to service_role;

-- One grouped request replaces the per-city fallback and uses each metric's real date.
drop function if exists public.get_marketing_cities_data(text, text, text, text, text, text);

create or replace function public.get_marketing_cities_data(
  data_envio_inicial text default null,
  data_envio_final text default null,
  data_liberacao_inicial text default null,
  data_liberacao_final text default null,
  rodou_dia_inicial text default null,
  rodou_dia_final text default null,
  p_organization_id text default null
)
returns table(
  cidade text,
  enviado bigint,
  liberado bigint,
  rodando_inicio bigint,
  aberto bigint,
  voltou bigint,
  criado bigint
)
language plpgsql
stable
set search_path to 'public', 'extensions', 'pg_temp'
as $function$
declare
  v_org_uuid uuid;
  v_profile_org uuid;
  v_is_elevated boolean := false;
  v_is_approved boolean := false;
begin
  begin
    v_org_uuid := nullif(p_organization_id, '')::uuid;
  exception when others then
    v_org_uuid := null;
  end;

  if current_setting('role', true) <> 'service_role' then
    select
      up.organization_id,
      coalesce(up.is_admin, false) or coalesce(up.role, '') in ('admin', 'master'),
      coalesce(up.is_approved, false)
    into v_profile_org, v_is_elevated, v_is_approved
    from public.user_profiles up
    where up.id = auth.uid();

    if not coalesce(v_is_approved, false) then
      return;
    elsif not coalesce(v_is_elevated, false) then
      v_org_uuid := v_profile_org;
    elsif v_org_uuid is null then
      v_org_uuid := v_profile_org;
    end if;
  end if;

  if v_org_uuid is null then
    return;
  end if;

  return query
  with normalized_data as (
    select
      case
        when dm.regiao_atuacao = 'ABC 2.0' and dm.sub_praca_abc in ('Vila Aquino', 'São Caetano') then 'Santo André'
        when dm.regiao_atuacao = 'ABC 2.0' and dm.sub_praca_abc in ('Diadema', 'Nova petrópolis', 'Rudge Ramos') then 'São Bernardo'
        else dm.regiao_atuacao
      end as cidade_nome,
      dm.data_envio,
      dm.data_liberacao,
      dm.rodou_dia,
      dm.status,
      dm."Criado" as data_criado
    from public.dados_marketing dm
    where dm.organization_id = v_org_uuid
      and dm.regiao_atuacao is not null
  )
  select
    nd.cidade_nome::text,
    count(*) filter (
      where nd.data_envio is not null
        and (nd.status is null or nd.status not in ('Confirmar', 'Cancelado', 'Abrindo MEI'))
        and (data_envio_inicial is null or nd.data_envio >= data_envio_inicial::date)
        and (data_envio_final is null or nd.data_envio <= data_envio_final::date)
    )::bigint,
    count(*) filter (
      where nd.status = 'Liberado'
        and nd.data_liberacao is not null
        and (data_liberacao_inicial is null or nd.data_liberacao >= data_liberacao_inicial::date)
        and (data_liberacao_final is null or nd.data_liberacao <= data_liberacao_final::date)
    )::bigint,
    count(*) filter (
      where nd.rodou_dia is not null
        and (rodou_dia_inicial is null or nd.rodou_dia >= rodou_dia_inicial::date)
        and (rodou_dia_final is null or nd.rodou_dia <= rodou_dia_final::date)
    )::bigint,
    count(*) filter (
      where (
        nd.status ilike 'Aberto%'
        or nd.status ilike '%aguardando liberação%'
        or nd.status ilike '%Retorno%'
        or nd.status ilike '%A enviar%'
      )
        and nd.data_envio is not null
        and (data_envio_inicial is null or nd.data_envio >= data_envio_inicial::date)
        and (data_envio_final is null or nd.data_envio <= data_envio_final::date)
    )::bigint,
    count(*) filter (
      where (
        nd.status ilike 'Voltou%'
        or nd.status ilike '%desistiu%'
        or nd.status ilike '%bug%'
      )
        and nd.data_envio is not null
        and (data_envio_inicial is null or nd.data_envio >= data_envio_inicial::date)
        and (data_envio_final is null or nd.data_envio <= data_envio_final::date)
    )::bigint,
    count(*) filter (
      where nd.data_criado is not null
        and (data_envio_inicial is null or nd.data_criado >= data_envio_inicial::date)
        and (data_envio_final is null or nd.data_criado <= data_envio_final::date)
    )::bigint
  from normalized_data nd
  group by nd.cidade_nome
  order by nd.cidade_nome;
end;
$function$;

revoke execute on function public.get_marketing_cities_data(text, text, text, text, text, text, text)
from public, anon;
grant execute on function public.get_marketing_cities_data(text, text, text, text, text, text, text)
to authenticated, service_role;

-- Aggregate both comparison periods and all presentation cities in one database call.
create or replace function public.get_marketing_costs_comparison(
  p_start_date date,
  p_current_end date,
  p_previous_end date,
  p_organization_id text default null
)
returns table(
  periodo text,
  regiao text,
  valor_usado numeric,
  rodando bigint,
  liberado bigint,
  aberto bigint,
  conversas numeric
)
language plpgsql
stable
set search_path to 'public', 'extensions', 'pg_temp'
as $function$
declare
  v_org_uuid uuid;
  v_profile_org uuid;
  v_is_elevated boolean := false;
  v_is_approved boolean := false;
begin
  begin
    v_org_uuid := nullif(p_organization_id, '')::uuid;
  exception when others then
    v_org_uuid := null;
  end;

  if current_setting('role', true) <> 'service_role' then
    select
      up.organization_id,
      coalesce(up.is_admin, false) or coalesce(up.role, '') in ('admin', 'master'),
      coalesce(up.is_approved, false)
    into v_profile_org, v_is_elevated, v_is_approved
    from public.user_profiles up
    where up.id = auth.uid();

    if not coalesce(v_is_approved, false) then
      return;
    elsif not coalesce(v_is_elevated, false) then
      v_org_uuid := v_profile_org;
    elsif v_org_uuid is null then
      v_org_uuid := v_profile_org;
    end if;
  end if;

  if v_org_uuid is null or p_start_date is null or p_current_end is null or p_previous_end is null then
    return;
  end if;

  return query
  with periods(periodo, end_date) as (
    values ('atual'::text, p_current_end), ('passada'::text, p_previous_end)
  ),
  cities(regiao, sort_order) as (
    values
      ('São Paulo 2.0'::text, 1),
      ('Salvador 2.0'::text, 2),
      ('Guarulhos 2.0'::text, 3),
      ('Manaus 2.0'::text, 4),
      ('Sorocaba 2.0'::text, 5),
      ('ABC 2.0'::text, 6)
  ),
  marketing_base as materialized (
    select
      case
        when dm.regiao_atuacao in ('ABC', 'ABC 2.0') then 'ABC 2.0'
        when dm.regiao_atuacao in ('São Paulo', 'São Paulo 2.0') then 'São Paulo 2.0'
        when dm.regiao_atuacao in ('Guarulhos', 'Guarulhos 2.0') then 'Guarulhos 2.0'
        else dm.regiao_atuacao
      end as regiao,
      dm.status,
      dm.data_envio,
      dm.data_liberacao,
      dm.rodou_dia
    from public.dados_marketing dm
    where dm.organization_id = v_org_uuid
      and dm.regiao_atuacao is not null
      and (
        dm.data_envio between p_start_date and p_current_end
        or dm.data_liberacao between p_start_date and p_current_end
        or dm.rodou_dia between p_start_date and p_current_end
      )
  ),
  marketing_agg as (
    select
      p.periodo,
      c.regiao,
      count(*) filter (
        where mb.rodou_dia between p_start_date and p.end_date
      )::bigint as rodando,
      count(*) filter (
        where mb.status = 'Liberado'
          and mb.data_liberacao between p_start_date and p.end_date
      )::bigint as liberado,
      count(*) filter (
        where (
          mb.status ilike 'Aberto%'
          or mb.status ilike '%aguardando liberação%'
          or mb.status ilike '%Retorno%'
          or mb.status ilike '%A enviar%'
        )
          and mb.data_envio between p_start_date and p.end_date
      )::bigint as aberto
    from periods p
    cross join cities c
    left join marketing_base mb on mb.regiao = c.regiao
    group by p.periodo, p.end_date, c.regiao
  ),
  costs_base as materialized (
    select
      case
        when upper(btrim(dvc.cidade)) in ('ABC', 'ABC 2.0', 'SANTO ANDRÉ', 'SANTO ANDRE', 'SÃO BERNARDO', 'SAO BERNARDO') then 'ABC 2.0'
        when upper(btrim(dvc.cidade)) = 'SÃO PAULO' then 'São Paulo 2.0'
        when upper(btrim(dvc.cidade)) = 'SALVADOR' then 'Salvador 2.0'
        when upper(btrim(dvc.cidade)) = 'GUARULHOS' then 'Guarulhos 2.0'
        when upper(btrim(dvc.cidade)) = 'MANAUS' then 'Manaus 2.0'
        when upper(btrim(dvc.cidade)) = 'SOROCABA' then 'Sorocaba 2.0'
        else null
      end as regiao,
      dvc.data,
      coalesce(dvc.valor, 0)::numeric as valor,
      coalesce(dvc.conversas, 0)::numeric as conversas
    from public.dados_valores_cidade dvc
    where dvc.organization_id = v_org_uuid
      and dvc.data between p_start_date and p_current_end
      and dvc.id_atendente::text in ('6905', '6976', '2387', '4182', '5447')
  ),
  costs_agg as (
    select
      p.periodo,
      c.regiao,
      coalesce(sum(cb.valor) filter (where cb.data <= p.end_date), 0)::numeric as valor_usado,
      coalesce(sum(cb.conversas) filter (where cb.data <= p.end_date), 0)::numeric as conversas
    from periods p
    cross join cities c
    left join costs_base cb on cb.regiao = c.regiao
    group by p.periodo, p.end_date, c.regiao
  )
  select
    p.periodo,
    c.regiao,
    coalesce(ca.valor_usado, 0)::numeric,
    coalesce(ma.rodando, 0)::bigint,
    coalesce(ma.liberado, 0)::bigint,
    coalesce(ma.aberto, 0)::bigint,
    coalesce(ca.conversas, 0)::numeric
  from periods p
  cross join cities c
  left join marketing_agg ma on ma.periodo = p.periodo and ma.regiao = c.regiao
  left join costs_agg ca on ca.periodo = p.periodo and ca.regiao = c.regiao
  order by case p.periodo when 'atual' then 1 else 2 end, c.sort_order;
end;
$function$;

revoke all on function public.get_marketing_costs_comparison(date, date, date, text)
from public, anon;
grant execute on function public.get_marketing_costs_comparison(date, date, date, text)
to authenticated, service_role;

-- Keep cost rows visible to approved users whose organization is present in
-- user_profiles even when older JWT metadata has not been backfilled yet.
alter policy "Users can view valores_cidade in their organization"
on public.dados_valores_cidade
to authenticated
using (
  public.is_global_admin()
  or organization_id = public.get_my_organization_id()
  or organization_id = public.get_user_organization_id()
);

notify pgrst, 'reload schema';

commit;
