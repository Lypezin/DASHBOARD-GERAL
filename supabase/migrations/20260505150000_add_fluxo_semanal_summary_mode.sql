-- Add a lightweight mode for Marketing > Entrada/Saida.
-- Existing 4-arg RPC stays unchanged. The app can call the 5-arg overload with
-- p_include_names=false to render the screen quickly, then load names on demand.

drop function if exists public.get_fluxo_semanal(date, date, uuid, text, boolean);

create or replace function public.get_fluxo_semanal(
    p_data_inicial date,
    p_data_final date,
    p_organization_id uuid,
    p_praca text,
    p_include_names boolean
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
    v_start_week date;
    v_end_week date;
    v_org_uuid uuid;
    v_result json;
    v_current_week_start date;
    v_max_observed_week date;
    v_exit_reference_week date;
begin
    if p_include_names then
        return public.get_fluxo_semanal(
            p_data_inicial,
            p_data_final,
            p_organization_id,
            p_praca
        );
    end if;

    v_start_date := coalesce(p_data_inicial, date_trunc('year', current_date)::date);
    v_end_date := coalesce(p_data_final, current_date);
    v_start_week := date_trunc('week', v_start_date)::date;
    v_end_week := date_trunc('week', v_end_date)::date;
    v_current_week_start := date_trunc('week', current_date)::date;
    v_org_uuid := coalesce(p_organization_id, '00000000-0000-0000-0000-000000000001'::uuid);

    select max(mca.week_start_date)
      into v_max_observed_week
      from public.vw_corridas_agregadas_current mca
     where mca.organization_id = v_org_uuid
       and mca.week_start_date <= v_end_week
       and (p_praca is null or mca.praca = p_praca);

    v_exit_reference_week := least(
        coalesce(v_max_observed_week, v_end_week),
        v_current_week_start - interval '7 days'
    )::date;

    with weeks as (
        select
            to_char(d, 'IYYY-"W"IW') as semana_iso,
            d::date as week_date
        from generate_series(v_start_week, v_end_week, '1 week'::interval) d
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
            mca.week_start_date as week_date,
            sum(coalesce(mca.corridas_completadas, 0))::bigint as weekly_rides,
            max(mca.nome_entregador) as nome,
            bool_or(me.id_entregador is not null) as is_marketing
        from public.vw_corridas_agregadas_current mca
        left join marketing_entregadores me
          on me.id_entregador = mca.id_entregador
        where mca.organization_id = v_org_uuid
          and mca.week_start_date <= v_end_week
          and (p_praca is null or mca.praca = p_praca)
        group by mca.id_entregador, mca.week_start_date
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
            count(*) filter (where not fs.is_marketing)::bigint as qtd_ops
        from filtered_summary fs
        where fs.activation_week is not null
          and fs.activation_week >= v_start_week
          and fs.activation_week <= v_end_week
        group by 1
    ),
    saidas_grouped as (
        select
            to_char(fs.last_active_week, 'IYYY-"W"IW') as semana_iso,
            count(*) filter (where fs.is_marketing)::bigint as qtd_mkt_matured,
            count(*) filter (where not fs.is_marketing)::bigint as qtd_ops_matured,
            count(*) filter (where fs.is_marketing and fs.total_rides < 30)::bigint as qtd_mkt_novice,
            count(*) filter (where not fs.is_marketing and fs.total_rides < 30)::bigint as qtd_ops_novice
        from filtered_summary fs
        where fs.last_active_week >= v_start_week
          and fs.last_active_week <= v_end_week
          and fs.last_active_week < coalesce(v_exit_reference_week, fs.last_active_week + interval '1 week')
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
        where wo.week_start_date >= v_start_week
          and wo.week_start_date <= v_end_week
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
            count(*) filter (where not fs.is_marketing)::bigint as qtd_ops
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
        where dwr.week_date >= v_start_week
          and dwr.week_date <= v_end_week
          and dwr.weekly_rides > 0
        group by 1
    ),
    result as (
        select
            w.semana_iso as semana,
            (coalesce(eg.qtd_mkt, 0) + coalesce(eg.qtd_ops, 0))::bigint as entradas_total,
            coalesce(eg.qtd_mkt, 0)::bigint as entradas_mkt_count,
            array[]::text[] as nomes_entradas_mkt,
            array[]::text[] as nomes_entradas_ops,
            (coalesce(sg.qtd_mkt_matured, 0) + coalesce(sg.qtd_ops_matured, 0))::bigint as saidas_total,
            coalesce(sg.qtd_mkt_matured, 0)::bigint as saidas_mkt_count,
            array[]::text[] as nomes_saidas_mkt,
            array[]::text[] as nomes_saidas_ops,
            (coalesce(sg.qtd_mkt_novice, 0) + coalesce(sg.qtd_ops_novice, 0))::bigint as saidas_novos_total,
            array[]::text[] as nomes_saidas_novos_mkt,
            array[]::text[] as nomes_saidas_novos_ops,
            (coalesce(rg.qtd_mkt, 0) + coalesce(rg.qtd_ops, 0))::bigint as retomada_total,
            coalesce(rg.qtd_mkt, 0)::bigint as retomada_mkt_count,
            array[]::text[] as nomes_retomada_mkt,
            array[]::text[] as nomes_retomada_ops,
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
