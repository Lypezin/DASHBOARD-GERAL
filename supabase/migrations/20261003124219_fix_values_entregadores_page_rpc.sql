create or replace function public.listar_valores_entregadores_page_v1(
  p_ano integer,
  p_semana integer,
  p_praca text,
  p_sub_praca text,
  p_origem text,
  p_data_inicial date,
  p_data_final date,
  p_organization_id text,
  p_limit integer,
  p_offset integer,
  p_search text,
  p_snapshot text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set statement_timeout = '30s'
as $function$

declare
  v_result jsonb;
  v_org_filter uuid;
  v_is_admin boolean := false;
  v_pracas text[];
  v_sub_pracas text[];
  v_origens text[];
  v_search text := lower(btrim(coalesce(p_search, '')));
  v_limit integer := greatest(1, least(coalesce(p_limit, 25), 100));
  v_offset integer := least(1000000, greatest(0, coalesce(p_offset, 0)));
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


  if v_org_filter is null then
    raise exception 'organization_id is required for paged values.'
      using errcode = '22023';
  end if;

  if p_ano is null or p_ano < 2000 or p_ano > 2100
     or (p_semana is not null and (p_semana < 1 or p_semana > 53)) then
    raise exception 'Only a valid year and optional ISO week are supported.'
      using errcode = '22023';
  end if;

  if v_org_filter is not null
     and p_ano is not null
     and p_semana is null
     and p_data_inicial is null
     and p_data_final is null
     and v_pracas is null
     and v_sub_pracas is null
     and v_origens is null then
    with incremental_scopes as materialized (
      select distinct inc.organization_id, inc.data_do_periodo, inc.praca, inc.sub_praca, inc.origem
      from public.tb_entregadores_agregado_incremental inc
      where inc.organization_id = v_org_filter
        and inc.ano_iso = p_ano
    ),
    filtered_data as (
      select
        mv.id_entregador,
        mv.nome_entregador,
        mv.corridas_aceitas as numero_corridas_aceitas,
        mv.soma_taxas_aceitas
      from public.mv_entregadores_agregado mv
      where mv.organization_id = v_org_filter
        and mv.ano_iso = p_ano
        and mv.nome_entregador is not null
        and not exists (
          select 1
          from incremental_scopes s
          where s.organization_id = mv.organization_id
            and s.data_do_periodo = mv.data_do_periodo
            and s.praca is not distinct from mv.praca
            and s.sub_praca is not distinct from mv.sub_praca
            and s.origem is not distinct from mv.origem
        )
      union all
      select
        inc.id_entregador,
        inc.nome_entregador,
        inc.corridas_aceitas as numero_corridas_aceitas,
        inc.soma_taxas_aceitas
      from public.tb_entregadores_agregado_incremental inc
      where inc.organization_id = v_org_filter
        and inc.ano_iso = p_ano
        and inc.nome_entregador is not null
    ),
    aggregated_data as (
      select
        coalesce(
          max(nullif(btrim(nome_entregador), '')) filter (
            where position(chr(195) in nome_entregador) = 0
              and position(chr(194) in nome_entregador) = 0
          ),
          max(nullif(btrim(nome_entregador), '')),
          id_entregador
        ) as nome_entregador,
        id_entregador,
        round((sum(soma_taxas_aceitas)::numeric / 100), 2) as total_taxas,
        sum(numero_corridas_aceitas) as numero_corridas_aceitas,
        case
          when sum(numero_corridas_aceitas) > 0 then round((sum(soma_taxas_aceitas)::numeric / 100) / sum(numero_corridas_aceitas), 2)
          else 0
        end as taxa_media
      from filtered_data
      group by id_entregador
    )
    , searched_data as materialized (
      select *
      from aggregated_data
      where v_search = ''
         or strpos(lower(coalesce(nome_entregador, '') || ' ' || coalesce(id_entregador, '')), v_search) > 0
    ),
    fingerprint as (
      select coalesce(
        string_agg(
          jsonb_build_array(id_entregador, nome_entregador, total_taxas, numero_corridas_aceitas, taxa_media)::text,
          E'\n' order by id_entregador collate "C"
        ),
        ''
      ) as material
      from searched_data
    ),
    summary as (
      select
        count(*)::integer as total,
        coalesce(sum(total_taxas), 0)::numeric as total_geral,
        coalesce(sum(numero_corridas_aceitas), 0)::bigint as total_corridas,
        md5(fingerprint.material) || md5('values-page-v1:' || fingerprint.material) as snapshot
      from searched_data
      cross join fingerprint
      group by fingerprint.material
    ),
    ranked_data as (
      select
        searched_data.*,
        rank() over (order by total_taxas desc) as page_rank
      from searched_data
    ),
    page_rows as materialized (
      select *
      from ranked_data
      where page_rank > v_offset
        and page_rank <= v_offset + v_limit
    )
    select jsonb_build_object(
      'entregadores',
      coalesce(
        (
          select jsonb_agg(
            (to_jsonb(page_rows) - 'page_rank')
            order by page_rank, nome_entregador collate "pt-BR-x-icu", id_entregador collate "pt-BR-x-icu"
          )
          from page_rows
        ),
        '[]'::jsonb
      ),
      'total', summary.total,
      'total_geral', summary.total_geral,
      'total_corridas', summary.total_corridas,
      'taxa_media_geral',
        case when summary.total_corridas > 0 then summary.total_geral / summary.total_corridas else 0 end,
      'limit', v_limit,
      'offset', v_offset,
      'has_more', v_offset + (select count(*) from page_rows) < summary.total,
      'snapshot', summary.snapshot
    )
    into v_result
    from summary;

    if p_snapshot is not null and p_snapshot <> (v_result ->> 'snapshot') then
      raise exception 'Os valores mudaram durante a paginação; atualize a lista.'
        using errcode = '40001';
    end if;

    return v_result;
  end if;

  if v_org_filter is not null
     and p_ano is not null
     and p_semana is not null
     and p_data_inicial is null
     and p_data_final is null
     and v_pracas is null
     and v_sub_pracas is null
     and v_origens is null then
    with incremental_scopes as materialized (
      select distinct inc.organization_id, inc.data_do_periodo, inc.praca, inc.sub_praca, inc.origem
      from public.tb_entregadores_agregado_incremental inc
      where inc.organization_id = v_org_filter
        and inc.ano_iso = p_ano
        and inc.semana_numero = p_semana
    ),
    searched_data as (
      select
        mv.id_entregador,
        mv.nome_entregador,
        mv.corridas_aceitas as numero_corridas_aceitas,
        mv.soma_taxas_aceitas
      from public.mv_entregadores_agregado mv
      where mv.organization_id = v_org_filter
        and mv.ano_iso = p_ano
        and mv.semana_numero = p_semana
        and mv.nome_entregador is not null
        and not exists (
          select 1
          from incremental_scopes s
          where s.organization_id = mv.organization_id
            and s.data_do_periodo = mv.data_do_periodo
            and s.praca is not distinct from mv.praca
            and s.sub_praca is not distinct from mv.sub_praca
            and s.origem is not distinct from mv.origem
        )
      union all
      select
        inc.id_entregador,
        inc.nome_entregador,
        inc.corridas_aceitas as numero_corridas_aceitas,
        inc.soma_taxas_aceitas
      from public.tb_entregadores_agregado_incremental inc
      where inc.organization_id = v_org_filter
        and inc.ano_iso = p_ano
        and inc.semana_numero = p_semana
        and inc.nome_entregador is not null
    ),
    aggregated_data as (
      select
        coalesce(
          max(nullif(btrim(nome_entregador), '')) filter (
            where position(chr(195) in nome_entregador) = 0
              and position(chr(194) in nome_entregador) = 0
          ),
          max(nullif(btrim(nome_entregador), '')),
          id_entregador
        ) as nome_entregador,
        id_entregador,
        round((sum(soma_taxas_aceitas)::numeric / 100), 2) as total_taxas,
        sum(numero_corridas_aceitas) as numero_corridas_aceitas,
        case
          when sum(numero_corridas_aceitas) > 0 then round((sum(soma_taxas_aceitas)::numeric / 100) / sum(numero_corridas_aceitas), 2)
          else 0
        end as taxa_media
      from searched_data
      group by id_entregador
    )
    , searched_data as materialized (
      select *
      from aggregated_data
      where v_search = ''
         or strpos(lower(coalesce(nome_entregador, '') || ' ' || coalesce(id_entregador, '')), v_search) > 0
    ),
    fingerprint as (
      select coalesce(
        string_agg(
          jsonb_build_array(id_entregador, nome_entregador, total_taxas, numero_corridas_aceitas, taxa_media)::text,
          E'\\n' order by id_entregador collate "C"
        ),
        ''
      ) as material
      from searched_data
    ),
    summary as (
      select
        count(*)::integer as total,
        coalesce(sum(total_taxas), 0)::numeric as total_geral,
        coalesce(sum(numero_corridas_aceitas), 0)::bigint as total_corridas,
        md5(fingerprint.material) || md5('values-page-v1:' || fingerprint.material) as snapshot
      from searched_data
      cross join fingerprint
      group by fingerprint.material
    ),
    ranked_data as (
      select
        searched_data.*,
        rank() over (order by total_taxas desc) as page_rank
      from searched_data
    ),
    page_rows as materialized (
      select *
      from ranked_data
      where page_rank > v_offset
        and page_rank <= v_offset + v_limit
    )
    select jsonb_build_object(
      'entregadores',
      coalesce(
        (
          select jsonb_agg(
            (to_jsonb(page_rows) - 'page_rank')
            order by page_rank, nome_entregador collate "pt-BR-x-icu", id_entregador collate "pt-BR-x-icu"
          )
          from page_rows
        ),
        '[]'::jsonb
      ),
      'total', summary.total,
      'total_geral', summary.total_geral,
      'total_corridas', summary.total_corridas,
      'taxa_media_geral',
        case when summary.total_corridas > 0 then summary.total_geral / summary.total_corridas else 0 end,
      'limit', v_limit,
      'offset', v_offset,
      'has_more', v_offset + (select count(*) from page_rows) < summary.total,
      'snapshot', summary.snapshot
    )
    into v_result
    from summary;

    if p_snapshot is not null and p_snapshot <> (v_result ->> 'snapshot') then
      raise exception 'Os valores mudaram durante a paginação; atualize a lista.'
        using errcode = '40001';
    end if;

    return v_result;
  end if;


  raise exception 'This RPC only supports unfiltered year/week values.'
    using errcode = '22023';
end;
$function$;

revoke all on function public.listar_valores_entregadores_page_v1(p_ano integer, p_semana integer, p_praca text, p_sub_praca text, p_origem text, p_data_inicial date, p_data_final date, p_organization_id text, p_limit integer, p_offset integer, p_search text, p_snapshot text) from public, anon, authenticated;
grant execute on function public.listar_valores_entregadores_page_v1(p_ano integer, p_semana integer, p_praca text, p_sub_praca text, p_origem text, p_data_inicial date, p_data_final date, p_organization_id text, p_limit integer, p_offset integer, p_search text, p_snapshot text) to service_role;

comment on function public.listar_valores_entregadores_page_v1(p_ano integer, p_semana integer, p_praca text, p_sub_praca text, p_origem text, p_data_inicial date, p_data_final date, p_organization_id text, p_limit integer, p_offset integer, p_search text, p_snapshot text)
is 'Returns a stable page for unfiltered year/week values scopes, with totals and a dataset snapshot. Service-role only.';
