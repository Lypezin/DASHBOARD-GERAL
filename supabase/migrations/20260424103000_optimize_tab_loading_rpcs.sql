create or replace function public.listar_entregadores_v2(
    p_ano integer default null,
    p_semana integer default null,
    p_praca text default null,
    p_sub_praca text default null,
    p_origem text default null,
    p_data_inicial date default null,
    p_data_final date default null,
    p_organization_id text default null
)
returns jsonb
language plpgsql
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
        with filtered_data as (
            select
                mv.id_entregador,
                mv.nome_entregador,
                mv.corridas_ofertadas,
                mv.corridas_aceitas,
                mv.corridas_rejeitadas,
                mv.corridas_completadas,
                mv.total_segundos
            from public.mv_entregadores_agregado mv
            where (v_org_filter is null or mv.organization_id = v_org_filter)
              and mv.data_do_periodo >= p_data_inicial
              and mv.data_do_periodo <= p_data_final
              and (v_pracas is null or mv.praca = any(v_pracas))
              and (v_sub_pracas is null or mv.sub_praca = any(v_sub_pracas))
              and (v_origens is null or mv.origem = any(v_origens))
              and mv.nome_entregador is not null
        ),
        aggregated_data as (
            select
                id_entregador,
                nome_entregador,
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
            group by id_entregador, nome_entregador
        ),
        final_data as (
            select *
            from aggregated_data
            order by corridas_completadas desc
        )
        select jsonb_build_object(
            'entregadores', coalesce(jsonb_agg(row_to_json(final_data)), '[]'::jsonb),
            'total', coalesce((select count(*) from final_data), 0)
        )
        into v_result
        from final_data;
    elsif p_ano is not null and p_semana is not null then
        with filtered_data as (
            select
                mv.id_entregador,
                mv.nome_entregador,
                mv.corridas_ofertadas,
                mv.corridas_aceitas,
                mv.corridas_rejeitadas,
                mv.corridas_completadas,
                mv.total_segundos
            from public.mv_entregadores_agregado mv
            where (v_org_filter is null or mv.organization_id = v_org_filter)
              and mv.ano_iso = p_ano
              and mv.semana_numero = p_semana
              and (v_pracas is null or mv.praca = any(v_pracas))
              and (v_sub_pracas is null or mv.sub_praca = any(v_sub_pracas))
              and (v_origens is null or mv.origem = any(v_origens))
              and mv.nome_entregador is not null
        ),
        aggregated_data as (
            select
                id_entregador,
                nome_entregador,
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
            group by id_entregador, nome_entregador
        ),
        final_data as (
            select *
            from aggregated_data
            order by corridas_completadas desc
        )
        select jsonb_build_object(
            'entregadores', coalesce(jsonb_agg(row_to_json(final_data)), '[]'::jsonb),
            'total', coalesce((select count(*) from final_data), 0)
        )
        into v_result
        from final_data;
    elsif p_ano is not null then
        with filtered_data as (
            select
                mv.id_entregador,
                mv.nome_entregador,
                mv.corridas_ofertadas,
                mv.corridas_aceitas,
                mv.corridas_rejeitadas,
                mv.corridas_completadas,
                mv.total_segundos
            from public.mv_entregadores_agregado mv
            where (v_org_filter is null or mv.organization_id = v_org_filter)
              and mv.ano_iso = p_ano
              and (v_pracas is null or mv.praca = any(v_pracas))
              and (v_sub_pracas is null or mv.sub_praca = any(v_sub_pracas))
              and (v_origens is null or mv.origem = any(v_origens))
              and mv.nome_entregador is not null
        ),
        aggregated_data as (
            select
                id_entregador,
                nome_entregador,
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
            group by id_entregador, nome_entregador
        ),
        final_data as (
            select *
            from aggregated_data
            order by corridas_completadas desc
        )
        select jsonb_build_object(
            'entregadores', coalesce(jsonb_agg(row_to_json(final_data)), '[]'::jsonb),
            'total', coalesce((select count(*) from final_data), 0)
        )
        into v_result
        from final_data;
    else
        with filtered_data as (
            select
                mv.id_entregador,
                mv.nome_entregador,
                mv.corridas_ofertadas,
                mv.corridas_aceitas,
                mv.corridas_rejeitadas,
                mv.corridas_completadas,
                mv.total_segundos
            from public.mv_entregadores_agregado mv
            where (v_org_filter is null or mv.organization_id = v_org_filter)
              and mv.data_do_periodo >= current_date - 30
              and (v_pracas is null or mv.praca = any(v_pracas))
              and (v_sub_pracas is null or mv.sub_praca = any(v_sub_pracas))
              and (v_origens is null or mv.origem = any(v_origens))
              and mv.nome_entregador is not null
        ),
        aggregated_data as (
            select
                id_entregador,
                nome_entregador,
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
            group by id_entregador, nome_entregador
        ),
        final_data as (
            select *
            from aggregated_data
            order by corridas_completadas desc
        )
        select jsonb_build_object(
            'entregadores', coalesce(jsonb_agg(row_to_json(final_data)), '[]'::jsonb),
            'total', coalesce((select count(*) from final_data), 0)
        )
        into v_result
        from final_data;
    end if;

    return coalesce(v_result, jsonb_build_object('entregadores', '[]'::jsonb, 'total', 0));
end;
$function$;

create or replace function public.listar_valores_entregadores(
    p_ano integer default null,
    p_semana integer default null,
    p_praca text default null,
    p_sub_praca text default null,
    p_origem text default null,
    p_data_inicial date default null,
    p_data_final date default null,
    p_organization_id text default null
)
returns jsonb
language plpgsql
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
        with filtered_data as (
            select
                mv.id_entregador,
                mv.nome_entregador,
                mv.numero_corridas_aceitas,
                mv.soma_taxas_aceitas
            from public.mv_valores_entregador mv
            where (v_org_filter is null or mv.organization_id = v_org_filter)
              and mv.data_do_periodo >= p_data_inicial
              and mv.data_do_periodo <= p_data_final
              and (v_pracas is null or mv.praca = any(v_pracas))
              and (v_sub_pracas is null or mv.sub_praca = any(v_sub_pracas))
              and (v_origens is null or mv.origem = any(v_origens))
              and mv.nome_entregador is not null
        ),
        aggregated_data as (
            select
                nome_entregador,
                id_entregador,
                round((sum(soma_taxas_aceitas)::numeric / 100), 2) as total_taxas,
                sum(numero_corridas_aceitas) as numero_corridas_aceitas,
                case
                    when sum(numero_corridas_aceitas) > 0 then round((sum(soma_taxas_aceitas)::numeric / 100) / sum(numero_corridas_aceitas), 2)
                    else 0
                end as taxa_media,
                count(*) over() as total_count
            from filtered_data
            group by id_entregador, nome_entregador
        )
        select jsonb_build_object(
            'entregadores', coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb),
            'total', coalesce(max(t.total_count), 0)
        )
        into v_result
        from (
            select *
            from aggregated_data
            order by total_taxas desc
        ) t;
    elsif p_ano is not null and p_semana is not null then
        with filtered_data as (
            select
                mv.id_entregador,
                mv.nome_entregador,
                mv.numero_corridas_aceitas,
                mv.soma_taxas_aceitas
            from public.mv_valores_entregador mv
            where (v_org_filter is null or mv.organization_id = v_org_filter)
              and mv.ano_iso = p_ano
              and mv.semana_numero = p_semana
              and (v_pracas is null or mv.praca = any(v_pracas))
              and (v_sub_pracas is null or mv.sub_praca = any(v_sub_pracas))
              and (v_origens is null or mv.origem = any(v_origens))
              and mv.nome_entregador is not null
        ),
        aggregated_data as (
            select
                nome_entregador,
                id_entregador,
                round((sum(soma_taxas_aceitas)::numeric / 100), 2) as total_taxas,
                sum(numero_corridas_aceitas) as numero_corridas_aceitas,
                case
                    when sum(numero_corridas_aceitas) > 0 then round((sum(soma_taxas_aceitas)::numeric / 100) / sum(numero_corridas_aceitas), 2)
                    else 0
                end as taxa_media,
                count(*) over() as total_count
            from filtered_data
            group by id_entregador, nome_entregador
        )
        select jsonb_build_object(
            'entregadores', coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb),
            'total', coalesce(max(t.total_count), 0)
        )
        into v_result
        from (
            select *
            from aggregated_data
            order by total_taxas desc
        ) t;
    elsif p_ano is not null then
        with filtered_data as (
            select
                mv.id_entregador,
                mv.nome_entregador,
                mv.numero_corridas_aceitas,
                mv.soma_taxas_aceitas
            from public.mv_valores_entregador mv
            where (v_org_filter is null or mv.organization_id = v_org_filter)
              and mv.ano_iso = p_ano
              and (v_pracas is null or mv.praca = any(v_pracas))
              and (v_sub_pracas is null or mv.sub_praca = any(v_sub_pracas))
              and (v_origens is null or mv.origem = any(v_origens))
              and mv.nome_entregador is not null
        ),
        aggregated_data as (
            select
                nome_entregador,
                id_entregador,
                round((sum(soma_taxas_aceitas)::numeric / 100), 2) as total_taxas,
                sum(numero_corridas_aceitas) as numero_corridas_aceitas,
                case
                    when sum(numero_corridas_aceitas) > 0 then round((sum(soma_taxas_aceitas)::numeric / 100) / sum(numero_corridas_aceitas), 2)
                    else 0
                end as taxa_media,
                count(*) over() as total_count
            from filtered_data
            group by id_entregador, nome_entregador
        )
        select jsonb_build_object(
            'entregadores', coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb),
            'total', coalesce(max(t.total_count), 0)
        )
        into v_result
        from (
            select *
            from aggregated_data
            order by total_taxas desc
        ) t;
    else
        with filtered_data as (
            select
                mv.id_entregador,
                mv.nome_entregador,
                mv.numero_corridas_aceitas,
                mv.soma_taxas_aceitas
            from public.mv_valores_entregador mv
            where (v_org_filter is null or mv.organization_id = v_org_filter)
              and mv.data_do_periodo >= current_date - 14
              and (v_pracas is null or mv.praca = any(v_pracas))
              and (v_sub_pracas is null or mv.sub_praca = any(v_sub_pracas))
              and (v_origens is null or mv.origem = any(v_origens))
              and mv.nome_entregador is not null
        ),
        aggregated_data as (
            select
                nome_entregador,
                id_entregador,
                round((sum(soma_taxas_aceitas)::numeric / 100), 2) as total_taxas,
                sum(numero_corridas_aceitas) as numero_corridas_aceitas,
                case
                    when sum(numero_corridas_aceitas) > 0 then round((sum(soma_taxas_aceitas)::numeric / 100) / sum(numero_corridas_aceitas), 2)
                    else 0
                end as taxa_media,
                count(*) over() as total_count
            from filtered_data
            group by id_entregador, nome_entregador
        )
        select jsonb_build_object(
            'entregadores', coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb),
            'total', coalesce(max(t.total_count), 0)
        )
        into v_result
        from (
            select *
            from aggregated_data
            order by total_taxas desc
        ) t;
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
    return public.listar_valores_entregadores_detalhado(
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

create or replace function public.obter_resumo_valores_breakdown(
    p_ano integer default null,
    p_semana integer default null,
    p_praca text default null,
    p_sub_praca text default null,
    p_origem text default null,
    p_data_inicial date default null,
    p_data_final date default null,
    p_organization_id text default null
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
        with filtered_mv as (
            select
                mv.turno,
                mv.sub_praca,
                mv.total_valor_bruto_centavos,
                mv.total_aceitas
            from public.mv_dashboard_resumo_v2 mv
            where (v_org_filter is null or mv.organization_id = v_org_filter)
              and mv.data_do_periodo >= p_data_inicial
              and mv.data_do_periodo <= p_data_final
              and (v_pracas is null or mv.praca = any(v_pracas))
              and (v_sub_pracas is null or mv.sub_praca = any(v_sub_pracas))
              and (v_origens is null or mv.origem = any(v_origens))
        ),
        turno_agg as (
            select
                turno,
                round(sum(total_valor_bruto_centavos)::numeric / 100, 2) as total_valor,
                sum(total_aceitas) as total_corridas
            from filtered_mv
            where turno is not null
            group by turno
            order by total_valor desc
        ),
        sub_praca_agg as (
            select
                sub_praca,
                round(sum(total_valor_bruto_centavos)::numeric / 100, 2) as total_valor,
                sum(total_aceitas) as total_corridas
            from filtered_mv
            where sub_praca is not null
            group by sub_praca
            order by total_valor desc
        )
        select jsonb_build_object(
            'by_turno', (select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from turno_agg t),
            'by_sub_praca', (select coalesce(jsonb_agg(row_to_json(s)), '[]'::jsonb) from sub_praca_agg s)
        )
        into v_result;
    elsif p_ano is not null and p_semana is not null then
        with filtered_mv as (
            select
                mv.turno,
                mv.sub_praca,
                mv.total_valor_bruto_centavos,
                mv.total_aceitas
            from public.mv_dashboard_resumo_v2 mv
            where (v_org_filter is null or mv.organization_id = v_org_filter)
              and mv.ano_iso = p_ano
              and mv.semana_iso = p_semana
              and (v_pracas is null or mv.praca = any(v_pracas))
              and (v_sub_pracas is null or mv.sub_praca = any(v_sub_pracas))
              and (v_origens is null or mv.origem = any(v_origens))
        ),
        turno_agg as (
            select
                turno,
                round(sum(total_valor_bruto_centavos)::numeric / 100, 2) as total_valor,
                sum(total_aceitas) as total_corridas
            from filtered_mv
            where turno is not null
            group by turno
            order by total_valor desc
        ),
        sub_praca_agg as (
            select
                sub_praca,
                round(sum(total_valor_bruto_centavos)::numeric / 100, 2) as total_valor,
                sum(total_aceitas) as total_corridas
            from filtered_mv
            where sub_praca is not null
            group by sub_praca
            order by total_valor desc
        )
        select jsonb_build_object(
            'by_turno', (select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from turno_agg t),
            'by_sub_praca', (select coalesce(jsonb_agg(row_to_json(s)), '[]'::jsonb) from sub_praca_agg s)
        )
        into v_result;
    elsif p_ano is not null then
        with filtered_mv as (
            select
                mv.turno,
                mv.sub_praca,
                mv.total_valor_bruto_centavos,
                mv.total_aceitas
            from public.mv_dashboard_resumo_v2 mv
            where (v_org_filter is null or mv.organization_id = v_org_filter)
              and mv.ano_iso = p_ano
              and (v_pracas is null or mv.praca = any(v_pracas))
              and (v_sub_pracas is null or mv.sub_praca = any(v_sub_pracas))
              and (v_origens is null or mv.origem = any(v_origens))
        ),
        turno_agg as (
            select
                turno,
                round(sum(total_valor_bruto_centavos)::numeric / 100, 2) as total_valor,
                sum(total_aceitas) as total_corridas
            from filtered_mv
            where turno is not null
            group by turno
            order by total_valor desc
        ),
        sub_praca_agg as (
            select
                sub_praca,
                round(sum(total_valor_bruto_centavos)::numeric / 100, 2) as total_valor,
                sum(total_aceitas) as total_corridas
            from filtered_mv
            where sub_praca is not null
            group by sub_praca
            order by total_valor desc
        )
        select jsonb_build_object(
            'by_turno', (select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from turno_agg t),
            'by_sub_praca', (select coalesce(jsonb_agg(row_to_json(s)), '[]'::jsonb) from sub_praca_agg s)
        )
        into v_result;
    else
        with filtered_mv as (
            select
                mv.turno,
                mv.sub_praca,
                mv.total_valor_bruto_centavos,
                mv.total_aceitas
            from public.mv_dashboard_resumo_v2 mv
            where (v_org_filter is null or mv.organization_id = v_org_filter)
              and (v_pracas is null or mv.praca = any(v_pracas))
              and (v_sub_pracas is null or mv.sub_praca = any(v_sub_pracas))
              and (v_origens is null or mv.origem = any(v_origens))
        ),
        turno_agg as (
            select
                turno,
                round(sum(total_valor_bruto_centavos)::numeric / 100, 2) as total_valor,
                sum(total_aceitas) as total_corridas
            from filtered_mv
            where turno is not null
            group by turno
            order by total_valor desc
        ),
        sub_praca_agg as (
            select
                sub_praca,
                round(sum(total_valor_bruto_centavos)::numeric / 100, 2) as total_valor,
                sum(total_aceitas) as total_corridas
            from filtered_mv
            where sub_praca is not null
            group by sub_praca
            order by total_valor desc
        )
        select jsonb_build_object(
            'by_turno', (select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from turno_agg t),
            'by_sub_praca', (select coalesce(jsonb_agg(row_to_json(s)), '[]'::jsonb) from sub_praca_agg s)
        )
        into v_result;
    end if;

    return coalesce(v_result, jsonb_build_object('by_turno', '[]'::jsonb, 'by_sub_praca', '[]'::jsonb));
end;
$function$;

create or replace function public.resumo_semanal_drivers(
    p_ano integer,
    p_organization_id text,
    p_pracas text[] default null
)
returns table(ano integer, semana integer, total_drivers bigint, total_slots bigint)
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
    v_org_filter uuid;
    v_user_id uuid;
    v_pracas text[];
begin
    v_user_id := auth.uid();

    if p_organization_id is not null and p_organization_id <> '' then
        begin
            v_org_filter := p_organization_id::uuid;
        exception when others then
            select organization_id
            into v_org_filter
            from public.user_profiles
            where id = v_user_id;
        end;
    else
        select organization_id
        into v_org_filter
        from public.user_profiles
        where id = v_user_id;
    end if;

    if p_pracas is not null and cardinality(p_pracas) > 0 then
        select array_agg(item)
        into v_pracas
        from (
            select distinct btrim(value) as item
            from unnest(p_pracas) as value
            where value is not null
              and btrim(value) <> ''
              and lower(btrim(value)) not in ('todas', 'todos', 'all')
        ) praca_values;
    end if;

    if v_org_filter is null then
        return;
    end if;

    if p_ano is not null and v_pracas is not null then
        return query
        select
            dc.ano_iso::integer as ano,
            dc.semana_numero::integer as semana,
            count(distinct dc.id_da_pessoa_entregadora) as total_drivers,
            sum(dc.numero_minimo_de_entregadores_regulares_na_escala)::bigint as total_slots
        from public.dados_corridas dc
        where dc.organization_id = v_org_filter
          and dc.ano_iso = p_ano
          and dc.praca = any(v_pracas)
          and dc.numero_de_corridas_completadas > 0
        group by dc.ano_iso, dc.semana_numero
        order by dc.ano_iso desc, dc.semana_numero desc;
    elsif p_ano is not null then
        return query
        select
            dc.ano_iso::integer as ano,
            dc.semana_numero::integer as semana,
            count(distinct dc.id_da_pessoa_entregadora) as total_drivers,
            sum(dc.numero_minimo_de_entregadores_regulares_na_escala)::bigint as total_slots
        from public.dados_corridas dc
        where dc.organization_id = v_org_filter
          and dc.ano_iso = p_ano
          and dc.numero_de_corridas_completadas > 0
        group by dc.ano_iso, dc.semana_numero
        order by dc.ano_iso desc, dc.semana_numero desc;
    elsif v_pracas is not null then
        return query
        select
            dc.ano_iso::integer as ano,
            dc.semana_numero::integer as semana,
            count(distinct dc.id_da_pessoa_entregadora) as total_drivers,
            sum(dc.numero_minimo_de_entregadores_regulares_na_escala)::bigint as total_slots
        from public.dados_corridas dc
        where dc.organization_id = v_org_filter
          and dc.praca = any(v_pracas)
          and dc.numero_de_corridas_completadas > 0
        group by dc.ano_iso, dc.semana_numero
        order by dc.ano_iso desc, dc.semana_numero desc;
    else
        return query
        select
            dc.ano_iso::integer as ano,
            dc.semana_numero::integer as semana,
            count(distinct dc.id_da_pessoa_entregadora) as total_drivers,
            sum(dc.numero_minimo_de_entregadores_regulares_na_escala)::bigint as total_slots
        from public.dados_corridas dc
        where dc.organization_id = v_org_filter
          and dc.numero_de_corridas_completadas > 0
        group by dc.ano_iso, dc.semana_numero
        order by dc.ano_iso desc, dc.semana_numero desc;
    end if;
end;
$function$;

create or replace function public.resumo_semanal_pedidos(
    p_ano integer,
    p_organization_id text,
    p_pracas text[] default null
)
returns table(
    ano integer,
    semana integer,
    total_drivers bigint,
    total_slots bigint,
    total_pedidos bigint,
    total_sh numeric,
    aderencia_media numeric,
    utr numeric,
    aderencia numeric,
    rejeite numeric
)
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
    v_org_filter uuid;
    v_user_id uuid;
    v_pracas text[];
begin
    v_user_id := auth.uid();

    if p_organization_id is not null and p_organization_id <> '' then
        begin
            v_org_filter := p_organization_id::uuid;
        exception when others then
            select organization_id
            into v_org_filter
            from public.user_profiles
            where id = v_user_id;
        end;
    else
        select organization_id
        into v_org_filter
        from public.user_profiles
        where id = v_user_id;
    end if;

    if p_pracas is not null and cardinality(p_pracas) > 0 then
        select array_agg(item)
        into v_pracas
        from (
            select distinct btrim(value) as item
            from unnest(p_pracas) as value
            where value is not null
              and btrim(value) <> ''
              and lower(btrim(value)) not in ('todas', 'todos', 'all')
        ) praca_values;
    end if;

    if v_org_filter is null then
        return;
    end if;

    if p_ano is not null and v_pracas is not null then
        return query
        with entregador_stats as (
            select
                dc.ano_iso,
                dc.semana_numero,
                count(distinct dc.id_da_pessoa_entregadora) as active_drivers,
                sum(dc.numero_minimo_de_entregadores_regulares_na_escala) as total_min_slots,
                avg(
                    case
                        when dc.numero_de_corridas_ofertadas > 0 then (dc.numero_de_corridas_aceitas::numeric / dc.numero_de_corridas_ofertadas::numeric * 100)
                        else 0
                    end
                ) as avg_individual_adherence
            from public.dados_corridas dc
            where dc.organization_id = v_org_filter
              and dc.ano_iso = p_ano
              and dc.praca = any(v_pracas)
            group by dc.ano_iso, dc.semana_numero
        ),
        dashboard_stats as (
            select
                mv.ano_iso,
                mv.semana_iso,
                sum(mv.total_completadas) as total_pedidos,
                sum(mv.segundos_realizados) as total_seconds_realized,
                sum(mv.segundos_planejados) as total_seconds_planned,
                sum(mv.total_ofertadas) as total_ofertadas,
                sum(mv.total_rejeitadas) as total_rejeitadas
            from public.mv_dashboard_resumo mv
            where mv.organization_id = v_org_filter
              and mv.ano_iso = p_ano
              and mv.praca = any(v_pracas)
            group by mv.ano_iso, mv.semana_iso
        )
        select
            ds.ano_iso::integer as ano,
            ds.semana_iso::integer as semana,
            coalesce(es.active_drivers, 0)::bigint as total_drivers,
            coalesce(es.total_min_slots, 0)::bigint as total_slots,
            coalesce(ds.total_pedidos, 0)::bigint,
            (coalesce(ds.total_seconds_realized, 0) / 3600)::numeric as total_sh,
            coalesce(es.avg_individual_adherence, 0)::numeric as aderencia_media,
            case
                when ds.total_seconds_realized > 0 then (ds.total_pedidos::numeric / (ds.total_seconds_realized::numeric / 3600))
                else 0
            end as utr,
            case
                when ds.total_seconds_planned > 0 then (ds.total_seconds_realized::numeric / ds.total_seconds_planned::numeric * 100)
                else 0
            end as aderencia,
            case
                when ds.total_ofertadas > 0 then (ds.total_rejeitadas::numeric / ds.total_ofertadas::numeric * 100)
                else 0
            end as rejeite
        from dashboard_stats ds
        left join entregador_stats es
            on ds.ano_iso = es.ano_iso
           and ds.semana_iso = es.semana_numero
        order by ds.ano_iso desc, ds.semana_iso desc;
    elsif p_ano is not null then
        return query
        with entregador_stats as (
            select
                dc.ano_iso,
                dc.semana_numero,
                count(distinct dc.id_da_pessoa_entregadora) as active_drivers,
                sum(dc.numero_minimo_de_entregadores_regulares_na_escala) as total_min_slots,
                avg(
                    case
                        when dc.numero_de_corridas_ofertadas > 0 then (dc.numero_de_corridas_aceitas::numeric / dc.numero_de_corridas_ofertadas::numeric * 100)
                        else 0
                    end
                ) as avg_individual_adherence
            from public.dados_corridas dc
            where dc.organization_id = v_org_filter
              and dc.ano_iso = p_ano
            group by dc.ano_iso, dc.semana_numero
        ),
        dashboard_stats as (
            select
                mv.ano_iso,
                mv.semana_iso,
                sum(mv.total_completadas) as total_pedidos,
                sum(mv.segundos_realizados) as total_seconds_realized,
                sum(mv.segundos_planejados) as total_seconds_planned,
                sum(mv.total_ofertadas) as total_ofertadas,
                sum(mv.total_rejeitadas) as total_rejeitadas
            from public.mv_dashboard_resumo mv
            where mv.organization_id = v_org_filter
              and mv.ano_iso = p_ano
            group by mv.ano_iso, mv.semana_iso
        )
        select
            ds.ano_iso::integer as ano,
            ds.semana_iso::integer as semana,
            coalesce(es.active_drivers, 0)::bigint as total_drivers,
            coalesce(es.total_min_slots, 0)::bigint as total_slots,
            coalesce(ds.total_pedidos, 0)::bigint,
            (coalesce(ds.total_seconds_realized, 0) / 3600)::numeric as total_sh,
            coalesce(es.avg_individual_adherence, 0)::numeric as aderencia_media,
            case
                when ds.total_seconds_realized > 0 then (ds.total_pedidos::numeric / (ds.total_seconds_realized::numeric / 3600))
                else 0
            end as utr,
            case
                when ds.total_seconds_planned > 0 then (ds.total_seconds_realized::numeric / ds.total_seconds_planned::numeric * 100)
                else 0
            end as aderencia,
            case
                when ds.total_ofertadas > 0 then (ds.total_rejeitadas::numeric / ds.total_ofertadas::numeric * 100)
                else 0
            end as rejeite
        from dashboard_stats ds
        left join entregador_stats es
            on ds.ano_iso = es.ano_iso
           and ds.semana_iso = es.semana_numero
        order by ds.ano_iso desc, ds.semana_iso desc;
    elsif v_pracas is not null then
        return query
        with entregador_stats as (
            select
                dc.ano_iso,
                dc.semana_numero,
                count(distinct dc.id_da_pessoa_entregadora) as active_drivers,
                sum(dc.numero_minimo_de_entregadores_regulares_na_escala) as total_min_slots,
                avg(
                    case
                        when dc.numero_de_corridas_ofertadas > 0 then (dc.numero_de_corridas_aceitas::numeric / dc.numero_de_corridas_ofertadas::numeric * 100)
                        else 0
                    end
                ) as avg_individual_adherence
            from public.dados_corridas dc
            where dc.organization_id = v_org_filter
              and dc.praca = any(v_pracas)
            group by dc.ano_iso, dc.semana_numero
        ),
        dashboard_stats as (
            select
                mv.ano_iso,
                mv.semana_iso,
                sum(mv.total_completadas) as total_pedidos,
                sum(mv.segundos_realizados) as total_seconds_realized,
                sum(mv.segundos_planejados) as total_seconds_planned,
                sum(mv.total_ofertadas) as total_ofertadas,
                sum(mv.total_rejeitadas) as total_rejeitadas
            from public.mv_dashboard_resumo mv
            where mv.organization_id = v_org_filter
              and mv.praca = any(v_pracas)
            group by mv.ano_iso, mv.semana_iso
        )
        select
            ds.ano_iso::integer as ano,
            ds.semana_iso::integer as semana,
            coalesce(es.active_drivers, 0)::bigint as total_drivers,
            coalesce(es.total_min_slots, 0)::bigint as total_slots,
            coalesce(ds.total_pedidos, 0)::bigint,
            (coalesce(ds.total_seconds_realized, 0) / 3600)::numeric as total_sh,
            coalesce(es.avg_individual_adherence, 0)::numeric as aderencia_media,
            case
                when ds.total_seconds_realized > 0 then (ds.total_pedidos::numeric / (ds.total_seconds_realized::numeric / 3600))
                else 0
            end as utr,
            case
                when ds.total_seconds_planned > 0 then (ds.total_seconds_realized::numeric / ds.total_seconds_planned::numeric * 100)
                else 0
            end as aderencia,
            case
                when ds.total_ofertadas > 0 then (ds.total_rejeitadas::numeric / ds.total_ofertadas::numeric * 100)
                else 0
            end as rejeite
        from dashboard_stats ds
        left join entregador_stats es
            on ds.ano_iso = es.ano_iso
           and ds.semana_iso = es.semana_numero
        order by ds.ano_iso desc, ds.semana_iso desc;
    else
        return query
        with entregador_stats as (
            select
                dc.ano_iso,
                dc.semana_numero,
                count(distinct dc.id_da_pessoa_entregadora) as active_drivers,
                sum(dc.numero_minimo_de_entregadores_regulares_na_escala) as total_min_slots,
                avg(
                    case
                        when dc.numero_de_corridas_ofertadas > 0 then (dc.numero_de_corridas_aceitas::numeric / dc.numero_de_corridas_ofertadas::numeric * 100)
                        else 0
                    end
                ) as avg_individual_adherence
            from public.dados_corridas dc
            where dc.organization_id = v_org_filter
            group by dc.ano_iso, dc.semana_numero
        ),
        dashboard_stats as (
            select
                mv.ano_iso,
                mv.semana_iso,
                sum(mv.total_completadas) as total_pedidos,
                sum(mv.segundos_realizados) as total_seconds_realized,
                sum(mv.segundos_planejados) as total_seconds_planned,
                sum(mv.total_ofertadas) as total_ofertadas,
                sum(mv.total_rejeitadas) as total_rejeitadas
            from public.mv_dashboard_resumo mv
            where mv.organization_id = v_org_filter
            group by mv.ano_iso, mv.semana_iso
        )
        select
            ds.ano_iso::integer as ano,
            ds.semana_iso::integer as semana,
            coalesce(es.active_drivers, 0)::bigint as total_drivers,
            coalesce(es.total_min_slots, 0)::bigint as total_slots,
            coalesce(ds.total_pedidos, 0)::bigint,
            (coalesce(ds.total_seconds_realized, 0) / 3600)::numeric as total_sh,
            coalesce(es.avg_individual_adherence, 0)::numeric as aderencia_media,
            case
                when ds.total_seconds_realized > 0 then (ds.total_pedidos::numeric / (ds.total_seconds_realized::numeric / 3600))
                else 0
            end as utr,
            case
                when ds.total_seconds_planned > 0 then (ds.total_seconds_realized::numeric / ds.total_seconds_planned::numeric * 100)
                else 0
            end as aderencia,
            case
                when ds.total_ofertadas > 0 then (ds.total_rejeitadas::numeric / ds.total_ofertadas::numeric * 100)
                else 0
            end as rejeite
        from dashboard_stats ds
        left join entregador_stats es
            on ds.ano_iso = es.ano_iso
           and ds.semana_iso = es.semana_numero
        order by ds.ano_iso desc, ds.semana_iso desc;
    end if;
end;
$function$;
