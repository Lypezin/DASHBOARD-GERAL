create or replace function public._listar_valores_entregadores_detalhado_core(
    p_ano integer default null,
    p_semana integer default null,
    p_praca text default null,
    p_sub_praca text default null,
    p_origem text default null,
    p_data_inicial date default null,
    p_data_final date default null,
    p_organization_id text default null,
    p_limit integer default 25,
    p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
    v_result jsonb;
    v_org_filter uuid;
    v_is_admin boolean := false;
    v_pracas text[];
    v_sub_pracas text[];
    v_origens text[];
    v_limit integer := greatest(coalesce(p_limit, 25), 0);
    v_offset integer := greatest(coalesce(p_offset, 0), 0);
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

    if p_data_inicial is not null and p_data_final is not null then
        with aggregated_data as (
            select
                dc.pessoa_entregadora as nome_entregador,
                dc.id_da_pessoa_entregadora as id_entregador,
                dc.periodo as turno,
                dc.sub_praca,
                round((sum(dc.soma_das_taxas_das_corridas_aceitas)::numeric / 100), 2) as total_taxas,
                sum(dc.numero_de_corridas_aceitas) as numero_corridas_aceitas,
                case
                    when sum(dc.numero_de_corridas_aceitas) > 0 then round((sum(dc.soma_das_taxas_das_corridas_aceitas)::numeric / 100) / sum(dc.numero_de_corridas_aceitas), 2)
                    else 0
                end as taxa_media
            from public.dados_corridas dc
            where (v_org_filter is null or dc.organization_id = v_org_filter)
              and dc.data_do_periodo >= p_data_inicial
              and dc.data_do_periodo <= p_data_final
              and (v_pracas is null or dc.praca = any(v_pracas))
              and (v_sub_pracas is null or dc.sub_praca = any(v_sub_pracas))
              and (v_origens is null or dc.origem = any(v_origens))
              and dc.pessoa_entregadora is not null
            group by dc.id_da_pessoa_entregadora, dc.pessoa_entregadora, dc.periodo, dc.sub_praca
        ),
        ranked_data as (
            select aggregated_data.*, count(*) over() as total_count
            from aggregated_data
        ),
        paged_data as (
            select *
            from ranked_data
            order by total_taxas desc
            limit v_limit
            offset v_offset
        )
        select jsonb_build_object(
            'entregadores', coalesce(jsonb_agg(row_to_json(paged_data)), '[]'::jsonb),
            'total', coalesce(max(paged_data.total_count), 0)
        )
        into v_result
        from paged_data;
    elsif p_ano is not null and p_semana is not null then
        with aggregated_data as (
            select
                dc.pessoa_entregadora as nome_entregador,
                dc.id_da_pessoa_entregadora as id_entregador,
                dc.periodo as turno,
                dc.sub_praca,
                round((sum(dc.soma_das_taxas_das_corridas_aceitas)::numeric / 100), 2) as total_taxas,
                sum(dc.numero_de_corridas_aceitas) as numero_corridas_aceitas,
                case
                    when sum(dc.numero_de_corridas_aceitas) > 0 then round((sum(dc.soma_das_taxas_das_corridas_aceitas)::numeric / 100) / sum(dc.numero_de_corridas_aceitas), 2)
                    else 0
                end as taxa_media
            from public.dados_corridas dc
            where (v_org_filter is null or dc.organization_id = v_org_filter)
              and dc.ano_iso = p_ano
              and dc.semana_numero = p_semana
              and (v_pracas is null or dc.praca = any(v_pracas))
              and (v_sub_pracas is null or dc.sub_praca = any(v_sub_pracas))
              and (v_origens is null or dc.origem = any(v_origens))
              and dc.pessoa_entregadora is not null
            group by dc.id_da_pessoa_entregadora, dc.pessoa_entregadora, dc.periodo, dc.sub_praca
        ),
        ranked_data as (
            select aggregated_data.*, count(*) over() as total_count
            from aggregated_data
        ),
        paged_data as (
            select *
            from ranked_data
            order by total_taxas desc
            limit v_limit
            offset v_offset
        )
        select jsonb_build_object(
            'entregadores', coalesce(jsonb_agg(row_to_json(paged_data)), '[]'::jsonb),
            'total', coalesce(max(paged_data.total_count), 0)
        )
        into v_result
        from paged_data;
    elsif p_ano is not null then
        with aggregated_data as (
            select
                dc.pessoa_entregadora as nome_entregador,
                dc.id_da_pessoa_entregadora as id_entregador,
                dc.periodo as turno,
                dc.sub_praca,
                round((sum(dc.soma_das_taxas_das_corridas_aceitas)::numeric / 100), 2) as total_taxas,
                sum(dc.numero_de_corridas_aceitas) as numero_corridas_aceitas,
                case
                    when sum(dc.numero_de_corridas_aceitas) > 0 then round((sum(dc.soma_das_taxas_das_corridas_aceitas)::numeric / 100) / sum(dc.numero_de_corridas_aceitas), 2)
                    else 0
                end as taxa_media
            from public.dados_corridas dc
            where (v_org_filter is null or dc.organization_id = v_org_filter)
              and dc.ano_iso = p_ano
              and (v_pracas is null or dc.praca = any(v_pracas))
              and (v_sub_pracas is null or dc.sub_praca = any(v_sub_pracas))
              and (v_origens is null or dc.origem = any(v_origens))
              and dc.pessoa_entregadora is not null
            group by dc.id_da_pessoa_entregadora, dc.pessoa_entregadora, dc.periodo, dc.sub_praca
        ),
        ranked_data as (
            select aggregated_data.*, count(*) over() as total_count
            from aggregated_data
        ),
        paged_data as (
            select *
            from ranked_data
            order by total_taxas desc
            limit v_limit
            offset v_offset
        )
        select jsonb_build_object(
            'entregadores', coalesce(jsonb_agg(row_to_json(paged_data)), '[]'::jsonb),
            'total', coalesce(max(paged_data.total_count), 0)
        )
        into v_result
        from paged_data;
    else
        with aggregated_data as (
            select
                dc.pessoa_entregadora as nome_entregador,
                dc.id_da_pessoa_entregadora as id_entregador,
                dc.periodo as turno,
                dc.sub_praca,
                round((sum(dc.soma_das_taxas_das_corridas_aceitas)::numeric / 100), 2) as total_taxas,
                sum(dc.numero_de_corridas_aceitas) as numero_corridas_aceitas,
                case
                    when sum(dc.numero_de_corridas_aceitas) > 0 then round((sum(dc.soma_das_taxas_das_corridas_aceitas)::numeric / 100) / sum(dc.numero_de_corridas_aceitas), 2)
                    else 0
                end as taxa_media
            from public.dados_corridas dc
            where (v_org_filter is null or dc.organization_id = v_org_filter)
              and (v_pracas is null or dc.praca = any(v_pracas))
              and (v_sub_pracas is null or dc.sub_praca = any(v_sub_pracas))
              and (v_origens is null or dc.origem = any(v_origens))
              and dc.pessoa_entregadora is not null
            group by dc.id_da_pessoa_entregadora, dc.pessoa_entregadora, dc.periodo, dc.sub_praca
        ),
        ranked_data as (
            select aggregated_data.*, count(*) over() as total_count
            from aggregated_data
        ),
        paged_data as (
            select *
            from ranked_data
            order by total_taxas desc
            limit v_limit
            offset v_offset
        )
        select jsonb_build_object(
            'entregadores', coalesce(jsonb_agg(row_to_json(paged_data)), '[]'::jsonb),
            'total', coalesce(max(paged_data.total_count), 0)
        )
        into v_result
        from paged_data;
    end if;

    return coalesce(v_result, jsonb_build_object('entregadores', '[]'::jsonb, 'total', 0));
end;
$function$;

create or replace function public.listar_valores_entregadores_detalhado(
    p_ano integer default null,
    p_semana integer default null,
    p_praca text default null,
    p_sub_praca text default null,
    p_origem text default null,
    p_data_inicial date default null,
    p_data_final date default null,
    p_organization_id text default null,
    p_limit integer default 25,
    p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
begin
    return public._listar_valores_entregadores_detalhado_core(
        p_ano,
        p_semana,
        p_praca,
        p_sub_praca,
        p_origem,
        p_data_inicial,
        p_data_final,
        p_organization_id,
        p_limit,
        p_offset
    );
end;
$function$;

create or replace function public.listar_valores_entregadores_detalhado(
    p_ano integer default null,
    p_semana integer default null,
    p_praca text default null,
    p_sub_praca text default null,
    p_origem text default null,
    p_data_inicial date default null,
    p_data_final date default null,
    p_organization_id text default null,
    p_limit integer default 25,
    p_offset integer default 0,
    detailed boolean default true
)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
begin
    return public._listar_valores_entregadores_detalhado_core(
        p_ano,
        p_semana,
        p_praca,
        p_sub_praca,
        p_origem,
        p_data_inicial,
        p_data_final,
        p_organization_id,
        p_limit,
        p_offset
    );
end;
$function$;
