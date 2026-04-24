create or replace function public.get_marketing_resultados_data(
    data_envio_inicial date default null,
    data_envio_final date default null,
    data_liberacao_inicial date default null,
    data_liberacao_final date default null,
    data_custo_inicial date default null,
    data_custo_final date default null,
    p_organization_id uuid default null
)
returns table(
    responsavel text,
    enviado bigint,
    liberado bigint,
    cidade text,
    cidade_enviado bigint,
    cidade_liberado bigint,
    cidade_valor_total numeric,
    cidade_quantidade_liberados bigint,
    cidade_custo_por_liberado numeric,
    atendente_valor_total numeric,
    atendente_quantidade_liberados bigint,
    atendente_custo_por_liberado numeric
)
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
begin
    return query
    with marketing_base as materialized (
        select
            dm.responsavel,
            case
                when dm.regiao_atuacao = 'ABC 2.0' and dm.sub_praca_abc in ('Vila Aquino', 'São Caetano') then 'Santo André'
                when dm.regiao_atuacao = 'ABC 2.0' and dm.sub_praca_abc in ('Diadema', 'Nova petrópolis', 'Rudge Ramos') then 'São Bernardo'
                else dm.regiao_atuacao
            end as cidade,
            dm.data_envio,
            dm.data_liberacao,
            dm.status
        from public.dados_marketing dm
        where dm.responsavel is not null
          and (p_organization_id is null or dm.organization_id = p_organization_id)
    ),
    attendant_city as (
        select
            mb.responsavel,
            mb.cidade,
            count(*) filter (
                where mb.data_envio is not null
                  and (data_envio_inicial is null or mb.data_envio >= data_envio_inicial)
                  and (data_envio_final is null or mb.data_envio <= data_envio_final)
            )::bigint as cidade_enviado,
            count(*) filter (
                where mb.data_liberacao is not null
                  and (data_liberacao_inicial is null or mb.data_liberacao >= data_liberacao_inicial)
                  and (data_liberacao_final is null or mb.data_liberacao <= data_liberacao_final)
            )::bigint as cidade_liberado
        from marketing_base mb
        where mb.cidade is not null
        group by mb.responsavel, mb.cidade
    ),
    attendant_totals as (
        select
            ac.responsavel,
            sum(ac.cidade_enviado)::bigint as enviado,
            sum(ac.cidade_liberado)::bigint as liberado
        from attendant_city ac
        group by ac.responsavel
    ),
    cost_liberados_by_city as (
        select
            mb.responsavel,
            mb.cidade,
            count(*)::bigint as quantidade_liberados
        from marketing_base mb
        where mb.status = 'Liberado'
          and mb.cidade is not null
          and (data_custo_inicial is null or mb.data_envio >= data_custo_inicial)
          and (data_custo_final is null or mb.data_envio <= data_custo_final)
        group by mb.responsavel, mb.cidade
    ),
    valores_base as materialized (
        select
            case
                when trim(dvc.id_atendente) = '6905' then 'Carolini Braguini'
                when trim(dvc.id_atendente) in ('6976', '2387') then 'Beatriz Angelo'
                when trim(dvc.id_atendente) in ('5447', '4182') then 'Fernanda Raphaelly'
                else null
            end as responsavel,
            case
                when upper(trim(dvc.cidade)) in ('SÃO PAULO', 'SAO PAULO') then 'São Paulo 2.0'
                when upper(trim(dvc.cidade)) = 'MANAUS' then 'Manaus 2.0'
                when upper(trim(dvc.cidade)) = 'GUARULHOS' then 'Guarulhos 2.0'
                when upper(trim(dvc.cidade)) = 'SALVADOR' then 'Salvador 2.0'
                when upper(trim(dvc.cidade)) = 'SOROCABA' then 'Sorocaba 2.0'
                when upper(trim(dvc.cidade)) in ('TABOÃO DA SERRA E EMBU DAS ARTES', 'TABOAO DA SERRA E EMBU DAS ARTES') then 'Taboão da Serra e Embu das Artes 2.0'
                when upper(trim(dvc.cidade)) = 'ABC' then 'ABC'
                else trim(dvc.cidade)
            end as cidade,
            sum(coalesce(dvc.valor, 0))::numeric as valor_total
        from public.dados_valores_cidade dvc
        where (p_organization_id is null or dvc.organization_id = p_organization_id)
          and (data_custo_inicial is null or dvc.data >= data_custo_inicial)
          and (data_custo_final is null or dvc.data <= data_custo_final)
        group by 1, 2
    ),
    city_value_lookup as (
        select
            ac.responsavel,
            ac.cidade,
            case
                when ac.cidade in ('Santo André', 'São Bernardo') then coalesce(vabc.valor_total, 0)
                else coalesce(v.valor_total, 0)
            end::numeric as cidade_valor_total
        from attendant_city ac
        left join valores_base v
            on v.responsavel = ac.responsavel
           and v.cidade = ac.cidade
        left join valores_base vabc
            on vabc.responsavel = ac.responsavel
           and vabc.cidade = 'ABC'
    ),
    attendant_value_totals as (
        select
            cvl.responsavel,
            coalesce(sum(cvl.cidade_valor_total), 0)::numeric as atendente_valor_total
        from city_value_lookup cvl
        group by cvl.responsavel
    ),
    attendant_liberado_totals as (
        select
            clc.responsavel,
            coalesce(sum(clc.quantidade_liberados), 0)::bigint as atendente_quantidade_liberados
        from cost_liberados_by_city clc
        group by clc.responsavel
    ),
    attendant_cost_totals as (
        select
            at.responsavel,
            coalesce(avt.atendente_valor_total, 0)::numeric as atendente_valor_total,
            coalesce(alt.atendente_quantidade_liberados, 0)::bigint as atendente_quantidade_liberados
        from attendant_totals at
        left join attendant_value_totals avt
            on avt.responsavel = at.responsavel
        left join attendant_liberado_totals alt
            on alt.responsavel = at.responsavel
    )
    select
        ac.responsavel::text,
        at.enviado,
        at.liberado,
        ac.cidade::text,
        ac.cidade_enviado,
        ac.cidade_liberado,
        coalesce(cvl.cidade_valor_total, 0)::numeric as cidade_valor_total,
        coalesce(clc.quantidade_liberados, 0)::bigint as cidade_quantidade_liberados,
        case
            when coalesce(clc.quantidade_liberados, 0) > 0
                then round(coalesce(cvl.cidade_valor_total, 0) / clc.quantidade_liberados, 2)
            else 0::numeric
        end as cidade_custo_por_liberado,
        act.atendente_valor_total,
        act.atendente_quantidade_liberados,
        case
            when act.atendente_quantidade_liberados > 0
                then round(act.atendente_valor_total / act.atendente_quantidade_liberados, 2)
            else 0::numeric
        end as atendente_custo_por_liberado
    from attendant_city ac
    join attendant_totals at
      on at.responsavel = ac.responsavel
    left join city_value_lookup cvl
      on cvl.responsavel = ac.responsavel
     and cvl.cidade = ac.cidade
    left join cost_liberados_by_city clc
      on clc.responsavel = ac.responsavel
     and clc.cidade = ac.cidade
    left join attendant_cost_totals act
      on act.responsavel = ac.responsavel
    order by ac.responsavel, ac.cidade;
end;
$function$;

create or replace function public.get_valores_cidade_resumo(
    p_organization_id uuid default null,
    data_valores_inicial date default null,
    data_valores_final date default null,
    data_envio_inicial date default null,
    data_envio_final date default null
)
returns table(
    cidade text,
    valor_total numeric,
    valor_total_enviados numeric,
    quantidade_liberados bigint,
    custo_por_liberado numeric
)
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
begin
    return query
    with valores_filtrados as materialized (
        select
            case
                when upper(trim(dvc.cidade)) in ('SÃO PAULO', 'SAO PAULO') then 'SÃO PAULO'
                when upper(trim(dvc.cidade)) = 'MANAUS' then 'MANAUS'
                when upper(trim(dvc.cidade)) = 'ABC' then 'ABC'
                when upper(trim(dvc.cidade)) = 'GUARULHOS' then 'GUARULHOS'
                when upper(trim(dvc.cidade)) = 'SALVADOR' then 'SALVADOR'
                when upper(trim(dvc.cidade)) = 'SOROCABA' then 'SOROCABA'
                when upper(trim(dvc.cidade)) in ('TABOÃO DA SERRA E EMBU DAS ARTES', 'TABOAO DA SERRA E EMBU DAS ARTES') then 'TABOÃO DA SERRA E EMBU DAS ARTES'
                else upper(trim(dvc.cidade))
            end as cidade,
            dvc.data,
            coalesce(dvc.valor, 0)::numeric as valor
        from public.dados_valores_cidade dvc
        where (p_organization_id is null or dvc.organization_id = p_organization_id)
    ),
    valores_agrupados as (
        select
            vf.cidade,
            sum(vf.valor) filter (
                where (data_valores_inicial is null or vf.data >= data_valores_inicial)
                  and (data_valores_final is null or vf.data <= data_valores_final)
            )::numeric as valor_total,
            sum(vf.valor) filter (
                where (data_envio_inicial is null or vf.data >= data_envio_inicial)
                  and (data_envio_final is null or vf.data <= data_envio_final)
            )::numeric as valor_total_enviados
        from valores_filtrados vf
        group by vf.cidade
    ),
    liberados_agrupados as (
        select
            case
                when dm.regiao_atuacao = 'ABC 2.0' then 'ABC'
                when dm.regiao_atuacao = 'São Paulo 2.0' then 'SÃO PAULO'
                when dm.regiao_atuacao = 'Manaus 2.0' then 'MANAUS'
                when dm.regiao_atuacao = 'Guarulhos 2.0' then 'GUARULHOS'
                when dm.regiao_atuacao = 'Salvador 2.0' then 'SALVADOR'
                when dm.regiao_atuacao = 'Sorocaba 2.0' then 'SOROCABA'
                when dm.regiao_atuacao = 'Taboão da Serra e Embu das Artes 2.0' then 'TABOÃO DA SERRA E EMBU DAS ARTES'
                else upper(trim(dm.regiao_atuacao))
            end as cidade,
            count(*)::bigint as quantidade_liberados
        from public.dados_marketing dm
        where dm.status = 'Liberado'
          and (p_organization_id is null or dm.organization_id = p_organization_id)
          and (data_envio_inicial is null or dm.data_envio >= data_envio_inicial)
          and (data_envio_final is null or dm.data_envio <= data_envio_final)
        group by 1
    )
    select
        coalesce(va.cidade, la.cidade)::text as cidade,
        coalesce(va.valor_total, 0)::numeric as valor_total,
        coalesce(va.valor_total_enviados, 0)::numeric as valor_total_enviados,
        coalesce(la.quantidade_liberados, 0)::bigint as quantidade_liberados,
        case
            when coalesce(la.quantidade_liberados, 0) > 0
                then round(coalesce(va.valor_total_enviados, 0) / la.quantidade_liberados, 2)
            else 0::numeric
        end as custo_por_liberado
    from valores_agrupados va
    full join liberados_agrupados la
      on la.cidade = va.cidade
    where coalesce(va.valor_total, 0) > 0
       or coalesce(va.valor_total_enviados, 0) > 0
       or coalesce(la.quantidade_liberados, 0) > 0
    order by coalesce(va.valor_total, 0) desc, coalesce(va.cidade, la.cidade);
end;
$function$;

create or replace function public.get_fluxo_semanal(
    p_data_inicial date default null,
    p_data_final date default null,
    p_organization_id uuid default null,
    p_praca text default null
)
returns json
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
    v_start_date date;
    v_end_date date;
    v_org_uuid uuid;
    v_result json;
    v_max_last_active_week date;
begin
    v_start_date := coalesce(p_data_inicial, date_trunc('year', current_date)::date);
    v_end_date := coalesce(p_data_final, current_date);
    v_org_uuid := coalesce(p_organization_id, '00000000-0000-0000-0000-000000000001'::uuid);

    select max(last_active_week)
      into v_max_last_active_week
      from public.mv_entregadores_summary;

    with weeks as (
        select
            to_char(d, 'IYYY-"W"IW') as semana_iso,
            d::date as week_date
        from generate_series(
            date_trunc('week', v_start_date),
            date_trunc('week', v_end_date),
            '1 week'::interval
        ) d
    ),
    marketing_entregadores as materialized (
        select distinct dm.id_entregador
        from public.dados_marketing dm
        where dm.id_entregador is not null
          and dm.organization_id = v_org_uuid
    ),
    driver_weekly_rides as materialized (
        select
            mca.id_entregador,
            to_date(mca.ano_iso || lpad(mca.semana_numero, 2, '0'), 'IYYYIW') as week_date,
            sum(coalesce(mca.corridas_completadas, 0))::bigint as weekly_rides,
            max(mca.nome_entregador) as nome,
            bool_or(me.id_entregador is not null) as is_marketing
        from public.mv_corridas_agregadas mca
        left join marketing_entregadores me
          on me.id_entregador = mca.id_entregador
        where mca.organization_id = v_org_uuid
          and (p_praca is null or mca.praca = p_praca)
        group by mca.id_entregador, to_date(mca.ano_iso || lpad(mca.semana_numero, 2, '0'), 'IYYYIW')
    ),
    driver_cumulative as materialized (
        select
            dwr.id_entregador,
            dwr.week_date,
            dwr.weekly_rides,
            dwr.nome,
            dwr.is_marketing,
            sum(dwr.weekly_rides) over (
                partition by dwr.id_entregador
                order by dwr.week_date
            )::bigint as cumulative_rides
        from driver_weekly_rides dwr
    ),
    activation_weeks as materialized (
        select distinct on (dc.id_entregador)
            dc.id_entregador,
            dc.week_date as activation_week
        from driver_cumulative dc
        where dc.cumulative_rides >= 30
        order by dc.id_entregador, dc.week_date
    ),
    filtered_summary as materialized (
        select
            dwr.id_entregador,
            aw.activation_week,
            max(dwr.week_date) as last_active_week,
            sum(dwr.weekly_rides)::bigint as total_rides,
            bool_or(dwr.is_marketing) as is_marketing,
            max(dwr.nome) as nome
        from driver_weekly_rides dwr
        left join activation_weeks aw
          on aw.id_entregador = dwr.id_entregador
        group by dwr.id_entregador, aw.activation_week
    ),
    entradas_grouped as (
        select
            to_char(fs.activation_week, 'IYYY-"W"IW') as semana_iso,
            count(*) filter (where fs.is_marketing)::bigint as qtd_mkt,
            count(*) filter (where not fs.is_marketing)::bigint as qtd_ops,
            array_agg(fs.nome) filter (where fs.is_marketing) as nomes_mkt,
            array_agg(fs.nome) filter (where not fs.is_marketing) as nomes_ops
        from filtered_summary fs
        where fs.activation_week is not null
          and fs.activation_week >= v_start_date
          and fs.activation_week <= v_end_date
        group by 1
    ),
    saidas_grouped as (
        select
            to_char(fs.last_active_week, 'IYYY-"W"IW') as semana_iso,
            count(*) filter (where fs.is_marketing)::bigint as qtd_mkt_matured,
            count(*) filter (where not fs.is_marketing)::bigint as qtd_ops_matured,
            count(*) filter (where fs.is_marketing and fs.total_rides < 30)::bigint as qtd_mkt_novice,
            count(*) filter (where not fs.is_marketing and fs.total_rides < 30)::bigint as qtd_ops_novice,
            array_agg(fs.nome) filter (where fs.is_marketing) as nomes_mkt_matured,
            array_agg(fs.nome) filter (where not fs.is_marketing) as nomes_ops_matured,
            array_agg(fs.nome) filter (where fs.is_marketing and fs.total_rides < 30) as nomes_mkt_novice,
            array_agg(fs.nome) filter (where not fs.is_marketing and fs.total_rides < 30) as nomes_ops_novice
        from filtered_summary fs
        where fs.last_active_week >= v_start_date
          and fs.last_active_week <= v_end_date
          and fs.last_active_week < v_max_last_active_week
        group by 1
    ),
    weeks_ordered as (
        select
            dwr.id_entregador,
            dwr.week_date as week_start_date,
            lag(dwr.week_date) over (
                partition by dwr.id_entregador
                order by dwr.week_date
            ) as prev_week_date
        from driver_weekly_rides dwr
        where dwr.weekly_rides > 0
    ),
    retomada_raw as (
        select
            wo.week_start_date,
            wo.id_entregador,
            wo.prev_week_date as origin_date
        from weeks_ordered wo
        where wo.week_start_date >= v_start_date
          and wo.week_start_date <= v_end_date
          and (wo.prev_week_date is null or wo.prev_week_date < (wo.week_start_date - interval '1 week'))
          and exists (
              select 1
              from filtered_summary fs
              where fs.id_entregador = wo.id_entregador
                and fs.activation_week is not null
                and fs.activation_week < wo.week_start_date
          )
    ),
    retomada_breakdown as (
        select
            to_char(rr.week_start_date, 'IYYY-"W"IW') as semana_iso,
            to_char(rr.origin_date, 'IYYY-"W"IW') as origin_week,
            count(*)::bigint as qtd
        from retomada_raw rr
        where rr.origin_date is not null
        group by 1, 2
    ),
    retomada_grouped as (
        select
            to_char(rr.week_start_date, 'IYYY-"W"IW') as semana_iso,
            count(*) filter (where fs.is_marketing)::bigint as qtd_mkt,
            count(*) filter (where not fs.is_marketing)::bigint as qtd_ops,
            array_agg(fs.nome) filter (where fs.is_marketing) as nomes_mkt,
            array_agg(fs.nome) filter (where not fs.is_marketing) as nomes_ops
        from retomada_raw rr
        join filtered_summary fs
          on fs.id_entregador = rr.id_entregador
        group by 1
    ),
    retomada_json as (
        select
            rb.semana_iso,
            jsonb_object_agg(rb.origin_week, rb.qtd) as origin_json
        from retomada_breakdown rb
        group by rb.semana_iso
    ),
    base_ativa_raw as (
        select
            to_char(dwr.week_date, 'IYYY-"W"IW') as semana_iso,
            count(distinct dwr.id_entregador)::bigint as base_ativa
        from driver_weekly_rides dwr
        where dwr.week_date >= v_start_date
          and dwr.week_date <= v_end_date
          and dwr.weekly_rides > 0
        group by 1
    ),
    result as (
        select
            w.semana_iso as semana,
            (coalesce(eg.qtd_mkt, 0) + coalesce(eg.qtd_ops, 0))::bigint as entradas_total,
            coalesce(eg.qtd_mkt, 0)::bigint as entradas_mkt_count,
            coalesce(eg.nomes_mkt, array[]::text[]) as nomes_entradas_mkt,
            coalesce(eg.nomes_ops, array[]::text[]) as nomes_entradas_ops,
            (coalesce(sg.qtd_mkt_matured, 0) + coalesce(sg.qtd_ops_matured, 0))::bigint as saidas_total,
            coalesce(sg.qtd_mkt_matured, 0)::bigint as saidas_mkt_count,
            coalesce(sg.nomes_mkt_matured, array[]::text[]) as nomes_saidas_mkt,
            coalesce(sg.nomes_ops_matured, array[]::text[]) as nomes_saidas_ops,
            (coalesce(sg.qtd_mkt_novice, 0) + coalesce(sg.qtd_ops_novice, 0))::bigint as saidas_novos_total,
            coalesce(sg.nomes_mkt_novice, array[]::text[]) as nomes_saidas_novos_mkt,
            coalesce(sg.nomes_ops_novice, array[]::text[]) as nomes_saidas_ops,
            (coalesce(rg.qtd_mkt, 0) + coalesce(rg.qtd_ops, 0))::bigint as retomada_total,
            coalesce(rg.qtd_mkt, 0)::bigint as retomada_mkt_count,
            coalesce(rg.nomes_mkt, array[]::text[]) as nomes_retomada_mkt,
            coalesce(rg.nomes_ops, array[]::text[]) as nomes_retomada_ops,
            coalesce(rj.origin_json, '{}'::jsonb) as retomada_origins,
            ((coalesce(eg.qtd_mkt, 0) + coalesce(eg.qtd_ops, 0)) - (coalesce(sg.qtd_mkt_matured, 0) + coalesce(sg.qtd_ops_matured, 0)))::bigint as saldo,
            coalesce(ba.base_ativa, 0)::bigint as base_ativa,
            (coalesce(ba.base_ativa, 0) - coalesce(lag(ba.base_ativa) over (order by w.semana_iso), ba.base_ativa))::bigint as variacao_base
        from weeks w
        left join entradas_grouped eg on eg.semana_iso = w.semana_iso
        left join saidas_grouped sg on sg.semana_iso = w.semana_iso
        left join retomada_grouped rg on rg.semana_iso = w.semana_iso
        left join retomada_json rj on rj.semana_iso = w.semana_iso
        left join base_ativa_raw ba on ba.semana_iso = w.semana_iso
        order by w.semana_iso
    )
    select json_agg(row_to_json(result))
      into v_result
      from result;

    return coalesce(v_result, '[]'::json);
end;
$function$;
