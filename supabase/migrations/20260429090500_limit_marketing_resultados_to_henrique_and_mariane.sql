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
            trim(dm.responsavel) as responsavel,
            case
                when dm.regiao_atuacao = 'ABC 2.0' and dm.sub_praca_abc in ('Vila Aquino', 'São Caetano') then 'Santo André'
                when dm.regiao_atuacao = 'ABC 2.0' and dm.sub_praca_abc in ('Diadema', 'Nova petrópolis', 'Rudge Ramos') then 'São Bernardo'
                else dm.regiao_atuacao
            end as cidade,
            dm.data_envio,
            dm.data_liberacao,
            dm.status
        from public.dados_marketing dm
        where trim(dm.responsavel) in ('Henrique Oliveira', 'Mariane Zocoli')
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
                when trim(dvc.id_atendente::text) = '6517' then 'Mariane Zocoli'
                when trim(dvc.id_atendente::text) in ('5447', '7155') then 'Henrique Oliveira'
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
        where trim(dvc.id_atendente::text) in ('6517', '5447', '7155')
          and (p_organization_id is null or dvc.organization_id = p_organization_id)
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
