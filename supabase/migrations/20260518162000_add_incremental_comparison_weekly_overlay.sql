-- Keep Marketing comparison current after uploads without forcing the full MV
-- refresh path. The physical MV remains the baseline; recent impacted weeks are
-- overlaid from a small incremental table.

alter table public.mv_refresh_impacts
  add column if not exists comparison_weekly_processed_at timestamptz;

update public.mv_refresh_impacts
set comparison_weekly_processed_at = coalesce(updated_at, now())
where comparison_weekly_processed_at is null
  and dashboard_resumo_processed_at is not null
  and entregadores_agregado_processed_at is not null
  and corridas_agregadas_processed_at is not null;

create index if not exists idx_mv_refresh_impacts_comparison_pending
  on public.mv_refresh_impacts (comparison_weekly_processed_at, id)
  where comparison_weekly_processed_at is null;

create table if not exists public.tb_comparison_weekly_incremental (
  id bigserial primary key,
  ano_iso integer not null,
  semana_numero integer not null,
  id_da_pessoa_entregadora text,
  organization_id uuid,
  praca text,
  is_marketing boolean not null default false,
  total_segundos numeric not null default 0,
  total_ofertadas bigint not null default 0,
  total_aceitas bigint not null default 0,
  total_concluidas bigint not null default 0,
  total_rejeitadas bigint not null default 0,
  total_taxas_centavos numeric not null default 0,
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_tb_comparison_weekly_incremental_unique
  on public.tb_comparison_weekly_incremental (
    ano_iso,
    semana_numero,
    id_da_pessoa_entregadora,
    organization_id,
    praca,
    is_marketing
  ) nulls not distinct;

create index if not exists idx_tb_comparison_weekly_incremental_scope
  on public.tb_comparison_weekly_incremental (
    organization_id,
    ano_iso,
    semana_numero,
    praca
  );

do $$
declare
  v_def text;
begin
  select pg_get_functiondef('public.insert_dados_corridas_batch(jsonb[])'::regprocedure)
    into v_def;

  if v_def is not null and v_def not ilike '%comparison_weekly_processed_at = null%' then
    v_def := replace(
      v_def,
      'aderencia_agregada_processed_at = null,
            updated_at = now()',
      'aderencia_agregada_processed_at = null,
            comparison_weekly_processed_at = null,
            updated_at = now()'
    );

    execute v_def;
  end if;
end $$;

create or replace function public.refresh_comparison_weekly_incremental(p_limit integer default 500)
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
  if not pg_try_advisory_xact_lock(hashtextextended('refresh_incremental:comparison_weekly', 0)) then
    return json_build_object(
      'success', true,
      'skipped', true,
      'reason', 'comparison weekly incremental refresh already running'
    );
  end if;

  drop table if exists pg_temp.tmp_comparison_weekly_impacts;

  create temporary table tmp_comparison_weekly_impacts (
    id bigint primary key,
    organization_id uuid not null,
    ano_iso integer not null,
    semana_numero integer not null,
    week_start_date date not null,
    praca text
  ) on commit drop;

  insert into tmp_comparison_weekly_impacts (
    id,
    organization_id,
    ano_iso,
    semana_numero,
    week_start_date,
    praca
  )
  select
    id,
    organization_id,
    ano_iso,
    semana_numero,
    week_start_date,
    praca
  from public.mv_refresh_impacts
  where source = 'corridas'
    and comparison_weekly_processed_at is null
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

  delete from public.tb_comparison_weekly_incremental t
  using (
    select distinct organization_id, ano_iso, semana_numero, praca
    from tmp_comparison_weekly_impacts
  ) i
  where t.organization_id is not distinct from i.organization_id
    and t.ano_iso = i.ano_iso
    and t.semana_numero = i.semana_numero
    and t.praca is not distinct from i.praca;

  get diagnostics v_deleted_count = row_count;

  with affected as (
    select distinct organization_id, ano_iso, semana_numero, week_start_date, praca
    from tmp_comparison_weekly_impacts
  ), marketing_entregadores as materialized (
    select distinct id_entregador, organization_id
    from public.dados_marketing
    where id_entregador is not null
      and data_liberacao is not null
  ), upserted as (
    insert into public.tb_comparison_weekly_incremental (
      ano_iso,
      semana_numero,
      id_da_pessoa_entregadora,
      organization_id,
      praca,
      is_marketing,
      total_segundos,
      total_ofertadas,
      total_aceitas,
      total_concluidas,
      total_rejeitadas,
      total_taxas_centavos,
      updated_at
    )
    select
      d.ano_iso,
      d.semana_numero,
      d.id_da_pessoa_entregadora,
      d.organization_id,
      d.praca,
      bool_or(me.id_entregador is not null) as is_marketing,
      sum(coalesce(d.tempo_disponivel_absoluto_segundos, 0::numeric)),
      sum(coalesce(d.numero_de_corridas_ofertadas, 0))::bigint,
      sum(coalesce(d.numero_de_corridas_aceitas, 0))::bigint,
      sum(coalesce(d.numero_de_corridas_completadas, 0))::bigint,
      sum(coalesce(d.numero_de_corridas_rejeitadas, 0))::bigint,
      sum(coalesce(d.soma_das_taxas_das_corridas_aceitas, 0::numeric)),
      now()
    from public.dados_corridas d
    join affected a
      on d.organization_id is not distinct from a.organization_id
     and d.ano_iso = a.ano_iso
     and d.semana_numero = a.semana_numero
     and d.praca is not distinct from a.praca
    left join marketing_entregadores me
      on me.id_entregador = d.id_da_pessoa_entregadora
     and (d.organization_id is null or me.organization_id = d.organization_id)
    where d.id_da_pessoa_entregadora is not null
      and d.data_do_periodo is not null
    group by
      d.ano_iso,
      d.semana_numero,
      d.id_da_pessoa_entregadora,
      d.organization_id,
      d.praca
    on conflict (
      ano_iso,
      semana_numero,
      id_da_pessoa_entregadora,
      organization_id,
      praca,
      is_marketing
    )
    do update set
      total_segundos = excluded.total_segundos,
      total_ofertadas = excluded.total_ofertadas,
      total_aceitas = excluded.total_aceitas,
      total_concluidas = excluded.total_concluidas,
      total_rejeitadas = excluded.total_rejeitadas,
      total_taxas_centavos = excluded.total_taxas_centavos,
      updated_at = now()
    returning 1
  )
  select count(*) into v_upserted_count from upserted;

  update public.mv_refresh_impacts i
  set comparison_weekly_processed_at = now(),
      updated_at = now()
  from tmp_comparison_weekly_impacts b
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

create or replace view public.vw_comparison_weekly_current as
with incremental_scopes as materialized (
  select distinct
    organization_id,
    ano_iso,
    semana_numero,
    praca
  from public.tb_comparison_weekly_incremental
)
select
  mv.ano_iso,
  mv.semana_numero,
  mv.id_da_pessoa_entregadora,
  mv.organization_id,
  mv.praca,
  mv.is_marketing,
  mv.total_segundos,
  mv.total_ofertadas,
  mv.total_aceitas,
  mv.total_concluidas,
  mv.total_rejeitadas,
  mv.total_taxas_centavos
from public.mv_comparison_weekly mv
where not exists (
  select 1
  from incremental_scopes s
  where s.organization_id is not distinct from mv.organization_id
    and s.ano_iso = mv.ano_iso
    and s.semana_numero = mv.semana_numero
    and s.praca is not distinct from mv.praca
)
union all
select
  t.ano_iso,
  t.semana_numero,
  t.id_da_pessoa_entregadora,
  t.organization_id,
  t.praca,
  t.is_marketing,
  t.total_segundos,
  t.total_ofertadas,
  t.total_aceitas,
  t.total_concluidas,
  t.total_rejeitadas,
  t.total_taxas_centavos
from public.tb_comparison_weekly_incremental t;

create or replace function public.get_marketing_comparison_weekly(
  data_inicial date default current_date,
  data_final date default current_date,
  p_organization_id uuid default null,
  p_praca text default null
)
returns table(
  semana_iso text,
  segundos_ops bigint,
  segundos_mkt bigint,
  ofertadas_ops bigint,
  ofertadas_mkt bigint,
  aceitas_ops bigint,
  aceitas_mkt bigint,
  concluidas_ops bigint,
  concluidas_mkt bigint,
  rejeitadas_ops bigint,
  rejeitadas_mkt bigint,
  valor_ops numeric,
  valor_mkt numeric,
  entregadores_ops bigint,
  entregadores_mkt bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_praca text;
  v_ano_inicio integer;
  v_ano_fim integer;
  v_semana_inicio integer;
  v_semana_fim integer;
begin
  v_praca := nullif(nullif(nullif(p_praca, 'null'), 'undefined'), '');
  if v_praca is not null then
    v_praca := upper(trim(v_praca));
  end if;

  v_ano_inicio := extract(isoyear from data_inicial)::integer;
  v_ano_fim := extract(isoyear from data_final)::integer;
  v_semana_inicio := extract(week from data_inicial)::integer;
  v_semana_fim := extract(week from data_final)::integer;

  return query
  select
    mv.ano_iso || '-W' || lpad(mv.semana_numero::text, 2, '0'),
    sum(case when not mv.is_marketing then mv.total_segundos else 0 end)::bigint,
    sum(case when mv.is_marketing then mv.total_segundos else 0 end)::bigint,
    sum(case when not mv.is_marketing then mv.total_ofertadas else 0 end)::bigint,
    sum(case when mv.is_marketing then mv.total_ofertadas else 0 end)::bigint,
    sum(case when not mv.is_marketing then mv.total_aceitas else 0 end)::bigint,
    sum(case when mv.is_marketing then mv.total_aceitas else 0 end)::bigint,
    sum(case when not mv.is_marketing then mv.total_concluidas else 0 end)::bigint,
    sum(case when mv.is_marketing then mv.total_concluidas else 0 end)::bigint,
    sum(case when not mv.is_marketing then mv.total_rejeitadas else 0 end)::bigint,
    sum(case when mv.is_marketing then mv.total_rejeitadas else 0 end)::bigint,
    round((sum(case when not mv.is_marketing then mv.total_taxas_centavos else 0 end) / 100.0)::numeric, 2),
    round((sum(case when mv.is_marketing then mv.total_taxas_centavos else 0 end) / 100.0)::numeric, 2),
    count(distinct case when not mv.is_marketing then mv.id_da_pessoa_entregadora end)::bigint,
    count(distinct case when mv.is_marketing then mv.id_da_pessoa_entregadora end)::bigint
  from public.vw_comparison_weekly_current mv
  where mv.ano_iso between v_ano_inicio and v_ano_fim
    and (p_organization_id is null or mv.organization_id = p_organization_id)
    and (v_praca is null or mv.praca = v_praca)
    and not (mv.ano_iso = v_ano_inicio and mv.semana_numero < v_semana_inicio)
    and not (mv.ano_iso = v_ano_fim and mv.semana_numero > v_semana_fim)
  group by mv.ano_iso, mv.semana_numero
  order by 1;
end;
$function$;

create or replace function public.process_incremental_refresh_impacts(
  p_limit integer default 500,
  p_include_corridas boolean default true
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 500), 5000));
  v_dashboard_result json;
  v_entregadores_result json;
  v_comparison_result json;
  v_corridas_result json := null;
  v_pending_dashboard integer := 0;
  v_pending_entregadores integer := 0;
  v_pending_comparison integer := 0;
  v_pending_corridas integer := 0;
  v_started_at timestamptz := clock_timestamp();
begin
  if not pg_try_advisory_xact_lock(hashtextextended('refresh_incremental:processor', 0)) then
    return json_build_object(
      'success', true,
      'skipped', true,
      'reason', 'incremental processor already running'
    );
  end if;

  v_dashboard_result := public.refresh_dashboard_resumo_incremental(v_limit);
  v_entregadores_result := public.refresh_entregadores_agregado_incremental(v_limit);
  v_comparison_result := public.refresh_comparison_weekly_incremental(v_limit);

  if p_include_corridas then
    v_corridas_result := public.refresh_corridas_agregadas_incremental(v_limit);
  end if;

  select
    count(*) filter (where dashboard_resumo_processed_at is null),
    count(*) filter (where entregadores_agregado_processed_at is null),
    count(*) filter (where comparison_weekly_processed_at is null),
    count(*) filter (where corridas_agregadas_processed_at is null)
  into
    v_pending_dashboard,
    v_pending_entregadores,
    v_pending_comparison,
    v_pending_corridas
  from public.mv_refresh_impacts
  where source = 'corridas';

  return json_build_object(
    'success', coalesce((v_dashboard_result->>'success')::boolean, false)
      and coalesce((v_entregadores_result->>'success')::boolean, false)
      and coalesce((v_comparison_result->>'success')::boolean, false)
      and (not p_include_corridas or coalesce((v_corridas_result->>'success')::boolean, false)),
    'dashboard_result', v_dashboard_result,
    'entregadores_result', v_entregadores_result,
    'comparison_result', v_comparison_result,
    'corridas_result', v_corridas_result,
    'pending', json_build_object(
      'dashboard_resumo', v_pending_dashboard,
      'entregadores_agregado', v_pending_entregadores,
      'comparison_weekly', v_pending_comparison,
      'corridas_agregadas', v_pending_corridas
    ),
    'duration_ms', round(extract(epoch from clock_timestamp() - v_started_at) * 1000)
  );
end;
$function$;

create or replace function public.process_incremental_refresh_impacts_job()
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  job_name constant text := 'incremental-refresh-impacts-on-demand';
  result json;
  pending_count integer;
  unscheduled_count integer := 0;
begin
  result := public.process_incremental_refresh_impacts(10, true);

  select count(*)
  into pending_count
  from public.mv_refresh_impacts
  where dashboard_resumo_processed_at is null
     or entregadores_agregado_processed_at is null
     or comparison_weekly_processed_at is null
     or corridas_agregadas_processed_at is null;

  if pending_count = 0 then
    with removed as (
      select cron.unschedule(jobid) as ok
      from cron.job
      where jobname = job_name
    )
    select count(*) filter (where ok) into unscheduled_count from removed;
  end if;

  return json_build_object(
    'success', true,
    'result', result,
    'pending_count', pending_count,
    'unscheduled_count', unscheduled_count
  );
end;
$function$;

create or replace function public.ensure_incremental_refresh_worker_scheduled()
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  job_name constant text := 'incremental-refresh-impacts-on-demand';
  pending_count integer;
  existing_job_id bigint;
  new_job_id bigint;
begin
  select count(*)
  into pending_count
  from public.mv_refresh_impacts
  where dashboard_resumo_processed_at is null
     or entregadores_agregado_processed_at is null
     or comparison_weekly_processed_at is null
     or corridas_agregadas_processed_at is null;

  if pending_count = 0 then
    return json_build_object(
      'success', true,
      'scheduled', false,
      'reason', 'no_pending_impacts',
      'pending_count', pending_count
    );
  end if;

  select jobid
  into existing_job_id
  from cron.job
  where jobname = job_name
  limit 1;

  if existing_job_id is not null then
    return json_build_object(
      'success', true,
      'scheduled', true,
      'already_scheduled', true,
      'jobid', existing_job_id,
      'pending_count', pending_count
    );
  end if;

  new_job_id := cron.schedule(
    job_name,
    '* * * * *',
    'set statement_timeout = ''5min''; select public.process_incremental_refresh_impacts_job();'
  );

  return json_build_object(
    'success', true,
    'scheduled', true,
    'already_scheduled', false,
    'jobid', new_job_id,
    'pending_count', pending_count
  );
end;
$function$;

create or replace function public.get_mv_refresh_queue_state()
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  full_pending_count integer;
  full_in_progress_count integer;
  incremental_dashboard_pending integer;
  incremental_entregadores_pending integer;
  incremental_comparison_pending integer;
  incremental_corridas_pending integer;
  incremental_pending_count integer;
  full_worker_job_id bigint;
  incremental_worker_job_id bigint;
begin
  select
    count(*) filter (where needs_refresh = true),
    count(*) filter (where refresh_in_progress = true)
  into full_pending_count, full_in_progress_count
  from public.mv_refresh_control;

  select
    count(*) filter (where dashboard_resumo_processed_at is null),
    count(*) filter (where entregadores_agregado_processed_at is null),
    count(*) filter (where comparison_weekly_processed_at is null),
    count(*) filter (where corridas_agregadas_processed_at is null)
  into
    incremental_dashboard_pending,
    incremental_entregadores_pending,
    incremental_comparison_pending,
    incremental_corridas_pending
  from public.mv_refresh_impacts
  where source = 'corridas';

  incremental_pending_count := greatest(
    incremental_dashboard_pending,
    incremental_entregadores_pending,
    incremental_comparison_pending,
    incremental_corridas_pending
  );

  select jobid
  into full_worker_job_id
  from cron.job
  where jobname = 'refresh-pending-mvs-on-demand'
  limit 1;

  select jobid
  into incremental_worker_job_id
  from cron.job
  where jobname = 'incremental-refresh-impacts-on-demand'
  limit 1;

  return json_build_object(
    'success', true,
    'full_pending_count', full_pending_count,
    'full_in_progress_count', full_in_progress_count,
    'incremental_pending_count', incremental_pending_count,
    'incremental_dashboard_pending', incremental_dashboard_pending,
    'incremental_entregadores_pending', incremental_entregadores_pending,
    'incremental_comparison_pending', incremental_comparison_pending,
    'incremental_corridas_pending', incremental_corridas_pending,
    'full_worker_scheduled', full_worker_job_id is not null,
    'full_worker_job_id', full_worker_job_id,
    'incremental_worker_scheduled', incremental_worker_job_id is not null,
    'incremental_worker_job_id', incremental_worker_job_id
  );
end;
$function$;

revoke all on public.tb_comparison_weekly_incremental from anon, authenticated, public;
revoke all on public.vw_comparison_weekly_current from anon, authenticated, public;
grant select, insert, update, delete on public.tb_comparison_weekly_incremental to service_role;
grant usage, select on sequence public.tb_comparison_weekly_incremental_id_seq to service_role;
grant select on public.vw_comparison_weekly_current to service_role;

revoke execute on function public.refresh_comparison_weekly_incremental(integer) from anon, authenticated, public;
grant execute on function public.refresh_comparison_weekly_incremental(integer) to service_role;

revoke execute on function public.process_incremental_refresh_impacts(integer, boolean) from anon, authenticated, public;
revoke execute on function public.process_incremental_refresh_impacts_job() from anon, authenticated, public;
revoke execute on function public.ensure_incremental_refresh_worker_scheduled() from anon, authenticated, public;
revoke execute on function public.get_mv_refresh_queue_state() from anon, authenticated, public;

grant execute on function public.process_incremental_refresh_impacts(integer, boolean) to service_role;
grant execute on function public.process_incremental_refresh_impacts_job() to service_role;
grant execute on function public.ensure_incremental_refresh_worker_scheduled() to service_role;
grant execute on function public.get_mv_refresh_queue_state() to service_role;
