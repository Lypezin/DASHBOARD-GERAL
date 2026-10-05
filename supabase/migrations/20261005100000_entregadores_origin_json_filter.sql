-- Preserve selected origin names that contain commas while retaining legacy URL/RPC payload support.
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
  v_search_like_lower text;
  v_search_is_uuid boolean := false;
  v_selected_weeks integer[];
  v_requested_week_count integer := 0;
  v_valid_week_count integer := 0;
  v_week_filter boolean := false;
  v_has_invalid_week boolean := false;
  v_result jsonb;
  v_enable_mergejoin text;
begin
  begin
    v_organization_id := nullif(btrim(p_organization_id), '')::uuid;
  exception when others then
    v_organization_id := null;
  end;

  -- Resolve selected ISO weeks to an indexed date range and keep an explicit
  -- week filter for gaps between multiple selected weeks.
  if v_data_inicial is null
     and v_data_final is null
     and p_ano between 2000 and 2100 then
    if coalesce(p_semana, 0) <> 0
       or (p_semanas is not null and cardinality(p_semanas) > 0) then
      v_has_invalid_week :=
        (p_semana is not null and p_semana <> 0 and p_semana not between 1 and 53)
        or (p_semanas is not null and exists (
          select 1
          from unnest(p_semanas) as selected(week_number)
          where selected.week_number is null
             or selected.week_number not between 1 and 53
        ));

      if not v_has_invalid_week then
        with requested_weeks as (
          select selected.week_number
          from unnest(coalesce(p_semanas, '{}'::integer[])) as selected(week_number)
          where selected.week_number between 1 and 53
          union
          select p_semana
          where p_semana between 1 and 53
        ),
        calculated_weeks as (
          select
            requested.week_number,
            date_trunc('week', make_date(p_ano, 1, 4)::timestamp)::date
              + ((requested.week_number - 1) * 7) as week_start
          from requested_weeks requested
        ),
        valid_weeks as (
          select calculated.week_number, calculated.week_start
          from calculated_weeks calculated
          where extract(isoyear from calculated.week_start)::integer = p_ano
            and extract(week from calculated.week_start)::integer = calculated.week_number
        )
        select
          (select count(*)::integer from requested_weeks),
          (select count(*)::integer from valid_weeks),
          (select array_agg(week_number order by week_number) from valid_weeks),
          (select min(week_start) from valid_weeks),
          (select max(week_start) + 6 from valid_weeks)
        into
          v_requested_week_count,
          v_valid_week_count,
          v_selected_weeks,
          v_data_inicial,
          v_data_final;

        v_has_invalid_week := v_requested_week_count <> v_valid_week_count;
        v_week_filter := not v_has_invalid_week
          and coalesce(cardinality(v_selected_weeks), 0) > 0;
      end if;
    else
      -- Older clients may send only p_ano. Normalize it to the same date
      -- range used by the current frontend so it can use the covering index.
      v_data_inicial := make_date(p_ano, 1, 1);
      v_data_final := make_date(p_ano, 12, 31);
    end if;
  end if;

  if v_search is not null then
    v_search_like_lower := '%' || lower(v_search) || '%';
    v_search_is_uuid := v_search ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  end if;

  if v_organization_id is null
     or v_data_inicial is null
     or v_data_final is null
     or v_data_final < v_data_inicial
     or v_data_final - v_data_inicial > 3660
     or v_has_invalid_week
     or (
       (coalesce(p_semana, 0) <> 0 or (p_semanas is not null and cardinality(p_semanas) > 0))
       and not v_week_filter
     )
     or coalesce(p_only_dedicados, false) then
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
    if left(btrim(p_origem), length('__DASHBOARD_ORIGENS_JSON_V1__:')) = '__DASHBOARD_ORIGENS_JSON_V1__:' then
      begin
        select array_agg(btrim(selected.value)) into v_origens
        from jsonb_array_elements_text(
          substring(btrim(p_origem) from length('__DASHBOARD_ORIGENS_JSON_V1__:') + 1)::jsonb
        ) as selected(value)
        where btrim(selected.value) <> '';
      exception when others then
        raise exception using
          errcode = '22023',
          message = 'Filtro de origem em formato inválido.';
      end;
    else
      select array_agg(btrim(value)) into v_origens
      from unnest(string_to_array(p_origem, ',')) as selected(value)
      where btrim(selected.value) <> '';
    end if;
  end if;

  -- Use the measured hash anti-join for this path and restore the caller setting before return.
  v_enable_mergejoin := pg_catalog.current_setting('enable_mergejoin');
  perform pg_catalog.set_config('enable_mergejoin', 'off', true);

  with incremental_scopes as materialized (
    select
      inc.organization_id,
      inc.data_do_periodo,
      inc.praca,
      inc.sub_praca,
      inc.origem,
      pg_catalog.hash_record_extended(
        row(inc.praca, inc.sub_praca, inc.origem),
        0
      ) as dimension_hash
    from public.tb_entregadores_agregado_incremental inc
    where inc.organization_id = v_organization_id
      and inc.data_do_periodo >= v_data_inicial
      and inc.data_do_periodo <= v_data_final
      and (
        not v_week_filter
        or (
          extract(isoyear from inc.data_do_periodo)::integer = p_ano
          and extract(week from inc.data_do_periodo)::integer = any(v_selected_weeks)
        )
      )
      and (v_pracas is null or inc.praca = any(v_pracas))
      and (v_sub_pracas is null or inc.sub_praca = any(v_sub_pracas))
      and (v_origens is null or inc.origem = any(v_origens))
    group by
      inc.organization_id,
      inc.data_do_periodo,
      inc.praca,
      inc.sub_praca,
      inc.origem
  ),
  filtered_data as (
    select
      mv.id_entregador,
      mv.nome_entregador,
      mv.corridas_ofertadas,
      mv.corridas_aceitas,
      mv.corridas_rejeitadas,
      mv.corridas_completadas,
      mv.total_segundos
    from public.mv_entregadores_agregado mv
    where mv.organization_id = v_organization_id
      and mv.data_do_periodo >= v_data_inicial
      and mv.data_do_periodo <= v_data_final
      and (
        not v_week_filter
        or (
          extract(isoyear from mv.data_do_periodo)::integer = p_ano
          and extract(week from mv.data_do_periodo)::integer = any(v_selected_weeks)
        )
      )
      and mv.id_entregador is not null
      and mv.id_entregador <> ''
      and mv.nome_entregador is not null
      and (v_pracas is null or mv.praca = any(v_pracas))
      and (v_sub_pracas is null or mv.sub_praca = any(v_sub_pracas))
      and (v_origens is null or mv.origem = any(v_origens))
      and (
        v_search is null
        or (v_search_is_uuid and mv.id_entregador = v_search)
        or (
          not v_search_is_uuid
          and length(v_search) >= 3
          and lower(mv.nome_entregador) ilike v_search_like_lower
        )
      )
      and not exists (
        select 1
        from incremental_scopes scope
        where scope.organization_id = mv.organization_id
          and scope.data_do_periodo = mv.data_do_periodo
          and scope.dimension_hash = pg_catalog.hash_record_extended(
            row(mv.praca, mv.sub_praca, mv.origem),
            0
          )
          -- Keep the full null-safe comparison authoritative. Hash collisions
          -- may add a candidate row to check but can never alter the result.
          and scope.praca is not distinct from mv.praca
          and scope.sub_praca is not distinct from mv.sub_praca
          and scope.origem is not distinct from mv.origem
      )
    union all
    select
      inc.id_entregador,
      inc.nome_entregador,
      inc.corridas_ofertadas,
      inc.corridas_aceitas,
      inc.corridas_rejeitadas,
      inc.corridas_completadas,
      inc.total_segundos
    from public.tb_entregadores_agregado_incremental inc
    where inc.organization_id = v_organization_id
      and inc.data_do_periodo >= v_data_inicial
      and inc.data_do_periodo <= v_data_final
      and (
        not v_week_filter
        or (
          extract(isoyear from inc.data_do_periodo)::integer = p_ano
          and extract(week from inc.data_do_periodo)::integer = any(v_selected_weeks)
        )
      )
      and inc.id_entregador is not null
      and inc.id_entregador <> ''
      and inc.nome_entregador is not null
      and (v_pracas is null or inc.praca = any(v_pracas))
      and (v_sub_pracas is null or inc.sub_praca = any(v_sub_pracas))
      and (v_origens is null or inc.origem = any(v_origens))
      and (
        v_search is null
        or (v_search_is_uuid and inc.id_entregador = v_search)
        or (
          not v_search_is_uuid
          and length(v_search) >= 3
          and lower(inc.nome_entregador) ilike v_search_like_lower
        )
      )
  ),
  aggregated_data as (
    select
      id_entregador,
      coalesce(
        max(nullif(btrim(nome_entregador), '')) filter (
          where position(chr(195) in nome_entregador) = 0
            and position(chr(194) in nome_entregador) = 0
        ),
        max(nullif(btrim(nome_entregador), '')),
        id_entregador
      ) as nome_entregador,
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
    from filtered_data
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
      'semana', case when v_week_filter and coalesce(p_semana, 0) > 0 then p_semana else null end,
      'semanas', case when v_week_filter then coalesce(to_jsonb(p_semanas), '[]'::jsonb) else '[]'::jsonb end,
      'auto_semana', false,
      'search', v_search
    )
  )
  into v_result
  from aggregated_data;

  perform pg_catalog.set_config('enable_mergejoin', v_enable_mergejoin, true);

  return coalesce(v_result, jsonb_build_object(
    'entregadores', '[]'::jsonb,
    'total', 0,
    'periodo_resolvido', jsonb_build_object(
      'ano', p_ano,
      'semana', case when v_week_filter and coalesce(p_semana, 0) > 0 then p_semana else null end,
      'semanas', case when v_week_filter then coalesce(to_jsonb(p_semanas), '[]'::jsonb) else '[]'::jsonb end,
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