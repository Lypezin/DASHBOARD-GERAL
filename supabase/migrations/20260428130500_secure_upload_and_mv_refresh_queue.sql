create or replace function public.insert_dados_corridas_batch(dados jsonb[])
returns json
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
    inserted_count integer := 0;
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
        returning 1
    )
    select count(*) into inserted_count from inserted;

    return json_build_object(
        'success', true,
        'inserted', inserted_count,
        'errors', 0,
        'error_messages', array[]::text[]
    );
exception when others then
    return json_build_object(
        'success', false,
        'inserted', 0,
        'errors', 1,
        'error_messages', array[sqlerrm]
    );
end;
$function$;

create or replace function public.enqueue_mv_refresh(include_secondary boolean default true, reason text default 'manual')
returns json
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  marked_count integer;
begin
  update public.mv_refresh_control
  set needs_refresh = true,
      updated_at = now()
  where include_secondary = true
     or mv_name = any(array[
       'mv_corridas_agregadas',
       'mv_dashboard_resumo',
       'mv_utr_stats',
       'mv_entregadores_agregado',
       'mv_dashboard_aderencia_metricas',
       'mv_aderencia_agregada',
       'mv_comparison_weekly',
       'mv_entregadores_ativacao',
       'mv_entregadores_summary'
     ]);

  get diagnostics marked_count = row_count;

  return json_build_object(
    'success', true,
    'marked', marked_count,
    'include_secondary', include_secondary,
    'reason', reason
  );
end;
$function$;

create or replace function public.refresh_mvs_after_bulk_insert(delay_seconds integer default 300)
returns text
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  result json;
begin
  result := public.enqueue_mv_refresh(true, 'bulk_insert');

  return format(
    'Marcadas %s MVs para refresh em fila. O worker automatico processara uma MV por vez.',
    coalesce((result->>'marked')::integer, 0)
  );
end;
$function$;

create or replace function public.get_pending_mvs()
returns table(mv_name text, priority integer, needs_refresh boolean, last_refresh timestamp with time zone)
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
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

create or replace function public.refresh_next_pending_mv(max_priority integer default 200)
returns json
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
set statement_timeout to '0'
as $function$
declare
  mv_record record;
  active_refresh_count integer;
  active_upload_count integer;
  refresh_result json;
begin
  if not pg_try_advisory_xact_lock(hashtextextended('refresh_mv:global', 0)) then
    return json_build_object(
      'success', true,
      'skipped', true,
      'reason', 'another refresh is already running'
    );
  end if;

  select count(*)
  into active_refresh_count
  from public.mv_refresh_control
  where needs_refresh = true
    and coalesce(refresh_in_progress, false) = true;

  if active_refresh_count > 0 then
    return json_build_object(
      'success', true,
      'skipped', true,
      'reason', 'another refresh is already marked as running',
      'active_refresh_count', active_refresh_count
    );
  end if;

  select count(*)
  into active_upload_count
  from pg_stat_activity
  where datname = current_database()
    and pid <> pg_backend_pid()
    and state <> 'idle'
    and query like '%insert_dados_corridas_batch%';

  if active_upload_count > 0 then
    return json_build_object(
      'success', true,
      'skipped', true,
      'reason', 'upload batch is currently running',
      'active_upload_count', active_upload_count
    );
  end if;

  select pending.mv_name, pending.priority
  into mv_record
  from public.get_pending_mvs() pending
  join public.mv_refresh_control mrc on mrc.mv_name = pending.mv_name
  where pending.priority <= max_priority
    and coalesce(mrc.refresh_in_progress, false) = false
  order by pending.priority, pending.mv_name
  limit 1;

  if mv_record.mv_name is null then
    return json_build_object(
      'success', true,
      'skipped', true,
      'reason', 'no pending materialized views',
      'max_priority', max_priority
    );
  end if;

  refresh_result := public.refresh_single_mv(mv_record.mv_name, false);

  return json_build_object(
    'success', coalesce((refresh_result->>'success')::boolean, false),
    'mv_name', mv_record.mv_name,
    'priority', mv_record.priority,
    'result', refresh_result
  );
end;
$function$;

create or replace function public.refresh_mvs_prioritized(refresh_critical_only boolean default false)
returns json
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
set statement_timeout to '0'
as $function$
declare
  queue_result json;
begin
  queue_result := public.enqueue_mv_refresh(not refresh_critical_only, 'prioritized_rpc');
  return json_build_object(
    'success', true,
    'queued', true,
    'critical_only', refresh_critical_only,
    'queue_result', queue_result
  );
end;
$function$;

do $do$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = 'refresh-pending-mvs-after-upload'
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'refresh-pending-mvs-after-upload',
    '*/2 * * * *',
    'set statement_timeout = 0; select public.refresh_next_pending_mv(200);'
  );
end;
$do$;

do $do$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
  loop
    execute format('revoke execute on function %s from public', fn.signature);
    execute format('revoke execute on function %s from anon', fn.signature);
    execute format('grant execute on function %s to authenticated', fn.signature);
    execute format('grant execute on function %s to service_role', fn.signature);
  end loop;
end;
$do$;

revoke execute on function public.insert_dados_corridas_batch(jsonb[]) from authenticated;
revoke execute on function public.enqueue_mv_refresh(boolean, text) from authenticated;
revoke execute on function public.refresh_next_pending_mv(integer) from authenticated;
revoke execute on function public.refresh_single_mv(text, boolean) from authenticated;
revoke execute on function public.refresh_single_mv_with_progress(text) from authenticated;
revoke execute on function public.refresh_mvs_prioritized(boolean) from authenticated;
revoke execute on function public.refresh_mvs_after_bulk_insert(integer) from authenticated;
revoke execute on function public.retry_failed_mvs(text[]) from authenticated;
revoke execute on function public.refresh_pending_mvs() from authenticated;
revoke execute on function public.refresh_pending_mvs_if_needed() from authenticated;
revoke execute on function public.refresh_all_mvs_button() from authenticated;
revoke execute on function public.refresh_all_mvs_manual() from authenticated;
revoke execute on function public.refresh_all_mvs_optimized() from authenticated;
revoke execute on function public.refresh_critical_mvs_now() from authenticated;

grant execute on function public.insert_dados_corridas_batch(jsonb[]) to service_role;
grant execute on function public.enqueue_mv_refresh(boolean, text) to service_role;
grant execute on function public.refresh_next_pending_mv(integer) to service_role;
grant execute on function public.refresh_single_mv(text, boolean) to service_role;
grant execute on function public.refresh_mvs_after_bulk_insert(integer) to service_role;
grant execute on function public.get_pending_mvs() to service_role;

notify pgrst, 'reload schema';
