-- Shadow-mode incremental aggregates for the next heavy MVs.
-- Nothing in the active app reads these tables yet.

create table if not exists public.tb_corridas_agregadas_incremental (
  id bigserial primary key,
  id_entregador text,
  nome_entregador text,
  praca text,
  ano_iso integer not null,
  semana_numero integer not null,
  week_start_date date not null,
  corridas_completadas bigint,
  organization_id uuid not null,
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_tb_corridas_agregadas_incremental_unique
  on public.tb_corridas_agregadas_incremental (
    id_entregador,
    nome_entregador,
    praca,
    ano_iso,
    semana_numero,
    week_start_date,
    organization_id
  ) nulls not distinct;

create index if not exists idx_tb_corridas_agregadas_incremental_scope
  on public.tb_corridas_agregadas_incremental (organization_id, week_start_date, praca);

create table if not exists public.tb_entregadores_agregado_incremental (
  id bigserial primary key,
  id_entregador text,
  nome_entregador text,
  praca text,
  sub_praca text,
  origem text,
  ano_iso integer,
  semana_numero integer,
  data_do_periodo date,
  organization_id uuid not null,
  corridas_ofertadas bigint,
  corridas_aceitas bigint,
  corridas_rejeitadas bigint,
  corridas_completadas bigint,
  total_segundos numeric,
  soma_taxas_aceitas numeric,
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_tb_entregadores_agregado_incremental_unique
  on public.tb_entregadores_agregado_incremental (
    id_entregador,
    praca,
    sub_praca,
    origem,
    ano_iso,
    semana_numero,
    data_do_periodo,
    organization_id
  ) nulls not distinct;

create index if not exists idx_tb_entregadores_agregado_incremental_scope
  on public.tb_entregadores_agregado_incremental (
    organization_id,
    data_do_periodo,
    praca,
    sub_praca,
    origem
  );

create index if not exists idx_mv_refresh_impacts_corridas_pending
  on public.mv_refresh_impacts (corridas_agregadas_processed_at, id)
  where corridas_agregadas_processed_at is null;

create index if not exists idx_mv_refresh_impacts_entregadores_pending
  on public.mv_refresh_impacts (entregadores_agregado_processed_at, id)
  where entregadores_agregado_processed_at is null;

create or replace function public.refresh_corridas_agregadas_incremental(p_limit integer default 500)
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
  if not pg_try_advisory_xact_lock(hashtextextended('refresh_incremental:corridas_agregadas', 0)) then
    return json_build_object(
      'success', true,
      'skipped', true,
      'reason', 'corridas incremental refresh already running'
    );
  end if;

  drop table if exists pg_temp.tmp_corridas_agregadas_impacts;

  create temporary table tmp_corridas_agregadas_impacts (
    id bigint primary key,
    organization_id uuid not null,
    week_start_date date not null,
    praca text
  ) on commit drop;

  insert into tmp_corridas_agregadas_impacts (
    id,
    organization_id,
    week_start_date,
    praca
  )
  select
    id,
    organization_id,
    week_start_date,
    praca
  from public.mv_refresh_impacts
  where source = 'corridas'
    and corridas_agregadas_processed_at is null
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

  delete from public.tb_corridas_agregadas_incremental t
  using (
    select distinct organization_id, week_start_date, praca
    from tmp_corridas_agregadas_impacts
  ) i
  where t.organization_id = i.organization_id
    and t.week_start_date = i.week_start_date
    and t.praca is not distinct from i.praca;

  get diagnostics v_deleted_count = row_count;

  with affected as (
    select distinct organization_id, week_start_date, praca
    from tmp_corridas_agregadas_impacts
  ), upserted as (
    insert into public.tb_corridas_agregadas_incremental (
      id_entregador,
      nome_entregador,
      praca,
      ano_iso,
      semana_numero,
      week_start_date,
      corridas_completadas,
      organization_id,
      updated_at
    )
    select
      d.id_da_pessoa_entregadora,
      d.pessoa_entregadora,
      d.praca,
      extract(isoyear from d.data_do_periodo)::integer,
      extract(week from d.data_do_periodo)::integer,
      date_trunc('week', d.data_do_periodo::timestamp with time zone)::date,
      sum(d.numero_de_corridas_completadas),
      d.organization_id,
      now()
    from public.dados_corridas d
    join affected a
      on d.organization_id = a.organization_id
     and d.data_do_periodo >= a.week_start_date
     and d.data_do_periodo < (a.week_start_date + interval '7 days')
     and d.praca is not distinct from a.praca
    where d.id_da_pessoa_entregadora is not null
      and d.data_do_periodo is not null
    group by
      d.id_da_pessoa_entregadora,
      d.pessoa_entregadora,
      d.praca,
      extract(isoyear from d.data_do_periodo)::integer,
      extract(week from d.data_do_periodo)::integer,
      date_trunc('week', d.data_do_periodo::timestamp with time zone)::date,
      d.organization_id
    on conflict (
      id_entregador,
      nome_entregador,
      praca,
      ano_iso,
      semana_numero,
      week_start_date,
      organization_id
    )
    do update set
      corridas_completadas = excluded.corridas_completadas,
      updated_at = now()
    returning 1
  )
  select count(*) into v_upserted_count from upserted;

  update public.mv_refresh_impacts i
  set corridas_agregadas_processed_at = now(),
      updated_at = now()
  from tmp_corridas_agregadas_impacts b
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

create or replace function public.refresh_entregadores_agregado_incremental(p_limit integer default 500)
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
  if not pg_try_advisory_xact_lock(hashtextextended('refresh_incremental:entregadores_agregado', 0)) then
    return json_build_object(
      'success', true,
      'skipped', true,
      'reason', 'entregadores incremental refresh already running'
    );
  end if;

  drop table if exists pg_temp.tmp_entregadores_agregado_impacts;

  create temporary table tmp_entregadores_agregado_impacts (
    id bigint primary key,
    organization_id uuid not null,
    data_do_periodo date not null,
    praca text,
    sub_praca text,
    origem text
  ) on commit drop;

  insert into tmp_entregadores_agregado_impacts (
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
    and entregadores_agregado_processed_at is null
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

  delete from public.tb_entregadores_agregado_incremental t
  using tmp_entregadores_agregado_impacts i
  where t.organization_id = i.organization_id
    and t.data_do_periodo = i.data_do_periodo
    and t.praca is not distinct from i.praca
    and t.sub_praca is not distinct from i.sub_praca
    and t.origem is not distinct from i.origem;

  get diagnostics v_deleted_count = row_count;

  with affected as (
    select distinct organization_id, data_do_periodo, praca, sub_praca, origem
    from tmp_entregadores_agregado_impacts
  ), upserted as (
    insert into public.tb_entregadores_agregado_incremental (
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
      total_segundos,
      soma_taxas_aceitas,
      updated_at
    )
    select
      d.id_da_pessoa_entregadora,
      d.pessoa_entregadora,
      d.praca,
      d.sub_praca,
      d.origem,
      d.ano_iso,
      d.semana_numero,
      d.data_do_periodo,
      d.organization_id,
      sum(d.numero_de_corridas_ofertadas),
      sum(d.numero_de_corridas_aceitas),
      sum(d.numero_de_corridas_rejeitadas),
      sum(d.numero_de_corridas_completadas),
      sum(d.tempo_disponivel_absoluto_segundos),
      sum(d.soma_das_taxas_das_corridas_aceitas),
      now()
    from public.dados_corridas d
    join affected a
      on d.organization_id = a.organization_id
     and d.data_do_periodo = a.data_do_periodo
     and d.praca is not distinct from a.praca
     and d.sub_praca is not distinct from a.sub_praca
     and d.origem is not distinct from a.origem
    where d.pessoa_entregadora is not null
    group by
      d.id_da_pessoa_entregadora,
      d.pessoa_entregadora,
      d.praca,
      d.sub_praca,
      d.origem,
      d.ano_iso,
      d.semana_numero,
      d.data_do_periodo,
      d.organization_id
    on conflict (
      id_entregador,
      praca,
      sub_praca,
      origem,
      ano_iso,
      semana_numero,
      data_do_periodo,
      organization_id
    )
    do update set
      nome_entregador = excluded.nome_entregador,
      corridas_ofertadas = excluded.corridas_ofertadas,
      corridas_aceitas = excluded.corridas_aceitas,
      corridas_rejeitadas = excluded.corridas_rejeitadas,
      corridas_completadas = excluded.corridas_completadas,
      total_segundos = excluded.total_segundos,
      soma_taxas_aceitas = excluded.soma_taxas_aceitas,
      updated_at = now()
    returning 1
  )
  select count(*) into v_upserted_count from upserted;

  update public.mv_refresh_impacts i
  set entregadores_agregado_processed_at = now(),
      updated_at = now()
  from tmp_entregadores_agregado_impacts b
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

create or replace function public.validate_corridas_agregadas_incremental(p_since date default null, p_limit integer default 2000)
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
      id_entregador,
      nome_entregador,
      praca,
      ano_iso,
      semana_numero,
      week_start_date,
      organization_id
    from public.tb_corridas_agregadas_incremental
    where p_since is null or week_start_date >= p_since
    order by week_start_date desc
    limit v_limit
  ), shadow_rows as (
    select
      t.id_entregador,
      t.nome_entregador,
      t.praca,
      t.ano_iso,
      t.semana_numero,
      t.week_start_date,
      t.corridas_completadas,
      t.organization_id
    from public.tb_corridas_agregadas_incremental t
    join keys k
      on t.id_entregador is not distinct from k.id_entregador
     and t.nome_entregador is not distinct from k.nome_entregador
     and t.praca is not distinct from k.praca
     and t.ano_iso is not distinct from k.ano_iso
     and t.semana_numero is not distinct from k.semana_numero
     and t.week_start_date is not distinct from k.week_start_date
     and t.organization_id is not distinct from k.organization_id
  ), live_rows as (
    select
      mv.id_entregador,
      mv.nome_entregador,
      mv.praca,
      mv.ano_iso,
      mv.semana_numero,
      mv.week_start_date,
      mv.corridas_completadas,
      mv.organization_id
    from public.mv_corridas_agregadas mv
    join keys k
      on mv.id_entregador is not distinct from k.id_entregador
     and mv.nome_entregador is not distinct from k.nome_entregador
     and mv.praca is not distinct from k.praca
     and mv.ano_iso is not distinct from k.ano_iso
     and mv.semana_numero is not distinct from k.semana_numero
     and mv.week_start_date is not distinct from k.week_start_date
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

create or replace function public.validate_entregadores_agregado_incremental(p_since date default null, p_limit integer default 2000)
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
      id_entregador,
      praca,
      sub_praca,
      origem,
      ano_iso,
      semana_numero,
      data_do_periodo,
      organization_id
    from public.tb_entregadores_agregado_incremental
    where p_since is null or data_do_periodo >= p_since
    order by data_do_periodo desc
    limit v_limit
  ), shadow_rows as (
    select
      t.id_entregador,
      t.nome_entregador,
      t.praca,
      t.sub_praca,
      t.origem,
      t.ano_iso,
      t.semana_numero,
      t.data_do_periodo,
      t.organization_id,
      t.corridas_ofertadas,
      t.corridas_aceitas,
      t.corridas_rejeitadas,
      t.corridas_completadas,
      t.total_segundos,
      t.soma_taxas_aceitas
    from public.tb_entregadores_agregado_incremental t
    join keys k
      on t.id_entregador is not distinct from k.id_entregador
     and t.praca is not distinct from k.praca
     and t.sub_praca is not distinct from k.sub_praca
     and t.origem is not distinct from k.origem
     and t.ano_iso is not distinct from k.ano_iso
     and t.semana_numero is not distinct from k.semana_numero
     and t.data_do_periodo is not distinct from k.data_do_periodo
     and t.organization_id is not distinct from k.organization_id
  ), live_rows as (
    select
      mv.id_entregador,
      mv.nome_entregador,
      mv.praca,
      mv.sub_praca,
      mv.origem,
      mv.ano_iso,
      mv.semana_numero,
      mv.data_do_periodo,
      mv.organization_id,
      mv.corridas_ofertadas,
      mv.corridas_aceitas,
      mv.corridas_rejeitadas,
      mv.corridas_completadas,
      mv.total_segundos,
      mv.soma_taxas_aceitas
    from public.mv_entregadores_agregado mv
    join keys k
      on mv.id_entregador is not distinct from k.id_entregador
     and mv.praca is not distinct from k.praca
     and mv.sub_praca is not distinct from k.sub_praca
     and mv.origem is not distinct from k.origem
     and mv.ano_iso is not distinct from k.ano_iso
     and mv.semana_numero is not distinct from k.semana_numero
     and mv.data_do_periodo is not distinct from k.data_do_periodo
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

revoke all on public.tb_corridas_agregadas_incremental from anon, authenticated, public;
revoke all on public.tb_entregadores_agregado_incremental from anon, authenticated, public;
grant select, insert, update, delete on public.tb_corridas_agregadas_incremental to service_role;
grant select, insert, update, delete on public.tb_entregadores_agregado_incremental to service_role;
grant usage, select on sequence public.tb_corridas_agregadas_incremental_id_seq to service_role;
grant usage, select on sequence public.tb_entregadores_agregado_incremental_id_seq to service_role;

revoke execute on function public.refresh_corridas_agregadas_incremental(integer) from anon, authenticated, public;
revoke execute on function public.refresh_entregadores_agregado_incremental(integer) from anon, authenticated, public;
revoke execute on function public.validate_corridas_agregadas_incremental(date, integer) from anon, authenticated, public;
revoke execute on function public.validate_entregadores_agregado_incremental(date, integer) from anon, authenticated, public;

grant execute on function public.refresh_corridas_agregadas_incremental(integer) to service_role;
grant execute on function public.refresh_entregadores_agregado_incremental(integer) to service_role;
grant execute on function public.validate_corridas_agregadas_incremental(date, integer) to service_role;
grant execute on function public.validate_entregadores_agregado_incremental(date, integer) to service_role;
