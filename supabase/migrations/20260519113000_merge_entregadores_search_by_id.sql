create or replace function public.listar_entregadores_v2(
    p_ano integer default null,
    p_semana integer default null,
    p_praca text default null,
    p_sub_praca text default null,
    p_origem text default null,
    p_data_inicial date default null,
    p_data_final date default null,
    p_organization_id text default null,
    p_only_dedicados boolean default false,
    p_search text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
set statement_timeout = '30s'
as $$
declare
    v_result jsonb;
    v_org_filter uuid;
    v_is_admin boolean := false;
    v_pracas text[];
    v_sub_pracas text[];
    v_origens text[];
    v_effective_semana integer := p_semana;
    v_auto_semana boolean := false;
    v_search text := nullif(btrim(p_search), '');
    v_search_like text;
    v_search_is_uuid boolean := false;
begin
    if v_search is not null then
        v_search_like := '%' || v_search || '%';
        v_search_is_uuid := v_search ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    end if;

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

        if v_org_filter is null then
            v_org_filter := '00000000-0000-0000-0000-000000000000';
        end if;
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

    if p_data_inicial is null
       and p_data_final is null
       and p_ano is not null
       and v_effective_semana is null
       and v_search is null then
        with latest_weeks as (
            select (
                select mv.semana_numero
                from public.mv_entregadores_agregado mv
                where (v_org_filter is null or mv.organization_id = v_org_filter)
                  and mv.ano_iso = p_ano
                  and (v_pracas is null or mv.praca = any(v_pracas))
                  and (v_sub_pracas is null or mv.sub_praca = any(v_sub_pracas))
                  and (v_origens is null or mv.origem = any(v_origens))
                  and (not coalesce(p_only_dedicados, false) or mv.origem ilike '%dedic%')
                  and mv.nome_entregador is not null
                  and mv.semana_numero is not null
                order by mv.semana_numero desc
                limit 1
            ) as semana_numero
            union all
            select (
                select inc.semana_numero
                from public.tb_entregadores_agregado_incremental inc
                where (v_org_filter is null or inc.organization_id = v_org_filter)
                  and inc.ano_iso = p_ano
                  and (v_pracas is null or inc.praca = any(v_pracas))
                  and (v_sub_pracas is null or inc.sub_praca = any(v_sub_pracas))
                  and (v_origens is null or inc.origem = any(v_origens))
                  and (not coalesce(p_only_dedicados, false) or inc.origem ilike '%dedic%')
                  and inc.nome_entregador is not null
                  and inc.semana_numero is not null
                order by inc.semana_numero desc
                limit 1
            ) as semana_numero
        )
        select max(semana_numero)
        into v_effective_semana
        from latest_weeks
        where semana_numero is not null;

        v_auto_semana := v_effective_semana is not null;
    end if;

    with filtered_data as (
        select
            mv.id_entregador,
            mv.nome_entregador,
            mv.corridas_ofertadas,
            mv.corridas_aceitas,
            mv.corridas_rejeitadas,
            mv.corridas_completadas,
            mv.total_segundos
        from public.vw_entregadores_agregado_current mv
        where (v_org_filter is null or mv.organization_id = v_org_filter)
          and (
            (
              p_data_inicial is not null
              and p_data_final is not null
              and mv.data_do_periodo >= p_data_inicial
              and mv.data_do_periodo <= p_data_final
            )
            or (
              p_data_inicial is null
              and p_data_final is null
              and p_ano is not null
              and v_effective_semana is not null
              and mv.ano_iso = p_ano
              and mv.semana_numero = v_effective_semana
            )
            or (
              p_data_inicial is null
              and p_data_final is null
              and p_ano is not null
              and v_effective_semana is null
              and v_search is not null
              and mv.ano_iso = p_ano
            )
            or (
              p_data_inicial is null
              and p_data_final is null
              and p_ano is null
              and mv.data_do_periodo >= current_date - 30
            )
          )
          and (v_pracas is null or mv.praca = any(v_pracas))
          and (v_sub_pracas is null or mv.sub_praca = any(v_sub_pracas))
          and (v_origens is null or mv.origem = any(v_origens))
          and (not coalesce(p_only_dedicados, false) or mv.origem ilike '%dedic%')
          and (
              v_search is null
              or mv.id_entregador = v_search
              or (
                  not v_search_is_uuid
                  and (
                      mv.id_entregador ilike v_search_like
                      or mv.nome_entregador ilike v_search_like
                  )
              )
          )
          and mv.id_entregador is not null
          and mv.id_entregador <> ''
          and mv.nome_entregador is not null
    ),
    aggregated_data as (
        select
            id_entregador,
            coalesce(
                max(nullif(btrim(nome_entregador), '')) filter (where nome_entregador !~ '[ÃÂ]'),
                max(nullif(btrim(nome_entregador), '')),
                id_entregador
            ) as nome_entregador,
            sum(corridas_ofertadas) as corridas_ofertadas,
            sum(corridas_aceitas) as corridas_aceitas,
            sum(corridas_rejeitadas) as corridas_rejeitadas,
            sum(corridas_completadas) as corridas_completadas,
            sum(total_segundos) as total_segundos,
            case
                when sum(corridas_ofertadas) > 0 then round((sum(corridas_aceitas)::numeric / nullif(sum(corridas_ofertadas), 0)) * 100, 2)
                else 0
            end as aderencia_percentual,
            case
                when sum(corridas_ofertadas) > 0 then round((sum(corridas_rejeitadas)::numeric / nullif(sum(corridas_ofertadas), 0)) * 100, 2)
                else 0
            end as rejeicao_percentual
        from filtered_data
        group by id_entregador
    ),
    final_data as (
        select *
        from aggregated_data
        order by corridas_completadas desc
    )
    select jsonb_build_object(
        'entregadores', coalesce(jsonb_agg(row_to_json(final_data)), '[]'::jsonb),
        'total', coalesce((select count(*) from final_data), 0),
        'periodo_resolvido', jsonb_build_object(
            'ano', p_ano,
            'semana', v_effective_semana,
            'auto_semana', v_auto_semana,
            'search', v_search
        )
    )
    into v_result
    from final_data;

    return coalesce(v_result, jsonb_build_object(
        'entregadores', '[]'::jsonb,
        'total', 0,
        'periodo_resolvido', jsonb_build_object(
            'ano', p_ano,
            'semana', v_effective_semana,
            'auto_semana', v_auto_semana,
            'search', v_search
        )
    ));
end;
$$;

revoke execute on function public.listar_entregadores_v2(
    integer,
    integer,
    text,
    text,
    text,
    date,
    date,
    text,
    boolean,
    text
) from public, anon;

grant execute on function public.listar_entregadores_v2(
    integer,
    integer,
    text,
    text,
    text,
    date,
    date,
    text,
    boolean,
    text
) to authenticated, service_role;
