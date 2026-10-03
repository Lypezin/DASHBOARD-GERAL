-- Benchmark attempt on 2026-10-03 UTC. It was deployed for measurement and
-- rolled back because the gain did not hold inside the production RPC. This is
-- not the current function definition; see the audit report before reusing it.
-- Aggregate each source by driver before merging the materialized and
-- incremental datasets. This preserves the RPC contract while reducing the
-- final aggregation input for annual requests from hundreds of thousands of
-- rows to a few thousand driver summaries.
create or replace function public.listar_entregadores_dashboard_fast_v1(
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
  v_pracas text[];
  v_sub_pracas text[];
  v_origens text[];
  v_search text := nullif(btrim(p_search), '');
  v_result jsonb;
begin
  begin
    v_organization_id := nullif(btrim(p_organization_id), '')::uuid;
  exception when others then
    v_organization_id := null;
  end;

  -- Older clients may send only p_ano. Normalize it to the same date range
  -- used by the current frontend so it can use the covering date index.
  if v_data_inicial is null
     and v_data_final is null
     and p_ano between 2000 and 2100 then
    v_data_inicial := make_date(p_ano, 1, 1);
    v_data_final := make_date(p_ano, 12, 31);
  end if;

  if v_organization_id is null
     or v_data_inicial is null
     or v_data_final is null
     or v_data_final < v_data_inicial
     or v_data_final - v_data_inicial > 366
     or coalesce(p_semana, 0) <> 0
     or (p_semanas is not null and cardinality(p_semanas) > 0)
     or coalesce(p_only_dedicados, false)
     or v_search is not null then
    return public.listar_entregadores_v2(
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
  end if;

  if nullif(btrim(p_praca), '') is not null
     and lower(btrim(p_praca)) not in ('todas', 'todos', 'all') then
    select array_agg(btrim(value)) into v_pracas
    from unnest(string_to_array(p_praca, ',')) as selected(value)
    where btrim(selected.value) <> '';
  end if;

  if nullif(btrim(p_sub_praca), '') is not null
     and lower(btrim(p_sub_praca)) not in ('todas', 'todos', 'all') then
    select array_agg(btrim(value)) into v_sub_pracas
    from unnest(string_to_array(p_sub_praca, ',')) as selected(value)
    where btrim(selected.value) <> '';
  end if;

  if nullif(btrim(p_origem), '') is not null
     and lower(btrim(p_origem)) not in ('todas', 'todos', 'all') then
    select array_agg(btrim(value)) into v_origens
    from unnest(string_to_array(p_origem, ',')) as selected(value)
    where btrim(selected.value) <> '';
  end if;

  with incremental_scopes as materialized (
    select distinct
      inc.organization_id,
      inc.data_do_periodo,
      inc.praca,
      inc.sub_praca,
      inc.origem
    from public.tb_entregadores_agregado_incremental inc
    where inc.organization_id = v_organization_id
      and inc.data_do_periodo >= v_data_inicial
      and inc.data_do_periodo <= v_data_final
      and (v_pracas is null or inc.praca = any(v_pracas))
      and (v_sub_pracas is null or inc.sub_praca = any(v_sub_pracas))
      and (v_origens is null or inc.origem = any(v_origens))
  ),
  mv_by_driver as materialized (
    select
      mv.id_entregador,
      max(nullif(btrim(mv.nome_entregador), '')) filter (
        where position(chr(195) in mv.nome_entregador) = 0
          and position(chr(194) in mv.nome_entregador) = 0
      ) as valid_name,
      max(nullif(btrim(mv.nome_entregador), '')) as any_name,
      sum(mv.corridas_ofertadas) as corridas_ofertadas,
      sum(mv.corridas_aceitas) as corridas_aceitas,
      sum(mv.corridas_rejeitadas) as corridas_rejeitadas,
      sum(mv.corridas_completadas) as corridas_completadas,
      sum(mv.total_segundos) as total_segundos
    from public.mv_entregadores_agregado mv
    where mv.organization_id = v_organization_id
      and mv.data_do_periodo >= v_data_inicial
      and mv.data_do_periodo <= v_data_final
      and mv.id_entregador is not null
      and mv.id_entregador <> ''
      and mv.nome_entregador is not null
      and (v_pracas is null or mv.praca = any(v_pracas))
      and (v_sub_pracas is null or mv.sub_praca = any(v_sub_pracas))
      and (v_origens is null or mv.origem = any(v_origens))
      and not exists (
        select 1
        from incremental_scopes scope
        where scope.organization_id = mv.organization_id
          and scope.data_do_periodo = mv.data_do_periodo
          and scope.praca is not distinct from mv.praca
          and scope.sub_praca is not distinct from mv.sub_praca
          and scope.origem is not distinct from mv.origem
      )
    group by mv.id_entregador
  ),
  incremental_by_driver as materialized (
    select
      inc.id_entregador,
      max(nullif(btrim(inc.nome_entregador), '')) filter (
        where position(chr(195) in inc.nome_entregador) = 0
          and position(chr(194) in inc.nome_entregador) = 0
      ) as valid_name,
      max(nullif(btrim(inc.nome_entregador), '')) as any_name,
      sum(inc.corridas_ofertadas) as corridas_ofertadas,
      sum(inc.corridas_aceitas) as corridas_aceitas,
      sum(inc.corridas_rejeitadas) as corridas_rejeitadas,
      sum(inc.corridas_completadas) as corridas_completadas,
      sum(inc.total_segundos) as total_segundos
    from public.tb_entregadores_agregado_incremental inc
    where inc.organization_id = v_organization_id
      and inc.data_do_periodo >= v_data_inicial
      and inc.data_do_periodo <= v_data_final
      and inc.id_entregador is not null
      and inc.id_entregador <> ''
      and inc.nome_entregador is not null
      and (v_pracas is null or inc.praca = any(v_pracas))
      and (v_sub_pracas is null or inc.sub_praca = any(v_sub_pracas))
      and (v_origens is null or inc.origem = any(v_origens))
    group by inc.id_entregador
  ),
  per_driver_parts as (
    select * from mv_by_driver
    union all
    select * from incremental_by_driver
  ),
  aggregated_data as (
    select
      id_entregador,
      coalesce(max(valid_name), max(any_name), id_entregador) as nome_entregador,
      sum(corridas_ofertadas) as corridas_ofertadas,
      sum(corridas_aceitas) as corridas_aceitas,
      sum(corridas_rejeitadas) as corridas_rejeitadas,
      sum(corridas_completadas) as corridas_completadas,
      sum(total_segundos) as total_segundos,
      case when sum(corridas_ofertadas) > 0
        then round((sum(corridas_aceitas)::numeric / nullif(sum(corridas_ofertadas), 0)) * 100, 2)
        else 0
      end as aderencia_percentual,
      case when sum(corridas_ofertadas) > 0
        then round((sum(corridas_rejeitadas)::numeric / nullif(sum(corridas_ofertadas), 0)) * 100, 2)
        else 0
      end as rejeicao_percentual
    from per_driver_parts
    group by id_entregador
  )
  select jsonb_build_object(
    'entregadores', coalesce(
      jsonb_agg(to_jsonb(aggregated_data) order by corridas_completadas desc),
      '[]'::jsonb
    ),
    'total', count(*),
    'periodo_resolvido', jsonb_build_object(
      'ano', p_ano,
      'semana', null,
      'semanas', '[]'::jsonb,
      'auto_semana', false,
      'search', v_search
    )
  )
  into v_result
  from aggregated_data;

  return coalesce(v_result, jsonb_build_object(
    'entregadores', '[]'::jsonb,
    'total', 0,
    'periodo_resolvido', jsonb_build_object(
      'ano', p_ano,
      'semana', null,
      'semanas', '[]'::jsonb,
      'auto_semana', false,
      'search', v_search
    )
  ));
end;
$function$;

revoke all on function public.listar_entregadores_dashboard_fast_v1(
  integer, integer, text, text, text, date, date, text, boolean, text, integer[]
) from public, anon, authenticated;
grant execute on function public.listar_entregadores_dashboard_fast_v1(
  integer, integer, text, text, text, date, date, text, boolean, text, integer[]
) to service_role;
