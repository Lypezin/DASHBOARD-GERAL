-- Consolida variacoes de nome do mesmo entregador em uma unica linha.
-- O RPC anterior agrupava alguns caminhos por (id_entregador, nome_entregador),
-- dividindo total, corridas e media quando o nome historico variava.

do $$
begin
    if to_regprocedure(
        'public._listar_valores_entregadores_source_20260719(integer,integer,text,text,text,date,date,text)'
    ) is null then
        alter function public.listar_valores_entregadores(
            integer,
            integer,
            text,
            text,
            text,
            date,
            date,
            text
        ) rename to _listar_valores_entregadores_source_20260719;
    end if;
end;
$$;

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
language sql
security definer
set search_path = public
as $function$
    with source_result as (
        select public._listar_valores_entregadores_source_20260719(
            p_ano,
            p_semana,
            p_praca,
            p_sub_praca,
            p_origem,
            p_data_inicial,
            p_data_final,
            p_organization_id
        ) as payload
    ),
    source_rows as (
        select
            nullif(btrim(item->>'id_entregador'), '') as id_entregador,
            nullif(btrim(item->>'nome_entregador'), '') as nome_entregador,
            coalesce(nullif(item->>'total_taxas', '')::numeric, 0) as total_taxas,
            coalesce(nullif(item->>'numero_corridas_aceitas', '')::bigint, 0) as numero_corridas_aceitas
        from source_result
        cross join lateral jsonb_array_elements(
            coalesce(payload->'entregadores', '[]'::jsonb)
        ) item
    ),
    aggregated as (
        select
            id_entregador,
            coalesce(
                max(nome_entregador) filter (
                    where position(chr(195) in nome_entregador) = 0
                      and position(chr(194) in nome_entregador) = 0
                      and position(chr(65533) in nome_entregador) = 0
                ),
                max(nome_entregador),
                id_entregador
            ) as nome_entregador,
            round(sum(total_taxas), 2) as total_taxas,
            sum(numero_corridas_aceitas) as numero_corridas_aceitas,
            case
                when sum(numero_corridas_aceitas) > 0 then
                    round(sum(total_taxas) / sum(numero_corridas_aceitas), 2)
                else 0
            end as taxa_media
        from source_rows
        where id_entregador is not null
        group by id_entregador
    ),
    ordered as (
        select *
        from aggregated
        order by total_taxas desc, nome_entregador asc
    )
    select jsonb_build_object(
        'entregadores',
        coalesce(jsonb_agg(row_to_json(ordered)), '[]'::jsonb),
        'total',
        count(*)
    )
    from ordered;
$function$;

comment on function public.listar_valores_entregadores(
    integer,
    integer,
    text,
    text,
    text,
    date,
    date,
    text
) is 'Retorna uma linha por ID de entregador, consolidando variacoes historicas de nome e recalculando a media ponderada.';

-- Preserva o mesmo modelo de acesso do RPC anterior: somente o backend com
-- service role chama a funcao depois de validar usuario e organizacao.
revoke all on function public.listar_valores_entregadores(
    integer,
    integer,
    text,
    text,
    text,
    date,
    date,
    text
) from public, anon, authenticated;

grant execute on function public.listar_valores_entregadores(
    integer,
    integer,
    text,
    text,
    text,
    date,
    date,
    text
) to service_role;
