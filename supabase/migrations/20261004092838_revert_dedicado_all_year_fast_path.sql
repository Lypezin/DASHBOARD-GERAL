-- Restore the existing all-year DEDICADO data path after the candidate showed no repeatable RPC gain.
CREATE OR REPLACE FUNCTION public.dashboard_dedicado_origens_v2(p_ano integer DEFAULT NULL::integer, p_semana integer DEFAULT NULL::integer, p_semanas integer[] DEFAULT NULL::integer[], p_praca text DEFAULT NULL::text, p_sub_praca text DEFAULT NULL::text, p_data_inicial date DEFAULT NULL::date, p_data_final date DEFAULT NULL::date, p_organization_id text DEFAULT NULL::text, p_include_dia_origem boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET statement_timeout TO '25s'
AS $function$
declare
    v_result jsonb;
    v_org_filter uuid;
    v_is_admin boolean := false;
    v_pracas text[];
    v_sub_pracas text[];
    v_selected_weeks integer[];
    v_effective_semana integer := null;
    v_all_semanas boolean := false;
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

    if array_length(p_semanas, 1) > 0 then
        select array_agg(distinct week_num order by week_num)
        into v_selected_weeks
        from unnest(p_semanas) as week_num
        where week_num is not null and week_num > 0;
    elsif p_semana is not null and p_semana > 0 then
        v_selected_weeks := array[p_semana];
    end if;

    v_all_semanas := p_data_inicial is null
        and p_data_final is null
        and p_ano is not null
        and v_selected_weeks is null
        and coalesce(p_semana, -1) = 0;

    if not v_all_semanas
       and p_data_inicial is null
       and p_data_final is null
       and p_ano is not null
       and v_selected_weeks is null then
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

        if v_effective_semana is not null then
            v_selected_weeks := array[v_effective_semana];
        end if;
    end if;

    with filtered_data as (
        select *
        from public.dedicado_origens_rows_v2(
            null,
            p_ano,
            p_semana,
            case
                when coalesce(array_length(v_selected_weeks, 1), 0) > 0 then v_selected_weeks
                else p_semanas
            end,
            p_praca,
            p_sub_praca,
            p_data_inicial,
            p_data_final,
            p_organization_id
        )
    ),
    dashboard_filtered as (
        select
            dr.origem,
            dr.data_do_periodo,
            extract(isodow from dr.data_do_periodo)::integer as dia_iso,
            coalesce(dr.segundos_planejados, 0) as segundos_planejados,
            coalesce(dr.segundos_realizados, 0) as segundos_realizados
        from public.vw_dashboard_resumo_current dr
        where (v_org_filter is null or dr.organization_id = v_org_filter)
          and (
            (
              p_data_inicial is not null
              and p_data_final is not null
              and dr.data_do_periodo >= p_data_inicial
              and dr.data_do_periodo <= p_data_final
            )
            or (
              p_data_inicial is null
              and p_data_final is null
              and p_ano is not null
              and v_all_semanas
              and dr.ano_iso = p_ano
            )
            or (
              p_data_inicial is null
              and p_data_final is null
              and p_ano is not null
              and v_selected_weeks is not null
              and dr.ano_iso = p_ano
              and dr.semana_iso = any(v_selected_weeks)
            )
            or (
              p_data_inicial is null
              and p_data_final is null
              and p_ano is null
              and dr.data_do_periodo >= current_date - 30
            )
          )
          and (v_pracas is null or dr.praca = any(v_pracas))
          and (v_sub_pracas is null or dr.sub_praca = any(v_sub_pracas))
          and dr.origem is not null
    ),
    planejamento_origem as (
        select
            origem,
            sum(segundos_planejados) as segundos_planejados,
            sum(segundos_realizados) as segundos_realizados
        from dashboard_filtered
        group by origem
    ),
    planejamento_dia_origem as (
        select
            dia_iso,
            origem,
            min(data_do_periodo)::text as data,
            sum(segundos_planejados) as segundos_planejados,
            sum(segundos_realizados) as segundos_realizados
        from dashboard_filtered
        where p_include_dia_origem
        group by dia_iso, origem
    ),
    totais_data as (
        select
            count(distinct id_entregador) as total_entregadores,
            count(distinct origem) as total_origens,
            coalesce(sum(corridas_ofertadas), 0) as corridas_ofertadas,
            coalesce(sum(corridas_aceitas), 0) as corridas_aceitas,
            coalesce(sum(corridas_rejeitadas), 0) as corridas_rejeitadas,
            coalesce(sum(corridas_completadas), 0) as corridas_completadas,
            coalesce(sum(total_segundos), 0) as segundos_realizados,
            coalesce((select sum(segundos_planejados) from planejamento_origem), 0) as segundos_planejados
        from filtered_data
    ),
    origem_base as (
        select
            origem,
            sum(corridas_ofertadas) as corridas_ofertadas,
            sum(corridas_aceitas) as corridas_aceitas,
            sum(corridas_rejeitadas) as corridas_rejeitadas,
            sum(corridas_completadas) as corridas_completadas,
            sum(total_segundos) as segundos_realizados
        from filtered_data
        group by origem
    ),
    origem_data as (
        select
            ob.origem,
            ob.corridas_ofertadas,
            ob.corridas_aceitas,
            ob.corridas_rejeitadas,
            ob.corridas_completadas,
            coalesce(nullif(po.segundos_realizados, 0), ob.segundos_realizados) as segundos_realizados,
            coalesce(po.segundos_planejados, 0) as segundos_planejados,
            case
                when coalesce(po.segundos_planejados, 0) > 0 then round((coalesce(po.segundos_realizados, 0)::numeric / nullif(po.segundos_planejados, 0)) * 100, 2)
                else 0
            end as aderencia_percentual,
            case
                when ob.corridas_ofertadas > 0 then round((ob.corridas_aceitas::numeric / nullif(ob.corridas_ofertadas, 0)) * 100, 2)
                else 0
            end as taxa_aceitacao,
            case
                when ob.corridas_aceitas > 0 then round((ob.corridas_completadas::numeric / nullif(ob.corridas_aceitas, 0)) * 100, 2)
                else 0
            end as taxa_completude
        from origem_base ob
        left join planejamento_origem po on po.origem = ob.origem
        order by ob.corridas_completadas desc nulls last, ob.origem
    ),
    dia_origem_base as (
        select
            case extract(isodow from data_do_periodo)::integer
                when 1 then 'Segunda'
                when 2 then 'Terca'
                when 3 then 'Quarta'
                when 4 then 'Quinta'
                when 5 then 'Sexta'
                when 6 then 'Sabado'
                when 7 then 'Domingo'
            end as dia,
            extract(isodow from data_do_periodo)::integer as dia_iso,
            min(data_do_periodo)::text as data,
            origem,
            sum(corridas_ofertadas) as corridas_ofertadas,
            sum(corridas_aceitas) as corridas_aceitas,
            sum(corridas_rejeitadas) as corridas_rejeitadas,
            sum(corridas_completadas) as corridas_completadas,
            sum(total_segundos) as segundos_realizados
        from filtered_data
        where p_include_dia_origem
        group by extract(isodow from data_do_periodo)::integer, origem
    ),
    dia_origem_data as (
        select
            dob.dia,
            dob.dia_iso,
            coalesce(pdo.data, dob.data) as data,
            dob.origem,
            dob.corridas_ofertadas,
            dob.corridas_aceitas,
            dob.corridas_rejeitadas,
            dob.corridas_completadas,
            coalesce(nullif(pdo.segundos_realizados, 0), dob.segundos_realizados) as segundos_realizados,
            coalesce(pdo.segundos_planejados, 0) as segundos_planejados,
            case
                when coalesce(pdo.segundos_planejados, 0) > 0 then round((coalesce(pdo.segundos_realizados, 0)::numeric / nullif(pdo.segundos_planejados, 0)) * 100, 2)
                else 0
            end as aderencia_percentual,
            case
                when dob.corridas_ofertadas > 0 then round((dob.corridas_aceitas::numeric / nullif(dob.corridas_ofertadas, 0)) * 100, 2)
                else 0
            end as taxa_aceitacao,
            case
                when dob.corridas_aceitas > 0 then round((dob.corridas_completadas::numeric / nullif(dob.corridas_aceitas, 0)) * 100, 2)
                else 0
            end as taxa_completude
        from dia_origem_base dob
        left join planejamento_dia_origem pdo on pdo.dia_iso = dob.dia_iso and pdo.origem = dob.origem
        order by dob.dia_iso, dob.origem
    )
    select jsonb_build_object(
        'totais', coalesce((select row_to_json(totais_data)::jsonb from totais_data), '{}'::jsonb),
        'origem', coalesce((select jsonb_agg(row_to_json(origem_data)) from origem_data), '[]'::jsonb),
        'dia_origem', case
            when p_include_dia_origem then coalesce((select jsonb_agg(row_to_json(dia_origem_data)) from dia_origem_data), '[]'::jsonb)
            else '[]'::jsonb
        end,
        'periodo_resolvido', jsonb_build_object(
            'ano', p_ano,
            'semana', case when coalesce(array_length(v_selected_weeks, 1), 0) = 1 then v_selected_weeks[1] else p_semana end,
            'semanas', coalesce(to_jsonb(v_selected_weeks), '[]'::jsonb),
            'auto_semana', p_semana is null and (p_semanas is null or array_length(p_semanas, 1) is null) and not v_all_semanas,
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
            'semana', case when coalesce(array_length(v_selected_weeks, 1), 0) = 1 then v_selected_weeks[1] else p_semana end,
            'semanas', coalesce(to_jsonb(v_selected_weeks), '[]'::jsonb),
            'auto_semana', false,
            'todas_semanas', v_all_semanas
        )
    ));
end;
$function$;

DROP FUNCTION public.dedicado_origens_rows_all_year_v1(text, integer, integer, integer[], text, text, date, date, text);

NOTIFY pgrst, 'reload schema';
