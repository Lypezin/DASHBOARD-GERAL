-- Foundation for future incremental MV refreshes.
-- This migration is intentionally "shadow mode": active MVs/RPCs keep their current contracts.

create table if not exists public.mv_refresh_impacts (
  id bigserial primary key,
  source text not null default 'corridas',
  organization_id uuid not null,
  data_do_periodo date not null,
  ano_iso integer not null,
  semana_numero integer not null,
  week_start_date date not null,
  praca text,
  sub_praca text,
  origem text,
  dashboard_resumo_processed_at timestamptz,
  entregadores_agregado_processed_at timestamptz,
  corridas_agregadas_processed_at timestamptz,
  aderencia_agregada_processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_mv_refresh_impacts_unique_scope
  on public.mv_refresh_impacts (
    source,
    organization_id,
    data_do_periodo,
    praca,
    sub_praca,
    origem
  ) nulls not distinct;

create index if not exists idx_mv_refresh_impacts_dashboard_pending
  on public.mv_refresh_impacts (dashboard_resumo_processed_at, id)
  where dashboard_resumo_processed_at is null;

create index if not exists idx_mv_refresh_impacts_scope
  on public.mv_refresh_impacts (organization_id, data_do_periodo, praca);

create table if not exists public.tb_dashboard_resumo_incremental (
  data_do_periodo date not null,
  ano_iso integer not null,
  semana_iso integer not null,
  praca text,
  sub_praca text,
  origem text,
  turno text,
  organization_id uuid not null,
  total_ofertadas bigint not null default 0,
  total_aceitas bigint not null default 0,
  total_rejeitadas bigint not null default 0,
  total_completadas bigint not null default 0,
  total_valor_bruto_centavos numeric not null default 0,
  segundos_planejados numeric not null default 0,
  segundos_realizados numeric not null default 0,
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_tb_dashboard_resumo_incremental_unique
  on public.tb_dashboard_resumo_incremental (
    data_do_periodo,
    praca,
    sub_praca,
    origem,
    turno,
    organization_id
  ) nulls not distinct;

create index if not exists idx_tb_dashboard_resumo_incremental_org_week
  on public.tb_dashboard_resumo_incremental (organization_id, ano_iso, semana_iso);

create index if not exists idx_tb_dashboard_resumo_incremental_org_praca_date
  on public.tb_dashboard_resumo_incremental (organization_id, praca, data_do_periodo desc);

create or replace function public.insert_dados_corridas_batch(dados jsonb[])
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
    inserted_count integer := 0;
    impact_count integer := 0;
    user_org_id uuid;
begin
    user_org_id := public.get_user_organization_id();

    if user_org_id is null and not public.is_global_admin() then
        user_org_id := '00000000-0000-0000-0000-000000000001'::uuid;
    end if;

    with source_rows as (
        select item, ordinality::integer as row_number
        from unnest(coalesce(dados, array[]::jsonb[])) with ordinality as u(item, ordinality)
    ), prepared_rows as (
        select
            nullif(item->>'data_do_periodo', '')::date as data_do_periodo,
            nullif(item->>'periodo', '')::text as periodo,
            nullif(item->>'duracao_do_periodo', '')::text as duracao_do_periodo,
            (nullif(item->>'numero_minimo_de_entregadores_regulares_na_escala', '')::numeric)::integer as numero_minimo_de_entregadores_regulares_na_escala,
            nullif(item->>'tag', '')::text as tag,
            nullif(item->>'id_da_pessoa_entregadora', '')::text as id_da_pessoa_entregadora,
            nullif(item->>'pessoa_entregadora', '')::text as pessoa_entregadora,
            nullif(item->>'tempo_disponivel_escalado', '')::text as tempo_disponivel_escalado,
            nullif(item->>'tempo_disponivel_absoluto', '')::text as tempo_disponivel_absoluto,
            (nullif(item->>'numero_de_corridas_ofertadas', '')::numeric)::integer as numero_de_corridas_ofertadas,
            (nullif(item->>'numero_de_corridas_aceitas', '')::numeric)::integer as numero_de_corridas_aceitas,
            (nullif(item->>'numero_de_corridas_rejeitadas', '')::numeric)::integer as numero_de_corridas_rejeitadas,
            (nullif(item->>'numero_de_corridas_completadas', '')::numeric)::integer as numero_de_corridas_completadas,
            (nullif(item->>'numero_de_corridas_canceladas_pela_pessoa_entregadora', '')::numeric)::integer as numero_de_corridas_canceladas_pela_pessoa_entregadora,
            (nullif(item->>'numero_de_pedidos_aceitos_e_concluidos', '')::numeric)::integer as numero_de_pedidos_aceitos_e_concluidos,
            nullif(item->>'soma_das_taxas_das_corridas_aceitas', '')::numeric as soma_das_taxas_das_corridas_aceitas,
            nullif(item->>'duracao_segundos', '')::numeric as duracao_segundos,
            nullif(item->>'origem', '')::text as origem,
            nullif(item->>'praca', '')::text as praca,
            nullif(item->>'sub_praca', '')::text as sub_praca,
            coalesce(
                case
                    when item->>'organization_id' is not null
                     and item->>'organization_id' <> ''
                     and item->>'organization_id' <> 'null'
                    then (item->>'organization_id')::uuid
                    else null
                end,
                user_org_id
            ) as organization_id
        from source_rows
    ), inserted as (
        insert into public.dados_corridas (
            data_do_periodo,
            periodo,
            duracao_do_periodo,
            numero_minimo_de_entregadores_regulares_na_escala,
            tag,
            id_da_pessoa_entregadora,
            pessoa_entregadora,
            tempo_disponivel_escalado,
            tempo_disponivel_absoluto,
            numero_de_corridas_ofertadas,
            numero_de_corridas_aceitas,
            numero_de_corridas_rejeitadas,
            numero_de_corridas_completadas,
            numero_de_corridas_canceladas_pela_pessoa_entregadora,
            numero_de_pedidos_aceitos_e_concluidos,
            soma_das_taxas_das_corridas_aceitas,
            duracao_segundos,
            origem,
            praca,
            sub_praca,
            organization_id
        )
        select
            data_do_periodo,
            periodo,
            duracao_do_periodo,
            numero_minimo_de_entregadores_regulares_na_escala,
            tag,
            id_da_pessoa_entregadora,
            pessoa_entregadora,
            tempo_disponivel_escalado,
            tempo_disponivel_absoluto,
            numero_de_corridas_ofertadas,
            numero_de_corridas_aceitas,
            numero_de_corridas_rejeitadas,
            numero_de_corridas_completadas,
            numero_de_corridas_canceladas_pela_pessoa_entregadora,
            numero_de_pedidos_aceitos_e_concluidos,
            soma_das_taxas_das_corridas_aceitas,
            duracao_segundos,
            origem,
            praca,
            sub_praca,
            organization_id
        from prepared_rows
        returning data_do_periodo, organization_id, praca, sub_praca, origem
    ), impact_rows as (
        insert into public.mv_refresh_impacts (
            source,
            organization_id,
            data_do_periodo,
            ano_iso,
            semana_numero,
            week_start_date,
            praca,
            sub_praca,
            origem
        )
        select distinct
            'corridas'::text,
            i.organization_id,
            i.data_do_periodo,
            extract(isoyear from i.data_do_periodo)::integer,
            extract(week from i.data_do_periodo)::integer,
            date_trunc('week', i.data_do_periodo::timestamp with time zone)::date,
            i.praca,
            i.sub_praca,
            i.origem
        from inserted i
        where i.data_do_periodo is not null
          and i.organization_id is not null
        on conflict (source, organization_id, data_do_periodo, praca, sub_praca, origem)
        do update set
            ano_iso = excluded.ano_iso,
            semana_numero = excluded.semana_numero,
            week_start_date = excluded.week_start_date,
            dashboard_resumo_processed_at = null,
            entregadores_agregado_processed_at = null,
            corridas_agregadas_processed_at = null,
            aderencia_agregada_processed_at = null,
            updated_at = now()
        returning 1
    )
    select
      (select count(*) from inserted),
      (select count(*) from impact_rows)
    into inserted_count, impact_count;

    return json_build_object(
        'success', true,
        'inserted', inserted_count,
        'impact_count', impact_count,
        'errors', 0,
        'error_messages', array[]::text[]
    );
exception when others then
    return json_build_object(
        'success', false,
        'inserted', 0,
        'impact_count', 0,
        'errors', 1,
        'error_messages', array[sqlerrm]
    );
end;
$function$;

create or replace function public.refresh_dashboard_resumo_incremental(p_limit integer default 500)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 500), 5000));
  v_impact_count integer := 0;
  v_deleted_count integer := 0;
  v_upserted_count integer := 0;
  v_started_at timestamptz := clock_timestamp();
begin
  if not pg_try_advisory_xact_lock(hashtextextended('refresh_incremental:dashboard_resumo', 0)) then
    return json_build_object(
      'success', true,
      'skipped', true,
      'reason', 'dashboard incremental refresh already running'
    );
  end if;

  drop table if exists pg_temp.tmp_dashboard_resumo_impacts;

  create temporary table tmp_dashboard_resumo_impacts (
    id bigint primary key,
    organization_id uuid not null,
    data_do_periodo date not null,
    praca text,
    sub_praca text,
    origem text
  ) on commit drop;

  insert into tmp_dashboard_resumo_impacts (
    id,
    organization_id,
    data_do_periodo,
    praca,
    sub_praca,
    origem
  )
  select
    id,
    organization_id,
    data_do_periodo,
    praca,
    sub_praca,
    origem
  from public.mv_refresh_impacts
  where source = 'corridas'
    and dashboard_resumo_processed_at is null
  order by id
  limit v_limit
  for update skip locked;

  get diagnostics v_impact_count = row_count;

  if v_impact_count = 0 then
    return json_build_object(
      'success', true,
      'processed_impacts', 0,
      'deleted_rows', 0,
      'upserted_rows', 0,
      'duration_ms', round(extract(epoch from clock_timestamp() - v_started_at) * 1000)
    );
  end if;

  delete from public.tb_dashboard_resumo_incremental t
  using tmp_dashboard_resumo_impacts i
  where t.organization_id = i.organization_id
    and t.data_do_periodo = i.data_do_periodo
    and t.praca is not distinct from i.praca
    and t.sub_praca is not distinct from i.sub_praca
    and t.origem is not distinct from i.origem;

  get diagnostics v_deleted_count = row_count;

  with affected as (
    select distinct organization_id, data_do_periodo, praca, sub_praca, origem
    from tmp_dashboard_resumo_impacts
  ), dados_base as (
    select
      d.id,
      d.data_do_periodo,
      extract(isoyear from d.data_do_periodo)::integer as ano_iso,
      extract(week from d.data_do_periodo)::integer as semana_iso,
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
    join affected a
      on d.organization_id = a.organization_id
     and d.data_do_periodo = a.data_do_periodo
     and d.praca is not distinct from a.praca
     and d.sub_praca is not distinct from a.sub_praca
     and d.origem is not distinct from a.origem
    where d.data_do_periodo is not null
  ), horas_planejadas as (
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
        and db.duracao_do_periodo <> '00:00:00'
    ) unicos
    group by
      unicos.data_do_periodo,
      unicos.praca,
      unicos.sub_praca,
      unicos.origem,
      unicos.turno,
      unicos.organization_id
  ), horas_realizadas as (
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
    group by
      db.data_do_periodo,
      db.praca,
      db.sub_praca,
      db.origem,
      db.turno,
      db.organization_id
  ), upserted as (
    insert into public.tb_dashboard_resumo_incremental (
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
      segundos_realizados,
      updated_at
    )
    select
      hr.data_do_periodo,
      extract(isoyear from hr.data_do_periodo)::integer,
      extract(week from hr.data_do_periodo)::integer,
      hr.praca,
      hr.sub_praca,
      hr.origem,
      hr.turno,
      hr.organization_id,
      coalesce(hr.total_ofertadas, 0),
      coalesce(hr.total_aceitas, 0),
      coalesce(hr.total_rejeitadas, 0),
      coalesce(hr.total_completadas, 0),
      coalesce(hr.total_valor_bruto_centavos, 0),
      coalesce(hp.segundos_planejados, 0),
      coalesce(hr.segundos_realizados, 0),
      now()
    from horas_realizadas hr
    left join horas_planejadas hp
      on hr.data_do_periodo = hp.data_do_periodo
     and hr.praca is not distinct from hp.praca
     and hr.sub_praca is not distinct from hp.sub_praca
     and hr.origem is not distinct from hp.origem
     and hr.turno is not distinct from hp.turno
     and hr.organization_id is not distinct from hp.organization_id
    on conflict (data_do_periodo, praca, sub_praca, origem, turno, organization_id)
    do update set
      ano_iso = excluded.ano_iso,
      semana_iso = excluded.semana_iso,
      total_ofertadas = excluded.total_ofertadas,
      total_aceitas = excluded.total_aceitas,
      total_rejeitadas = excluded.total_rejeitadas,
      total_completadas = excluded.total_completadas,
      total_valor_bruto_centavos = excluded.total_valor_bruto_centavos,
      segundos_planejados = excluded.segundos_planejados,
      segundos_realizados = excluded.segundos_realizados,
      updated_at = now()
    returning 1
  )
  select count(*) into v_upserted_count from upserted;

  update public.mv_refresh_impacts i
  set dashboard_resumo_processed_at = now(),
      updated_at = now()
  from tmp_dashboard_resumo_impacts b
  where i.id = b.id;

  return json_build_object(
    'success', true,
    'processed_impacts', v_impact_count,
    'deleted_rows', v_deleted_count,
    'upserted_rows', v_upserted_count,
    'duration_ms', round(extract(epoch from clock_timestamp() - v_started_at) * 1000)
  );
exception when others then
  return json_build_object(
    'success', false,
    'processed_impacts', v_impact_count,
    'deleted_rows', v_deleted_count,
    'upserted_rows', v_upserted_count,
    'error', sqlerrm,
    'duration_ms', round(extract(epoch from clock_timestamp() - v_started_at) * 1000)
  );
end;
$function$;

create or replace function public.validate_dashboard_resumo_incremental(p_since date default null, p_limit integer default 2000)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 2000), 10000));
  v_key_count integer := 0;
  v_live_count integer := 0;
  v_shadow_count integer := 0;
  v_diff_count integer := 0;
begin
  with keys as (
    select
      data_do_periodo,
      praca,
      sub_praca,
      origem,
      turno,
      organization_id
    from public.tb_dashboard_resumo_incremental
    where p_since is null or data_do_periodo >= p_since
    order by data_do_periodo desc
    limit v_limit
  ), shadow_rows as (
    select
      t.data_do_periodo,
      t.ano_iso,
      t.semana_iso,
      t.praca,
      t.sub_praca,
      t.origem,
      t.turno,
      t.organization_id,
      t.total_ofertadas,
      t.total_aceitas,
      t.total_rejeitadas,
      t.total_completadas,
      t.total_valor_bruto_centavos,
      t.segundos_planejados,
      t.segundos_realizados
    from public.tb_dashboard_resumo_incremental t
    join keys k
      on t.data_do_periodo = k.data_do_periodo
     and t.praca is not distinct from k.praca
     and t.sub_praca is not distinct from k.sub_praca
     and t.origem is not distinct from k.origem
     and t.turno is not distinct from k.turno
     and t.organization_id is not distinct from k.organization_id
  ), live_rows as (
    select
      mv.data_do_periodo,
      mv.ano_iso,
      mv.semana_iso,
      mv.praca,
      mv.sub_praca,
      mv.origem,
      mv.turno,
      mv.organization_id,
      mv.total_ofertadas,
      mv.total_aceitas,
      mv.total_rejeitadas,
      mv.total_completadas,
      mv.total_valor_bruto_centavos,
      mv.segundos_planejados,
      mv.segundos_realizados
    from public.mv_dashboard_resumo mv
    join keys k
      on mv.data_do_periodo = k.data_do_periodo
     and mv.praca is not distinct from k.praca
     and mv.sub_praca is not distinct from k.sub_praca
     and mv.origem is not distinct from k.origem
     and mv.turno is not distinct from k.turno
     and mv.organization_id is not distinct from k.organization_id
  ), diff_rows as (
    (select * from shadow_rows except all select * from live_rows)
    union all
    (select * from live_rows except all select * from shadow_rows)
  )
  select
    (select count(*) from keys),
    (select count(*) from live_rows),
    (select count(*) from shadow_rows),
    (select count(*) from diff_rows)
  into v_key_count, v_live_count, v_shadow_count, v_diff_count;

  return json_build_object(
    'success', true,
    'checked_keys', v_key_count,
    'live_rows', v_live_count,
    'shadow_rows', v_shadow_count,
    'diff_rows', v_diff_count,
    'matches', v_diff_count = 0
  );
end;
$function$;

revoke all on public.mv_refresh_impacts from anon, authenticated, public;
revoke all on public.tb_dashboard_resumo_incremental from anon, authenticated, public;
grant select, insert, update, delete on public.mv_refresh_impacts to service_role;
grant select, insert, update, delete on public.tb_dashboard_resumo_incremental to service_role;
grant usage, select on sequence public.mv_refresh_impacts_id_seq to service_role;

revoke execute on function public.insert_dados_corridas_batch(jsonb[]) from anon, authenticated, public;
grant execute on function public.insert_dados_corridas_batch(jsonb[]) to service_role;

revoke execute on function public.refresh_dashboard_resumo_incremental(integer) from anon, authenticated, public;
grant execute on function public.refresh_dashboard_resumo_incremental(integer) to service_role;

revoke execute on function public.validate_dashboard_resumo_incremental(date, integer) from anon, authenticated, public;
grant execute on function public.validate_dashboard_resumo_incremental(date, integer) to service_role;
