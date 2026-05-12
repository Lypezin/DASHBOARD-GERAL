create or replace function public.dashboard_dedicado_origens_summary(
    p_ano integer default null,
    p_semana integer default null,
    p_praca text default null,
    p_sub_praca text default null,
    p_data_inicial date default null,
    p_data_final date default null,
    p_organization_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
set statement_timeout = '20s'
as $$
declare
    v_result jsonb;
    v_org_filter uuid;
    v_is_admin boolean := false;
    v_pracas text[];
    v_sub_pracas text[];
    v_all_semanas boolean := coalesce(p_semana, -1) = 0;
    v_effective_semana integer := nullif(p_semana, 0);
    v_auto_semana boolean := false;
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

    if not v_all_semanas
       and p_data_inicial is null
       and p_data_final is null
       and p_ano is not null
       and v_effective_semana is null then
        with latest_weeks as (
            select (
                select mv.semana_numero
                from public.mv_entregadores_agregado mv
                where (v_org_filter is null or mv.organization_id = v_org_filter)
                  and mv.ano_iso = p_ano
                  and (v_pracas is null or mv.praca = any(v_pracas))
                  and (v_sub_pracas is null or mv.sub_praca = any(v_sub_pracas))
                  and mv.origem is not null
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
                  and inc.origem is not null
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
            curr.id_entregador,
            curr.origem,
            curr.corridas_ofertadas,
            curr.corridas_aceitas,
            curr.corridas_rejeitadas,
            curr.corridas_completadas,
            curr.total_segundos
        from public.vw_entregadores_agregado_current curr
        where (v_org_filter is null or curr.organization_id = v_org_filter)
          and (
            (
              p_data_inicial is not null
              and p_data_final is not null
              and curr.data_do_periodo >= p_data_inicial
              and curr.data_do_periodo <= p_data_final
            )
            or (
              p_data_inicial is null
              and p_data_final is null
              and p_ano is not null
              and v_all_semanas
              and curr.ano_iso = p_ano
            )
            or (
              p_data_inicial is null
              and p_data_final is null
              and p_ano is not null
              and v_effective_semana is not null
              and curr.ano_iso = p_ano
              and curr.semana_numero = v_effective_semana
            )
            or (
              p_data_inicial is null
              and p_data_final is null
              and p_ano is null
              and curr.data_do_periodo >= current_date - 30
            )
          )
          and (v_pracas is null or curr.praca = any(v_pracas))
          and (v_sub_pracas is null or curr.sub_praca = any(v_sub_pracas))
          and curr.origem is not null
          and curr.nome_entregador is not null
    ),
    totais_data as (
        select
            count(distinct id_entregador) as total_entregadores,
            count(distinct origem) as total_origens,
            coalesce(sum(corridas_ofertadas), 0) as corridas_ofertadas,
            coalesce(sum(corridas_aceitas), 0) as corridas_aceitas,
            coalesce(sum(corridas_rejeitadas), 0) as corridas_rejeitadas,
            coalesce(sum(corridas_completadas), 0) as corridas_completadas,
            coalesce(sum(total_segundos), 0) as segundos_realizados
        from filtered_data
    ),
    origem_data as (
        select
            origem,
            sum(corridas_ofertadas) as corridas_ofertadas,
            sum(corridas_aceitas) as corridas_aceitas,
            sum(corridas_rejeitadas) as corridas_rejeitadas,
            sum(corridas_completadas) as corridas_completadas,
            sum(total_segundos) as segundos_realizados,
            case
                when sum(corridas_ofertadas) > 0 then round((sum(corridas_aceitas)::numeric / nullif(sum(corridas_ofertadas), 0)) * 100, 2)
                else 0
            end as aderencia_percentual
        from filtered_data
        group by origem
        order by sum(corridas_completadas) desc nulls last, origem
    )
    select jsonb_build_object(
        'totais', coalesce((select row_to_json(totais_data)::jsonb from totais_data), '{}'::jsonb),
        'origem', coalesce((select jsonb_agg(row_to_json(origem_data)) from origem_data), '[]'::jsonb),
        'dia_origem', '[]'::jsonb,
        'periodo_resolvido', jsonb_build_object(
            'ano', p_ano,
            'semana', v_effective_semana,
            'auto_semana', v_auto_semana,
            'todas_semanas', v_all_semanas
        )
    )
    into v_result;

    return coalesce(v_result, jsonb_build_object(
        'totais', '{}'::jsonb,
        'origem', '[]'::jsonb,
        'dia_origem', '[]'::jsonb,
        'periodo_resolvido', jsonb_build_object(
            'ano', p_ano,
            'semana', v_effective_semana,
            'auto_semana', v_auto_semana,
            'todas_semanas', v_all_semanas
        )
    ));
end;
$$;

revoke execute on function public.dashboard_dedicado_origens_summary(
    integer,
    integer,
    text,
    text,
    date,
    date,
    text
) from public, anon;

grant execute on function public.dashboard_dedicado_origens_summary(
    integer,
    integer,
    text,
    text,
    date,
    date,
    text
) to authenticated, service_role;
