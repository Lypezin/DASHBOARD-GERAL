create or replace function public.calcular_utr_completo(
    p_data_inicial date default null,
    p_data_final date default null,
    p_ano integer default null,
    p_semana integer default null,
    p_organization_id uuid default null,
    p_praca text default null,
    p_sub_praca text default null,
    p_origem text default null,
    p_turno text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
    v_result jsonb;
    v_org_filter uuid := p_organization_id;
    v_is_admin boolean := false;
    v_semana integer := nullif(p_semana, 0);
    v_pracas text[];
    v_sub_pracas text[];
    v_origens text[];
    v_turnos text[];
begin
    if v_org_filter is null then
        select coalesce((role in ('admin', 'marketing', 'master') or is_admin = true), false)
        into v_is_admin
        from public.user_profiles
        where id = auth.uid();

        if not v_is_admin then
            select organization_id
            into v_org_filter
            from public.user_profiles
            where id = auth.uid();
        end if;
    end if;

    if v_org_filter is null or v_org_filter = '00000000-0000-0000-0000-000000000000'::uuid then
        v_org_filter := '00000000-0000-0000-0000-000000000001'::uuid;
    end if;

    if p_praca is not null and btrim(p_praca) <> '' and lower(btrim(p_praca)) not in ('todas', 'todos', 'all') then
        select array_agg(btrim(value))
        into v_pracas
        from unnest(string_to_array(p_praca, ',')) as value
        where btrim(value) <> '';
    end if;

    if p_sub_praca is not null and btrim(p_sub_praca) <> '' and lower(btrim(p_sub_praca)) not in ('todas', 'todos', 'all') then
        select array_agg(btrim(value))
        into v_sub_pracas
        from unnest(string_to_array(p_sub_praca, ',')) as value
        where btrim(value) <> '';
    end if;

    if p_origem is not null and btrim(p_origem) <> '' and lower(btrim(p_origem)) not in ('todas', 'todos', 'all') then
        select array_agg(btrim(value))
        into v_origens
        from unnest(string_to_array(p_origem, ',')) as value
        where btrim(value) <> '';
    end if;

    if p_turno is not null and btrim(p_turno) <> '' and lower(btrim(p_turno)) not in ('todas', 'todos', 'all') then
        select array_agg(btrim(value))
        into v_turnos
        from unnest(string_to_array(p_turno, ',')) as value
        where btrim(value) <> '';
    end if;

    with filtered as (
        select
            praca,
            sub_praca,
            origem,
            turno,
            coalesce(total_completadas, 0)::numeric as total_completadas,
            coalesce(segundos_realizados, 0)::numeric as segundos_realizados
        from public.vw_dashboard_resumo_current
        where (v_org_filter is null or organization_id = v_org_filter)
          and (p_data_inicial is null or data_do_periodo >= p_data_inicial)
          and (p_data_final is null or data_do_periodo <= p_data_final)
          and (p_data_inicial is not null or p_data_final is not null or p_ano is null or ano_iso = p_ano)
          and (p_data_inicial is not null or p_data_final is not null or v_semana is null or semana_iso = v_semana)
          and (v_pracas is null or praca = any(v_pracas))
          and (v_sub_pracas is null or sub_praca = any(v_sub_pracas))
          and (v_origens is null or origem = any(v_origens))
          and (v_turnos is null or turno = any(v_turnos))
          and (p_data_inicial is not null or p_data_final is not null or p_ano is not null or data_do_periodo >= current_date - 30)
    ),
    aggregates as (
        select
            coalesce(sum(total_completadas), 0) as corridas,
            coalesce(sum(segundos_realizados), 0) / 3600.0 as tempo_horas,
            grouping(praca) as g_praca,
            grouping(sub_praca) as g_sub_praca,
            grouping(origem) as g_origem,
            grouping(turno) as g_turno,
            praca,
            sub_praca,
            origem,
            turno
        from filtered
        group by grouping sets (
            (),
            (praca),
            (sub_praca),
            (origem),
            (turno)
        )
    )
    select jsonb_build_object(
        'geral', (
            select coalesce(to_jsonb(t), jsonb_build_object('tempo_horas', 0, 'corridas', 0, 'utr', 0))
            from (
                select
                    round(coalesce(tempo_horas, 0), 2) as tempo_horas,
                    coalesce(corridas, 0) as corridas,
                    case
                        when coalesce(tempo_horas, 0) > 0 then round((coalesce(corridas, 0) / tempo_horas), 2)
                        else 0
                    end as utr
                from aggregates
                where g_praca = 1 and g_sub_praca = 1 and g_origem = 1 and g_turno = 1
            ) t
        ),
        'praca', (
            select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
            from (
                select
                    praca,
                    round(coalesce(tempo_horas, 0), 2) as tempo_horas,
                    coalesce(corridas, 0) as corridas,
                    case when coalesce(tempo_horas, 0) > 0 then round((coalesce(corridas, 0) / tempo_horas), 2) else 0 end as utr
                from aggregates
                where g_praca = 0
                order by utr desc
                limit 50
            ) t
        ),
        'sub_praca', (
            select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
            from (
                select
                    sub_praca,
                    round(coalesce(tempo_horas, 0), 2) as tempo_horas,
                    coalesce(corridas, 0) as corridas,
                    case when coalesce(tempo_horas, 0) > 0 then round((coalesce(corridas, 0) / tempo_horas), 2) else 0 end as utr
                from aggregates
                where g_sub_praca = 0
                order by utr desc
                limit 50
            ) t
        ),
        'origem', (
            select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
            from (
                select
                    origem,
                    round(coalesce(tempo_horas, 0), 2) as tempo_horas,
                    coalesce(corridas, 0) as corridas,
                    case when coalesce(tempo_horas, 0) > 0 then round((coalesce(corridas, 0) / tempo_horas), 2) else 0 end as utr
                from aggregates
                where g_origem = 0
                order by utr desc
                limit 50
            ) t
        ),
        'turno', (
            select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
            from (
                select
                    turno,
                    round(coalesce(tempo_horas, 0), 2) as tempo_horas,
                    coalesce(corridas, 0) as corridas,
                    case when coalesce(tempo_horas, 0) > 0 then round((coalesce(corridas, 0) / tempo_horas), 2) else 0 end as utr
                from aggregates
                where g_turno = 0
                order by utr desc
                limit 50
            ) t
        )
    )
    into v_result;

    return coalesce(v_result, jsonb_build_object(
        'geral', jsonb_build_object('tempo_horas', 0, 'corridas', 0, 'utr', 0),
        'praca', '[]'::jsonb,
        'sub_praca', '[]'::jsonb,
        'origem', '[]'::jsonb,
        'turno', '[]'::jsonb
    ));
end;
$$;

create or replace function public.calcular_utr(
    p_ano integer default null,
    p_semana integer default null,
    p_semanas integer[] default null,
    p_praca text default null,
    p_sub_praca text default null,
    p_origem text default null,
    p_turno text default null,
    p_sub_pracas text[] default null,
    p_origens text[] default null,
    p_turnos text[] default null,
    p_filtro_modo text default 'ano_semana',
    p_data_inicial date default null,
    p_data_final date default null,
    p_organization_id text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
    v_result jsonb;
    v_org_filter uuid;
    v_is_admin boolean := false;
    v_semana_list integer[];
    v_pracas text[];
    v_sub_pracas text[];
    v_origens text[];
    v_turnos text[];
begin
    begin
        v_org_filter := nullif(p_organization_id, '')::uuid;
    exception when others then
        v_org_filter := null;
    end;

    if v_org_filter is null then
        select coalesce((role in ('admin', 'marketing', 'master') or is_admin = true), false)
        into v_is_admin
        from public.user_profiles
        where id = auth.uid();

        if not v_is_admin then
            select organization_id
            into v_org_filter
            from public.user_profiles
            where id = auth.uid();
        end if;
    end if;

    if v_org_filter is null or v_org_filter = '00000000-0000-0000-0000-000000000000'::uuid then
        v_org_filter := '00000000-0000-0000-0000-000000000001'::uuid;
    end if;

    if p_semanas is not null and cardinality(p_semanas) > 0 then
        v_semana_list := p_semanas;
    elsif nullif(p_semana, 0) is not null then
        v_semana_list := array[p_semana];
    end if;

    if p_praca is not null and btrim(p_praca) <> '' and lower(btrim(p_praca)) not in ('todas', 'todos', 'all') then
        select array_agg(btrim(value)) into v_pracas from unnest(string_to_array(p_praca, ',')) as value where btrim(value) <> '';
    end if;

    if p_sub_pracas is not null and cardinality(p_sub_pracas) > 0 then
        v_sub_pracas := p_sub_pracas;
    elsif p_sub_praca is not null and btrim(p_sub_praca) <> '' and lower(btrim(p_sub_praca)) not in ('todas', 'todos', 'all') then
        select array_agg(btrim(value)) into v_sub_pracas from unnest(string_to_array(p_sub_praca, ',')) as value where btrim(value) <> '';
    end if;

    if p_origens is not null and cardinality(p_origens) > 0 then
        v_origens := p_origens;
    elsif p_origem is not null and btrim(p_origem) <> '' and lower(btrim(p_origem)) not in ('todas', 'todos', 'all') then
        select array_agg(btrim(value)) into v_origens from unnest(string_to_array(p_origem, ',')) as value where btrim(value) <> '';
    end if;

    if p_turnos is not null and cardinality(p_turnos) > 0 then
        v_turnos := p_turnos;
    elsif p_turno is not null and btrim(p_turno) <> '' and lower(btrim(p_turno)) not in ('todas', 'todos', 'all') then
        select array_agg(btrim(value)) into v_turnos from unnest(string_to_array(p_turno, ',')) as value where btrim(value) <> '';
    end if;

    with filtered as (
        select
            coalesce(total_completadas, 0)::numeric as total_completadas,
            coalesce(segundos_realizados, 0)::numeric as segundos_realizados
        from public.vw_dashboard_resumo_current
        where (v_org_filter is null or organization_id = v_org_filter)
          and (p_data_inicial is null or data_do_periodo >= p_data_inicial)
          and (p_data_final is null or data_do_periodo <= p_data_final)
          and (p_data_inicial is not null or p_data_final is not null or p_ano is null or ano_iso = p_ano)
          and (p_data_inicial is not null or p_data_final is not null or v_semana_list is null or semana_iso = any(v_semana_list))
          and (v_pracas is null or praca = any(v_pracas))
          and (v_sub_pracas is null or sub_praca = any(v_sub_pracas))
          and (v_origens is null or origem = any(v_origens))
          and (v_turnos is null or turno = any(v_turnos))
          and (p_data_inicial is not null or p_data_final is not null or p_ano is not null or data_do_periodo >= current_date - 30)
    ),
    total as (
        select
            coalesce(sum(total_completadas), 0) as corridas,
            coalesce(sum(segundos_realizados), 0) / 3600.0 as tempo_horas
        from filtered
    )
    select jsonb_build_object(
        'geral', jsonb_build_object(
            'tempo_horas', round(coalesce(tempo_horas, 0), 2),
            'corridas', coalesce(corridas, 0),
            'utr', case when coalesce(tempo_horas, 0) > 0 then round((coalesce(corridas, 0) / tempo_horas), 2) else 0 end
        )
    )
    into v_result
    from total;

    return coalesce(v_result, jsonb_build_object('geral', jsonb_build_object('tempo_horas', 0, 'corridas', 0, 'utr', 0)));
end;
$$;

grant execute on function public.calcular_utr_completo(date, date, integer, integer, uuid, text, text, text, text) to authenticated, service_role;
grant execute on function public.calcular_utr(integer, integer, integer[], text, text, text, text, text[], text[], text[], text, date, date, text) to authenticated, service_role;
