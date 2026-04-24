begin;

set local statement_timeout = '0';
set local lock_timeout = '10s';
set local idle_in_transaction_session_timeout = '0';

select pg_advisory_xact_lock(hashtext('optimize_heavy_mvs_and_indexes_20260424'));

update public.mv_refresh_control
set refresh_in_progress = true,
    updated_at = now()
where mv_name in (
  'mv_dashboard_resumo',
  'mv_dashboard_resumo_v2',
  'mv_entregadores_agregado',
  'mv_valores_entregador',
  'mv_corridas_agregadas',
  'mv_entregadores_ativacao',
  'mv_entregadores_summary'
);

alter materialized view public.mv_dashboard_resumo rename to mv_dashboard_resumo_pre_opt_20260424;

create materialized view public.mv_dashboard_resumo as
with dados_base as (
  select
    d.id,
    d.data_do_periodo,
    (extract(isoyear from d.data_do_periodo))::integer as ano_iso,
    (extract(week from d.data_do_periodo))::integer as semana_iso,
    d.praca,
    d.sub_praca,
    d.origem,
    d.periodo as turno,
    d.organization_id,
    coalesce(d.numero_de_corridas_ofertadas, 0) as corridas_ofertadas,
    coalesce(d.numero_de_corridas_aceitas, 0) as corridas_aceitas,
    coalesce(d.numero_de_corridas_rejeitadas, 0) as corridas_rejeitadas,
    coalesce(d.numero_de_corridas_completadas, 0) as corridas_completadas,
    coalesce(d.soma_das_taxas_das_corridas_aceitas, 0::numeric) as total_taxas_centavos,
    d.numero_minimo_de_entregadores_regulares_na_escala,
    d.duracao_do_periodo,
    d.tempo_disponivel_absoluto
  from public.dados_corridas d
  where d.data_do_periodo is not null
),
horas_planejadas as (
  select
    unicos.data_do_periodo,
    unicos.praca,
    unicos.sub_praca,
    unicos.origem,
    unicos.turno,
    unicos.organization_id,
    sum((unicos.numero_minimo_de_entregadores_regulares_na_escala)::numeric * extract(epoch from (unicos.duracao_do_periodo)::interval)) as segundos_planejados
  from (
    select distinct
      db.data_do_periodo,
      db.praca,
      db.sub_praca,
      db.origem,
      db.turno,
      db.organization_id,
      db.numero_minimo_de_entregadores_regulares_na_escala,
      db.duracao_do_periodo
    from dados_base db
    where db.duracao_do_periodo is not null
      and db.duracao_do_periodo <> '00:00:00'::text
  ) unicos
  group by unicos.data_do_periodo, unicos.praca, unicos.sub_praca, unicos.origem, unicos.turno, unicos.organization_id
),
horas_realizadas as (
  select
    db.data_do_periodo,
    db.praca,
    db.sub_praca,
    db.origem,
    db.turno,
    db.organization_id,
    sum(extract(epoch from (db.tempo_disponivel_absoluto)::interval)) as segundos_realizados,
    sum(db.corridas_ofertadas) as total_ofertadas,
    sum(db.corridas_aceitas) as total_aceitas,
    sum(db.corridas_rejeitadas) as total_rejeitadas,
    sum(db.corridas_completadas) as total_completadas,
    sum(db.total_taxas_centavos) as total_valor_bruto_centavos
  from dados_base db
  group by db.data_do_periodo, db.praca, db.sub_praca, db.origem, db.turno, db.organization_id
)
select
  hr.data_do_periodo,
  (extract(isoyear from hr.data_do_periodo))::integer as ano_iso,
  (extract(week from hr.data_do_periodo))::integer as semana_iso,
  hr.praca,
  hr.sub_praca,
  hr.origem,
  hr.turno,
  hr.organization_id,
  hr.total_ofertadas,
  hr.total_aceitas,
  hr.total_rejeitadas,
  hr.total_completadas,
  hr.total_valor_bruto_centavos,
  coalesce(hp.segundos_planejados, 0::numeric) as segundos_planejados,
  coalesce(hr.segundos_realizados, 0::numeric) as segundos_realizados
from horas_realizadas hr
left join horas_planejadas hp
  on hr.data_do_periodo = hp.data_do_periodo
 and hr.praca is not distinct from hp.praca
 and hr.sub_praca is not distinct from hp.sub_praca
 and hr.origem is not distinct from hp.origem
 and hr.turno is not distinct from hp.turno
 and hr.organization_id is not distinct from hp.organization_id;

create unique index idx_mv_dashboard_resumo_unique_v3
  on public.mv_dashboard_resumo (data_do_periodo, praca, sub_praca, origem, turno, organization_id) nulls not distinct;
create index idx_mv_dashboard_org_ano_semana_v3
  on public.mv_dashboard_resumo (organization_id, ano_iso, semana_iso);
create index idx_mv_dashboard_filtros_v3
  on public.mv_dashboard_resumo (ano_iso, semana_iso, praca, sub_praca, origem, turno);
create index idx_mv_dashboard_data_v3
  on public.mv_dashboard_resumo (data_do_periodo);
create index idx_mv_dashboard_org_v3
  on public.mv_dashboard_resumo (organization_id);

do $$
declare
  v_diff_count bigint;
  v_old_total numeric;
  v_new_total numeric;
begin
  select count(*)
  into v_diff_count
  from (
    (
      select
        data_do_periodo,
        ano_iso,
        semana_iso,
        praca,
        sub_praca,
        origem,
        turno,
        organization_id,
        total_ofertadas,
        total_aceitas,
        total_rejeitadas,
        total_completadas,
        segundos_planejados,
        segundos_realizados
      from public.mv_dashboard_resumo_pre_opt_20260424
      except all
      select
        data_do_periodo,
        ano_iso,
        semana_iso,
        praca,
        sub_praca,
        origem,
        turno,
        organization_id,
        total_ofertadas,
        total_aceitas,
        total_rejeitadas,
        total_completadas,
        segundos_planejados,
        segundos_realizados
      from public.mv_dashboard_resumo
    )
    union all
    (
      select
        data_do_periodo,
        ano_iso,
        semana_iso,
        praca,
        sub_praca,
        origem,
        turno,
        organization_id,
        total_ofertadas,
        total_aceitas,
        total_rejeitadas,
        total_completadas,
        segundos_planejados,
        segundos_realizados
      from public.mv_dashboard_resumo
      except all
      select
        data_do_periodo,
        ano_iso,
        semana_iso,
        praca,
        sub_praca,
        origem,
        turno,
        organization_id,
        total_ofertadas,
        total_aceitas,
        total_rejeitadas,
        total_completadas,
        segundos_planejados,
        segundos_realizados
      from public.mv_dashboard_resumo_pre_opt_20260424
    )
  ) diff;

  if v_diff_count <> 0 then
    raise exception 'mv_dashboard_resumo parity failed: % rows differ', v_diff_count;
  end if;

  select coalesce(sum(total_valor_bruto_centavos), 0)
  into v_old_total
  from public.mv_dashboard_resumo_v2;

  select coalesce(sum(total_valor_bruto_centavos), 0)
  into v_new_total
  from public.mv_dashboard_resumo;

  if v_old_total is distinct from v_new_total then
    raise exception 'mv_dashboard_resumo total_valor parity failed: old %, new %', v_old_total, v_new_total;
  end if;
end;
$$;

drop materialized view public.mv_dashboard_resumo_v2;

create view public.mv_dashboard_resumo_v2 as
select
  data_do_periodo,
  ano_iso,
  semana_iso,
  praca,
  sub_praca,
  origem,
  turno,
  organization_id,
  total_ofertadas,
  total_aceitas,
  total_rejeitadas,
  total_completadas,
  total_valor_bruto_centavos,
  segundos_planejados,
  segundos_realizados
from public.mv_dashboard_resumo;

alter materialized view public.mv_entregadores_agregado rename to mv_entregadores_agregado_pre_opt_20260424;

create materialized view public.mv_entregadores_agregado as
select
  dc.id_da_pessoa_entregadora as id_entregador,
  dc.pessoa_entregadora as nome_entregador,
  dc.praca,
  dc.sub_praca,
  dc.origem,
  dc.ano_iso,
  dc.semana_numero,
  dc.data_do_periodo,
  dc.organization_id,
  sum(dc.numero_de_corridas_ofertadas) as corridas_ofertadas,
  sum(dc.numero_de_corridas_aceitas) as corridas_aceitas,
  sum(dc.numero_de_corridas_rejeitadas) as corridas_rejeitadas,
  sum(dc.numero_de_corridas_completadas) as corridas_completadas,
  sum(dc.tempo_disponivel_absoluto_segundos) as total_segundos,
  sum(dc.soma_das_taxas_das_corridas_aceitas) as soma_taxas_aceitas
from public.dados_corridas dc
where dc.pessoa_entregadora is not null
group by dc.id_da_pessoa_entregadora, dc.pessoa_entregadora, dc.praca, dc.sub_praca, dc.origem, dc.ano_iso, dc.semana_numero, dc.data_do_periodo, dc.organization_id;

create unique index idx_mv_entregadores_agregado_unique_v3
  on public.mv_entregadores_agregado (id_entregador, praca, sub_praca, origem, ano_iso, semana_numero, data_do_periodo, organization_id) nulls not distinct;
create index idx_mv_entregadores_agregado_org_ano_semana_praca_v3
  on public.mv_entregadores_agregado (organization_id, ano_iso, semana_numero, praca, sub_praca, origem);
create index idx_mv_entregadores_agregado_ano_semana_org_v3
  on public.mv_entregadores_agregado (ano_iso, semana_numero, organization_id);
create index idx_mv_entregadores_agregado_org_data_praca_v3
  on public.mv_entregadores_agregado (organization_id, data_do_periodo, praca, sub_praca, origem);

do $$
declare
  v_diff_count bigint;
  v_value_mismatches bigint;
begin
  select count(*)
  into v_diff_count
  from (
    (
      select
        id_entregador,
        nome_entregador,
        praca,
        sub_praca,
        origem,
        ano_iso,
        semana_numero,
        data_do_periodo,
        organization_id,
        corridas_ofertadas,
        corridas_aceitas,
        corridas_rejeitadas,
        corridas_completadas,
        total_segundos
      from public.mv_entregadores_agregado_pre_opt_20260424
      except all
      select
        id_entregador,
        nome_entregador,
        praca,
        sub_praca,
        origem,
        ano_iso,
        semana_numero,
        data_do_periodo,
        organization_id,
        corridas_ofertadas,
        corridas_aceitas,
        corridas_rejeitadas,
        corridas_completadas,
        total_segundos
      from public.mv_entregadores_agregado
    )
    union all
    (
      select
        id_entregador,
        nome_entregador,
        praca,
        sub_praca,
        origem,
        ano_iso,
        semana_numero,
        data_do_periodo,
        organization_id,
        corridas_ofertadas,
        corridas_aceitas,
        corridas_rejeitadas,
        corridas_completadas,
        total_segundos
      from public.mv_entregadores_agregado
      except all
      select
        id_entregador,
        nome_entregador,
        praca,
        sub_praca,
        origem,
        ano_iso,
        semana_numero,
        data_do_periodo,
        organization_id,
        corridas_ofertadas,
        corridas_aceitas,
        corridas_rejeitadas,
        corridas_completadas,
        total_segundos
      from public.mv_entregadores_agregado_pre_opt_20260424
    )
  ) diff;

  if v_diff_count <> 0 then
    raise exception 'mv_entregadores_agregado parity failed: % rows differ', v_diff_count;
  end if;

  select count(*)
  into v_value_mismatches
  from (
    (
      select
        id_entregador,
        nome_entregador,
        praca,
        sub_praca,
        origem,
        ano_iso,
        semana_numero,
        data_do_periodo,
        organization_id,
        numero_corridas_aceitas,
        soma_taxas_aceitas
      from public.mv_valores_entregador
      except all
      select
        id_entregador,
        nome_entregador,
        praca,
        sub_praca,
        origem,
        ano_iso,
        semana_numero,
        data_do_periodo,
        organization_id,
        corridas_aceitas as numero_corridas_aceitas,
        soma_taxas_aceitas
      from public.mv_entregadores_agregado
      where id_entregador is not null
        and id_entregador <> ''
    )
    union all
    (
      select
        id_entregador,
        nome_entregador,
        praca,
        sub_praca,
        origem,
        ano_iso,
        semana_numero,
        data_do_periodo,
        organization_id,
        corridas_aceitas as numero_corridas_aceitas,
        soma_taxas_aceitas
      from public.mv_entregadores_agregado
      where id_entregador is not null
        and id_entregador <> ''
      except all
      select
        id_entregador,
        nome_entregador,
        praca,
        sub_praca,
        origem,
        ano_iso,
        semana_numero,
        data_do_periodo,
        organization_id,
        numero_corridas_aceitas,
        soma_taxas_aceitas
      from public.mv_valores_entregador
    )
  ) diff;

  if v_value_mismatches <> 0 then
    raise exception 'mv_valores_entregador compatibility failed: % rows differ', v_value_mismatches;
  end if;
end;
$$;

drop materialized view public.mv_valores_entregador;

create view public.mv_valores_entregador as
select
  id_entregador,
  nome_entregador,
  praca,
  sub_praca,
  origem,
  ano_iso,
  semana_numero,
  data_do_periodo,
  organization_id,
  corridas_aceitas as numero_corridas_aceitas,
  soma_taxas_aceitas
from public.mv_entregadores_agregado
where id_entregador is not null
  and id_entregador <> '';

alter materialized view public.mv_entregadores_ativacao rename to mv_entregadores_ativacao_pre_opt_20260424;
alter materialized view public.mv_entregadores_summary rename to mv_entregadores_summary_pre_opt_20260424;
alter materialized view public.mv_corridas_agregadas rename to mv_corridas_agregadas_pre_opt_20260424;

create materialized view public.mv_corridas_agregadas as
select
  dc.id_da_pessoa_entregadora as id_entregador,
  dc.pessoa_entregadora as nome_entregador,
  dc.praca,
  (extract(isoyear from dc.data_do_periodo))::integer as ano_iso,
  (extract(week from dc.data_do_periodo))::integer as semana_numero,
  date_trunc('week', dc.data_do_periodo)::date as week_start_date,
  sum(dc.numero_de_corridas_completadas) as corridas_completadas,
  dc.organization_id
from public.dados_corridas dc
where dc.id_da_pessoa_entregadora is not null
  and dc.data_do_periodo is not null
group by dc.id_da_pessoa_entregadora, dc.pessoa_entregadora, dc.praca, (extract(isoyear from dc.data_do_periodo))::integer, (extract(week from dc.data_do_periodo))::integer, date_trunc('week', dc.data_do_periodo)::date, dc.organization_id;

create index idx_mv_corridas_agregadas_org_week_praca_driver_v3
  on public.mv_corridas_agregadas (organization_id, week_start_date, praca, id_entregador);
create index idx_mv_corridas_agregadas_org_id_v3
  on public.mv_corridas_agregadas (organization_id, id_entregador);
create index idx_mv_corridas_agregadas_entregador_v3
  on public.mv_corridas_agregadas (id_entregador);
create index idx_mv_corridas_agregadas_semana_v3
  on public.mv_corridas_agregadas (ano_iso, semana_numero);
create index idx_mv_corridas_agregadas_org_v3
  on public.mv_corridas_agregadas (organization_id);

create materialized view public.mv_entregadores_summary as
select
  mca.id_entregador,
  mca.organization_id,
  max(mca.nome_entregador) as nome,
  sum(mca.corridas_completadas) as total_rides,
  min(mca.week_start_date) as activation_week,
  max(mca.week_start_date) as last_active_week,
  coalesce(bool_or(exists (
    select 1
    from public.dados_marketing dm
    where dm.id_entregador = mca.id_entregador
      and dm.organization_id = mca.organization_id
  )), false) as is_marketing
from public.mv_corridas_agregadas mca
group by mca.id_entregador, mca.organization_id;

create index idx_mv_entregadores_summary_last_active_v3
  on public.mv_entregadores_summary (last_active_week);
create index idx_mv_entregadores_summary_activation_v3
  on public.mv_entregadores_summary (activation_week);

create materialized view public.mv_entregadores_ativacao as
with courier_progress as (
  select
    mca.id_entregador,
    mca.organization_id,
    max(mca.nome_entregador) over (partition by mca.id_entregador) as nome_entregador,
    mca.week_start_date,
    sum(mca.corridas_completadas) over (
      partition by mca.organization_id, mca.id_entregador
      order by mca.ano_iso, mca.semana_numero
    ) as running_total
  from public.mv_corridas_agregadas mca
),
activations as (
  select
    cp.id_entregador,
    cp.organization_id,
    min(cp.week_start_date) as activation_week,
    max(cp.nome_entregador) as nome
  from courier_progress cp
  where cp.running_total >= 30::numeric
  group by cp.id_entregador, cp.organization_id
)
select
  a.id_entregador,
  a.organization_id,
  a.nome as nome_entregador,
  a.activation_week,
  coalesce(bool_or(dm.id_entregador is not null), false) as is_marketing
from activations a
left join public.dados_marketing dm
  on a.id_entregador = dm.id_entregador
 and a.organization_id = dm.organization_id
group by a.id_entregador, a.organization_id, a.activation_week, a.nome;

create unique index idx_mv_ativacao_composite_v3
  on public.mv_entregadores_ativacao (organization_id, id_entregador);
create index idx_mv_ativacao_org_week_v3
  on public.mv_entregadores_ativacao (organization_id, activation_week);

do $$
declare
  v_old_rows bigint;
  v_new_rows bigint;
  v_old_total numeric;
  v_new_total numeric;
begin
  select count(*), coalesce(sum(corridas_completadas), 0)
  into v_old_rows, v_old_total
  from public.mv_corridas_agregadas_pre_opt_20260424;

  select count(*), coalesce(sum(corridas_completadas), 0)
  into v_new_rows, v_new_total
  from public.mv_corridas_agregadas;

  if v_old_rows <> v_new_rows or v_old_total is distinct from v_new_total then
    raise exception 'mv_corridas_agregadas parity failed: old rows %, new rows %, old total %, new total %', v_old_rows, v_new_rows, v_old_total, v_new_total;
  end if;
end;
$$;

create or replace function public.listar_valores_entregadores(
  p_ano integer default null,
  p_semana integer default null,
  p_praca text default null,
  p_sub_praca text default null,
  p_origem text default null,
  p_data_inicial date default null,
  p_data_final date default null,
  p_organization_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_result jsonb;
  v_org_filter uuid;
  v_is_admin boolean := false;
  v_pracas text[];
  v_sub_pracas text[];
  v_origens text[];
begin
  begin
    v_org_filter := nullif(p_organization_id, '')::uuid;
  exception when others then
    v_org_filter := null;
  end;

  select coalesce((role in ('admin', 'marketing', 'master') or is_admin = true), false)
  into v_is_admin
  from public.user_profiles
  where id = auth.uid();

  if v_org_filter is null and not v_is_admin then
    select organization_id
    into v_org_filter
    from public.user_profiles
    where id = auth.uid();
  end if;

  if p_praca is not null and btrim(p_praca) <> '' and lower(btrim(p_praca)) not in ('todas', 'todos', 'all') then
    select array_agg(item)
    into v_pracas
    from (
      select distinct btrim(value) as item
      from unnest(string_to_array(p_praca, ',')) as value
      where btrim(value) <> ''
    ) praca_values;
  end if;

  if p_sub_praca is not null and btrim(p_sub_praca) <> '' and lower(btrim(p_sub_praca)) not in ('todas', 'todos', 'all') then
    select array_agg(item)
    into v_sub_pracas
    from (
      select distinct btrim(value) as item
      from unnest(string_to_array(p_sub_praca, ',')) as value
      where btrim(value) <> ''
    ) sub_praca_values;
  end if;

  if p_origem is not null and btrim(p_origem) <> '' and lower(btrim(p_origem)) not in ('todas', 'todos', 'all') then
    select array_agg(item)
    into v_origens
    from (
      select distinct btrim(value) as item
      from unnest(string_to_array(p_origem, ',')) as value
      where btrim(value) <> ''
    ) origem_values;
  end if;

  with filtered_data as (
    select
      mv.id_entregador,
      mv.nome_entregador,
      mv.corridas_aceitas as numero_corridas_aceitas,
      mv.soma_taxas_aceitas
    from public.mv_entregadores_agregado mv
    where (v_org_filter is null or mv.organization_id = v_org_filter)
      and (v_pracas is null or mv.praca = any(v_pracas))
      and (v_sub_pracas is null or mv.sub_praca = any(v_sub_pracas))
      and (v_origens is null or mv.origem = any(v_origens))
      and mv.nome_entregador is not null
      and case
        when p_data_inicial is not null and p_data_final is not null then
          mv.data_do_periodo >= p_data_inicial and mv.data_do_periodo <= p_data_final
        when p_ano is not null and p_semana is not null then
          mv.ano_iso = p_ano and mv.semana_numero = p_semana
        when p_ano is not null then
          mv.ano_iso = p_ano
        else
          mv.data_do_periodo >= current_date - 14
      end
  ),
  aggregated_data as (
    select
      nome_entregador,
      id_entregador,
      round((sum(soma_taxas_aceitas)::numeric / 100), 2) as total_taxas,
      sum(numero_corridas_aceitas) as numero_corridas_aceitas,
      case
        when sum(numero_corridas_aceitas) > 0 then round((sum(soma_taxas_aceitas)::numeric / 100) / sum(numero_corridas_aceitas), 2)
        else 0
      end as taxa_media,
      count(*) over() as total_count
    from filtered_data
    group by id_entregador, nome_entregador
  )
  select jsonb_build_object(
    'entregadores', coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb),
    'total', coalesce(max(t.total_count), 0)
  )
  into v_result
  from (
    select *
    from aggregated_data
    order by total_taxas desc
  ) t;

  return coalesce(v_result, jsonb_build_object('entregadores', '[]'::jsonb, 'total', 0));
end;
$function$;

create or replace function public.obter_resumo_valores_breakdown(
  p_ano integer default null,
  p_semana integer default null,
  p_praca text default null,
  p_sub_praca text default null,
  p_origem text default null,
  p_data_inicial date default null,
  p_data_final date default null,
  p_organization_id text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_result jsonb;
  v_org_filter uuid;
  v_is_admin boolean := false;
  v_pracas text[];
  v_sub_pracas text[];
  v_origens text[];
begin
  begin
    v_org_filter := nullif(p_organization_id, '')::uuid;
  exception when others then
    v_org_filter := null;
  end;

  select coalesce((role in ('admin', 'marketing', 'master') or is_admin = true), false)
  into v_is_admin
  from public.user_profiles
  where id = auth.uid();

  if v_org_filter is null and not v_is_admin then
    select organization_id
    into v_org_filter
    from public.user_profiles
    where id = auth.uid();
  end if;

  if p_praca is not null and btrim(p_praca) <> '' and lower(btrim(p_praca)) not in ('todas', 'todos', 'all') then
    select array_agg(item)
    into v_pracas
    from (
      select distinct btrim(value) as item
      from unnest(string_to_array(p_praca, ',')) as value
      where btrim(value) <> ''
    ) praca_values;
  end if;

  if p_sub_praca is not null and btrim(p_sub_praca) <> '' and lower(btrim(p_sub_praca)) not in ('todas', 'todos', 'all') then
    select array_agg(item)
    into v_sub_pracas
    from (
      select distinct btrim(value) as item
      from unnest(string_to_array(p_sub_praca, ',')) as value
      where btrim(value) <> ''
    ) sub_praca_values;
  end if;

  if p_origem is not null and btrim(p_origem) <> '' and lower(btrim(p_origem)) not in ('todas', 'todos', 'all') then
    select array_agg(item)
    into v_origens
    from (
      select distinct btrim(value) as item
      from unnest(string_to_array(p_origem, ',')) as value
      where btrim(value) <> ''
    ) origem_values;
  end if;

  with filtered_mv as (
    select
      mv.turno,
      mv.sub_praca,
      mv.total_valor_bruto_centavos,
      mv.total_aceitas
    from public.mv_dashboard_resumo mv
    where (v_org_filter is null or mv.organization_id = v_org_filter)
      and (v_pracas is null or mv.praca = any(v_pracas))
      and (v_sub_pracas is null or mv.sub_praca = any(v_sub_pracas))
      and (v_origens is null or mv.origem = any(v_origens))
      and case
        when p_data_inicial is not null and p_data_final is not null then
          mv.data_do_periodo >= p_data_inicial and mv.data_do_periodo <= p_data_final
        when p_ano is not null and p_semana is not null then
          mv.ano_iso = p_ano and mv.semana_iso = p_semana
        when p_ano is not null then
          mv.ano_iso = p_ano
        else
          true
      end
  ),
  turno_agg as (
    select
      turno,
      round(sum(total_valor_bruto_centavos)::numeric / 100, 2) as total_valor,
      sum(total_aceitas) as total_corridas
    from filtered_mv
    where turno is not null
    group by turno
    order by total_valor desc
  ),
  sub_praca_agg as (
    select
      sub_praca,
      round(sum(total_valor_bruto_centavos)::numeric / 100, 2) as total_valor,
      sum(total_aceitas) as total_corridas
    from filtered_mv
    where sub_praca is not null
    group by sub_praca
    order by total_valor desc
  )
  select jsonb_build_object(
    'by_turno', (select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from turno_agg t),
    'by_sub_praca', (select coalesce(jsonb_agg(row_to_json(s)), '[]'::jsonb) from sub_praca_agg s)
  )
  into v_result;

  return coalesce(v_result, jsonb_build_object('by_turno', '[]'::jsonb, 'by_sub_praca', '[]'::jsonb));
end;
$function$;

create or replace function public.get_fluxo_semanal(
  p_data_inicial date default null,
  p_data_final date default null,
  p_organization_id uuid default null,
  p_praca text default null
)
returns json
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_start_date date;
  v_end_date date;
  v_org_uuid uuid;
  v_result json;
  v_max_last_active_week date;
begin
  v_start_date := coalesce(p_data_inicial, date_trunc('year', current_date)::date);
  v_end_date := coalesce(p_data_final, current_date);
  v_org_uuid := coalesce(p_organization_id, '00000000-0000-0000-0000-000000000001'::uuid);

  select max(last_active_week)
  into v_max_last_active_week
  from public.mv_entregadores_summary
  where organization_id = v_org_uuid;

  with weeks as (
    select
      to_char(d, 'IYYY-"W"IW') as semana_iso,
      d::date as week_date
    from generate_series(
      date_trunc('week', v_start_date),
      date_trunc('week', v_end_date),
      '1 week'::interval
    ) d
  ),
  marketing_entregadores as materialized (
    select distinct dm.id_entregador
    from public.dados_marketing dm
    where dm.id_entregador is not null
      and dm.organization_id = v_org_uuid
  ),
  driver_weekly_rides as materialized (
    select
      mca.id_entregador,
      mca.week_start_date as week_date,
      sum(coalesce(mca.corridas_completadas, 0))::bigint as weekly_rides,
      max(mca.nome_entregador) as nome,
      bool_or(me.id_entregador is not null) as is_marketing
    from public.mv_corridas_agregadas mca
    left join marketing_entregadores me
      on me.id_entregador = mca.id_entregador
    where mca.organization_id = v_org_uuid
      and mca.week_start_date <= date_trunc('week', v_end_date)::date
      and (p_praca is null or mca.praca = p_praca)
    group by mca.id_entregador, mca.week_start_date
  ),
  driver_cumulative as materialized (
    select
      dwr.id_entregador,
      dwr.week_date,
      dwr.weekly_rides,
      dwr.nome,
      dwr.is_marketing,
      sum(dwr.weekly_rides) over (
        partition by dwr.id_entregador
        order by dwr.week_date
      )::bigint as cumulative_rides
    from driver_weekly_rides dwr
  ),
  activation_weeks as materialized (
    select distinct on (dc.id_entregador)
      dc.id_entregador,
      dc.week_date as activation_week
    from driver_cumulative dc
    where dc.cumulative_rides >= 30
    order by dc.id_entregador, dc.week_date
  ),
  filtered_summary as materialized (
    select
      dwr.id_entregador,
      aw.activation_week,
      max(dwr.week_date) as last_active_week,
      sum(dwr.weekly_rides)::bigint as total_rides,
      bool_or(dwr.is_marketing) as is_marketing,
      max(dwr.nome) as nome
    from driver_weekly_rides dwr
    left join activation_weeks aw
      on aw.id_entregador = dwr.id_entregador
    group by dwr.id_entregador, aw.activation_week
  ),
  entradas_grouped as (
    select
      to_char(fs.activation_week, 'IYYY-"W"IW') as semana_iso,
      count(*) filter (where fs.is_marketing)::bigint as qtd_mkt,
      count(*) filter (where not fs.is_marketing)::bigint as qtd_ops,
      array_agg(fs.nome) filter (where fs.is_marketing) as nomes_mkt,
      array_agg(fs.nome) filter (where not fs.is_marketing) as nomes_ops
    from filtered_summary fs
    where fs.activation_week is not null
      and fs.activation_week >= v_start_date
      and fs.activation_week <= v_end_date
    group by 1
  ),
  saidas_grouped as (
    select
      to_char(fs.last_active_week, 'IYYY-"W"IW') as semana_iso,
      count(*) filter (where fs.is_marketing)::bigint as qtd_mkt_matured,
      count(*) filter (where not fs.is_marketing)::bigint as qtd_ops_matured,
      count(*) filter (where fs.is_marketing and fs.total_rides < 30)::bigint as qtd_mkt_novice,
      count(*) filter (where not fs.is_marketing and fs.total_rides < 30)::bigint as qtd_ops_novice,
      array_agg(fs.nome) filter (where fs.is_marketing) as nomes_mkt_matured,
      array_agg(fs.nome) filter (where not fs.is_marketing) as nomes_ops_matured,
      array_agg(fs.nome) filter (where fs.is_marketing and fs.total_rides < 30) as nomes_mkt_novice,
      array_agg(fs.nome) filter (where not fs.is_marketing and fs.total_rides < 30) as nomes_ops_novice
    from filtered_summary fs
    where fs.last_active_week >= v_start_date
      and fs.last_active_week <= v_end_date
      and fs.last_active_week < coalesce(v_max_last_active_week, fs.last_active_week + interval '1 week')
    group by 1
  ),
  weeks_ordered as (
    select
      dwr.id_entregador,
      dwr.week_date as week_start_date,
      lag(dwr.week_date) over (
        partition by dwr.id_entregador
        order by dwr.week_date
      ) as prev_week_date
    from driver_weekly_rides dwr
    where dwr.weekly_rides > 0
  ),
  retomada_raw as (
    select
      wo.week_start_date,
      wo.id_entregador,
      wo.prev_week_date as origin_date
    from weeks_ordered wo
    where wo.week_start_date >= v_start_date
      and wo.week_start_date <= v_end_date
      and (wo.prev_week_date is null or wo.prev_week_date < (wo.week_start_date - interval '1 week'))
      and exists (
        select 1
        from filtered_summary fs
        where fs.id_entregador = wo.id_entregador
          and fs.activation_week is not null
          and fs.activation_week < wo.week_start_date
      )
  ),
  retomada_breakdown as (
    select
      to_char(rr.week_start_date, 'IYYY-"W"IW') as semana_iso,
      to_char(rr.origin_date, 'IYYY-"W"IW') as origin_week,
      count(*)::bigint as qtd
    from retomada_raw rr
    where rr.origin_date is not null
    group by 1, 2
  ),
  retomada_grouped as (
    select
      to_char(rr.week_start_date, 'IYYY-"W"IW') as semana_iso,
      count(*) filter (where fs.is_marketing)::bigint as qtd_mkt,
      count(*) filter (where not fs.is_marketing)::bigint as qtd_ops,
      array_agg(fs.nome) filter (where fs.is_marketing) as nomes_mkt,
      array_agg(fs.nome) filter (where not fs.is_marketing) as nomes_ops
    from retomada_raw rr
    join filtered_summary fs
      on fs.id_entregador = rr.id_entregador
    group by 1
  ),
  retomada_json as (
    select
      rb.semana_iso,
      jsonb_object_agg(rb.origin_week, rb.qtd) as origin_json
    from retomada_breakdown rb
    group by rb.semana_iso
  ),
  base_ativa_raw as (
    select
      to_char(dwr.week_date, 'IYYY-"W"IW') as semana_iso,
      count(distinct dwr.id_entregador)::bigint as base_ativa
    from driver_weekly_rides dwr
    where dwr.week_date >= v_start_date
      and dwr.week_date <= v_end_date
      and dwr.weekly_rides > 0
    group by 1
  ),
  result as (
    select
      w.semana_iso as semana,
      (coalesce(eg.qtd_mkt, 0) + coalesce(eg.qtd_ops, 0))::bigint as entradas_total,
      coalesce(eg.qtd_mkt, 0)::bigint as entradas_mkt_count,
      coalesce(eg.nomes_mkt, array[]::text[]) as nomes_entradas_mkt,
      coalesce(eg.nomes_ops, array[]::text[]) as nomes_entradas_ops,
      (coalesce(sg.qtd_mkt_matured, 0) + coalesce(sg.qtd_ops_matured, 0))::bigint as saidas_total,
      coalesce(sg.qtd_mkt_matured, 0)::bigint as saidas_mkt_count,
      coalesce(sg.nomes_mkt_matured, array[]::text[]) as nomes_saidas_mkt,
      coalesce(sg.nomes_ops_matured, array[]::text[]) as nomes_saidas_ops,
      (coalesce(sg.qtd_mkt_novice, 0) + coalesce(sg.qtd_ops_novice, 0))::bigint as saidas_novos_total,
      coalesce(sg.nomes_mkt_novice, array[]::text[]) as nomes_saidas_novos_mkt,
      coalesce(sg.nomes_ops_novice, array[]::text[]) as nomes_saidas_novos_ops,
      (coalesce(rg.qtd_mkt, 0) + coalesce(rg.qtd_ops, 0))::bigint as retomada_total,
      coalesce(rg.qtd_mkt, 0)::bigint as retomada_mkt_count,
      coalesce(rg.nomes_mkt, array[]::text[]) as nomes_retomada_mkt,
      coalesce(rg.nomes_ops, array[]::text[]) as nomes_retomada_ops,
      coalesce(rj.origin_json, '{}'::jsonb) as retomada_origins,
      ((coalesce(eg.qtd_mkt, 0) + coalesce(eg.qtd_ops, 0)) - (coalesce(sg.qtd_mkt_matured, 0) + coalesce(sg.qtd_ops_matured, 0)))::bigint as saldo,
      coalesce(ba.base_ativa, 0)::bigint as base_ativa,
      (coalesce(ba.base_ativa, 0) - coalesce(lag(ba.base_ativa) over (order by w.semana_iso), ba.base_ativa))::bigint as variacao_base
    from weeks w
    left join entradas_grouped eg on eg.semana_iso = w.semana_iso
    left join saidas_grouped sg on sg.semana_iso = w.semana_iso
    left join retomada_grouped rg on rg.semana_iso = w.semana_iso
    left join retomada_json rj on rj.semana_iso = w.semana_iso
    left join base_ativa_raw ba on ba.semana_iso = w.semana_iso
    order by w.semana_iso
  )
  select json_agg(row_to_json(result))
  into v_result
  from result;

  return coalesce(v_result, '[]'::json);
end;
$function$;

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
      when 'mv_entregadores_ativacao' then 1
      when 'mv_dashboard_resumo' then 1
      when 'mv_dashboard_aderencia_metricas' then 1
      when 'mv_aderencia_agregada' then 1
      when 'mv_utr_stats' then 1
      when 'mv_entregadores_agregado' then 2
      when 'mv_comparison_weekly' then 2
      when 'mv_entregadores_summary' then 2
      when 'mv_entregadores_marketing' then 3
      when 'mv_aderencia_dia' then 4
      when 'mv_aderencia_semana' then 4
      when 'mv_dashboard_admin' then 4
      when 'mv_dashboard_lite' then 4
      when 'mv_dashboard_micro' then 4
      else 5
    end as priority,
    mrc.needs_refresh,
    mrc.last_refresh
  from public.mv_refresh_control mrc
  where mrc.needs_refresh = true
    and mrc.refresh_in_progress = false
  order by priority asc, mrc.mv_name asc;
end;
$function$;

create or replace function public.mark_mv_refresh_needed()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  update public.mv_refresh_control
  set
    needs_refresh = true,
    updated_at = now()
  where mv_name in (
    'mv_dashboard_resumo',
    'mv_aderencia_agregada',
    'mv_aderencia_dia',
    'mv_aderencia_semana',
    'mv_dashboard_aderencia_metricas',
    'mv_dashboard_admin',
    'mv_dashboard_lite',
    'mv_dashboard_micro',
    'mv_corridas_agregadas',
    'mv_entregadores_ativacao',
    'mv_comparison_weekly',
    'mv_entregadores_agregado',
    'mv_entregadores_marketing',
    'mv_entregadores_summary',
    'mv_utr_stats'
  );

  return new;
end;
$function$;

create or replace function public.refresh_mvs_after_bulk_insert(delay_seconds integer default 300)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  mv_count integer;
begin
  update public.mv_refresh_control
  set
    needs_refresh = true,
    updated_at = now()
  where mv_name in (
    'mv_aderencia_agregada',
    'mv_aderencia_dia',
    'mv_aderencia_semana',
    'mv_comparison_weekly',
    'mv_corridas_agregadas',
    'mv_entregadores_ativacao',
    'mv_dashboard_aderencia_metricas',
    'mv_dashboard_admin',
    'mv_dashboard_lite',
    'mv_dashboard_micro',
    'mv_dashboard_resumo',
    'mv_entregadores_agregado',
    'mv_entregadores_marketing',
    'mv_entregadores_summary',
    'mv_utr_stats'
  );

  select count(*) into mv_count
  from public.mv_refresh_control
  where needs_refresh = true;

  return format(
    'Marcadas %s MVs para refresh. O refresh será processado automaticamente em até %s minutos.',
    mv_count,
    case
      when delay_seconds < 60 then '1'
      else (delay_seconds / 60)::text
    end
  );
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
begin
  total_start := clock_timestamp();

  for mv_record in
    select mv_name, priority
    from (
      values
        ('mv_corridas_agregadas', 0),
        ('mv_entregadores_ativacao', 1),
        ('mv_dashboard_resumo', 1),
        ('mv_dashboard_aderencia_metricas', 1),
        ('mv_aderencia_agregada', 1),
        ('mv_utr_stats', 1),
        ('mv_entregadores_agregado', 2),
        ('mv_comparison_weekly', 2),
        ('mv_entregadores_summary', 2),
        ('mv_entregadores_marketing', 3),
        ('mv_aderencia_dia', 4),
        ('mv_aderencia_semana', 4),
        ('mv_dashboard_admin', 4),
        ('mv_dashboard_lite', 4),
        ('mv_dashboard_micro', 4)
    ) as mvs(mv_name, priority)
    where (refresh_critical_only = false or priority <= 1)
    order by priority, mv_name
  loop
    begin
      single_mv_result := public.refresh_single_mv(mv_record.mv_name, false);

      results := array_append(results, json_build_object(
        'view', mv_record.mv_name,
        'success', (single_mv_result->>'success')::boolean,
        'duration_seconds', (single_mv_result->>'duration_seconds')::numeric,
        'method', coalesce(single_mv_result->>'method', 'NORMAL'),
        'priority', mv_record.priority,
        'error', single_mv_result->>'error'
      ));
    exception when others then
      results := array_append(results, json_build_object(
        'view', mv_record.mv_name,
        'success', false,
        'error', sqlerrm,
        'priority', mv_record.priority
      ));
    end;
  end loop;

  return json_build_object(
    'success', true,
    'total_duration_seconds', extract(epoch from (clock_timestamp() - total_start)),
    'views_refreshed', array_length(results, 1),
    'critical_only', refresh_critical_only,
    'results', results
  );
end;
$function$;

grant select on public.mv_dashboard_resumo to service_role;
grant select on public.mv_dashboard_resumo_v2 to service_role;
grant select on public.mv_entregadores_agregado to anon, authenticated, service_role;
grant select on public.mv_valores_entregador to anon, authenticated, service_role;
grant select on public.mv_corridas_agregadas to anon, authenticated, service_role;
grant select on public.mv_entregadores_summary to service_role;

insert into public.mv_refresh_control (mv_name, needs_refresh, last_refresh, refresh_in_progress, updated_at)
values ('mv_entregadores_ativacao', false, now(), false, now())
on conflict (mv_name) do update
set needs_refresh = false,
    refresh_in_progress = false,
    last_refresh = now(),
    updated_at = now();

delete from public.mv_refresh_control
where mv_name in ('mv_dashboard_resumo_v2', 'mv_valores_entregador');

update public.mv_refresh_control
set needs_refresh = false,
    refresh_in_progress = false,
    last_refresh = now(),
    updated_at = now()
where mv_name in (
  'mv_dashboard_resumo',
  'mv_entregadores_agregado',
  'mv_corridas_agregadas',
  'mv_entregadores_ativacao',
  'mv_entregadores_summary'
);

drop materialized view public.mv_dashboard_resumo_pre_opt_20260424;
drop materialized view public.mv_entregadores_agregado_pre_opt_20260424;
drop materialized view public.mv_entregadores_summary_pre_opt_20260424;
drop materialized view public.mv_entregadores_ativacao_pre_opt_20260424;
drop materialized view public.mv_corridas_agregadas_pre_opt_20260424;

commit;
