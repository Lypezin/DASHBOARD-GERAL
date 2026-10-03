-- Keep the dashboard's expensive scope aggregation in the existing RPC, but
-- return only the current page plus the global cards and top/bottom lists.
-- The app route validates organization and plaza access before using service_role.
create or replace function public.listar_entregadores_dashboard_page_v1(
  p_ano integer default null,
  p_semana integer default null,
  p_praca text default null,
  p_sub_praca text default null,
  p_origem text default null,
  p_data_inicial date default null,
  p_data_final date default null,
  p_organization_id text default null,
  p_only_dedicados boolean default false,
  p_search text default null,
  p_semanas integer[] default null,
  p_limit integer default -1,
  p_page integer default 1,
  p_sort_field text default 'aderencia_percentual',
  p_sort_direction text default 'desc',
  p_only_inactive boolean default false
)
returns jsonb
language plpgsql
security invoker
set search_path to 'public'
as $function$
declare
  v_full jsonb;
  v_result jsonb;
  v_search text := nullif(btrim(p_search), '');
  v_sort_field text;
  v_sort_direction text;
  v_page_size integer;
begin
  if p_limit is null or p_limit < -1 or p_limit > 200 then
    raise exception 'p_limit deve ser -1 (tamanho responsivo), 0 (exportação completa) ou estar entre 1 e 200.' using errcode = '22023';
  end if;

  if p_page is null or p_page < 1 or p_page > 1000000 then
    raise exception 'p_page inválida.' using errcode = '22023';
  end if;

  v_sort_field := case
    when p_sort_field in (
      'id_entregador', 'nome_entregador', 'corridas_ofertadas',
      'corridas_aceitas', 'corridas_rejeitadas', 'corridas_completadas',
      'aderencia_percentual', 'rejeicao_percentual', 'total_segundos',
      'percentual_aceitas', 'percentual_completadas'
    ) then p_sort_field
    else 'aderencia_percentual'
  end;
  v_sort_direction := case when lower(p_sort_direction) = 'asc' then 'asc' else 'desc' end;

  v_full := public.listar_entregadores_dashboard_fast_v1(
    p_ano := p_ano,
    p_semana := p_semana,
    p_praca := p_praca,
    p_sub_praca := p_sub_praca,
    p_origem := p_origem,
    p_data_inicial := p_data_inicial,
    p_data_final := p_data_final,
    p_organization_id := p_organization_id,
    p_only_dedicados := p_only_dedicados,
    p_search := case when length(v_search) >= 3 then v_search else null end,
    p_semanas := p_semanas
  );

  with raw_rows as materialized (
    select *
    from jsonb_to_recordset(coalesce(v_full -> 'entregadores', '[]'::jsonb)) as e(
      id_entregador text,
      nome_entregador text,
      corridas_ofertadas numeric,
      corridas_aceitas numeric,
      corridas_rejeitadas numeric,
      corridas_completadas numeric,
      total_segundos numeric,
      aderencia_percentual numeric,
      rejeicao_percentual numeric
    )
  ),
  filtered_rows as materialized (
    select *
    from raw_rows
    where (v_search is null
      or position(lower(v_search) in lower(coalesce(id_entregador, ''))) > 0
      or position(lower(v_search) in lower(coalesce(nome_entregador, ''))) > 0)
      and (not coalesce(p_only_inactive, false) or coalesce(corridas_completadas, 0) = 0)
  ),
  totals as (
    select
      count(*)::integer as total,
      coalesce(avg(coalesce(aderencia_percentual, 0)), 0) as aderencia_media,
      coalesce(avg(coalesce(rejeicao_percentual, 0)), 0) as rejeicao_media,
      coalesce(sum(coalesce(corridas_completadas, 0)), 0) as corridas_completadas,
      coalesce(sum(coalesce(total_segundos, 0)), 0) as total_segundos
    from filtered_rows
  ),
  page_size as (
    select case
      when p_limit <> -1 then p_limit
      when totals.total > 1000 then 24
      when totals.total > 400 then 35
      else 50
    end as value
    from totals
  ),
  ordered_rows as materialized (
    select
      r.*,
      row_number() over (
        order by
          case when v_sort_field = 'id_entregador' and v_sort_direction = 'asc' and r.id_entregador ~ '^[0-9]+$' then r.id_entregador::numeric end asc nulls last,
          case when v_sort_field = 'id_entregador' and v_sort_direction = 'desc' and r.id_entregador ~ '^[0-9]+$' then r.id_entregador::numeric end desc nulls last,
          case when v_sort_field = 'id_entregador' and v_sort_direction = 'asc' and r.id_entregador !~ '^[0-9]+$' then lower(r.id_entregador) end asc nulls last,
          case when v_sort_field = 'id_entregador' and v_sort_direction = 'desc' and r.id_entregador !~ '^[0-9]+$' then lower(r.id_entregador) end desc nulls last,
          case when v_sort_field = 'nome_entregador' and v_sort_direction = 'asc' then lower(r.nome_entregador) end asc nulls last,
          case when v_sort_field = 'nome_entregador' and v_sort_direction = 'desc' then lower(r.nome_entregador) end desc nulls last,
          case when v_sort_field = 'corridas_ofertadas' and v_sort_direction = 'asc' then r.corridas_ofertadas end asc nulls last,
          case when v_sort_field = 'corridas_ofertadas' and v_sort_direction = 'desc' then r.corridas_ofertadas end desc nulls last,
          case when v_sort_field = 'corridas_aceitas' and v_sort_direction = 'asc' then r.corridas_aceitas end asc nulls last,
          case when v_sort_field = 'corridas_aceitas' and v_sort_direction = 'desc' then r.corridas_aceitas end desc nulls last,
          case when v_sort_field = 'corridas_rejeitadas' and v_sort_direction = 'asc' then r.corridas_rejeitadas end asc nulls last,
          case when v_sort_field = 'corridas_rejeitadas' and v_sort_direction = 'desc' then r.corridas_rejeitadas end desc nulls last,
          case when v_sort_field = 'corridas_completadas' and v_sort_direction = 'asc' then r.corridas_completadas end asc nulls last,
          case when v_sort_field = 'corridas_completadas' and v_sort_direction = 'desc' then r.corridas_completadas end desc nulls last,
          case when v_sort_field = 'aderencia_percentual' and v_sort_direction = 'asc' then r.aderencia_percentual end asc nulls last,
          case when v_sort_field = 'aderencia_percentual' and v_sort_direction = 'desc' then r.aderencia_percentual end desc nulls last,
          case when v_sort_field = 'rejeicao_percentual' and v_sort_direction = 'asc' then r.rejeicao_percentual end asc nulls last,
          case when v_sort_field = 'rejeicao_percentual' and v_sort_direction = 'desc' then r.rejeicao_percentual end desc nulls last,
          case when v_sort_field = 'total_segundos' and v_sort_direction = 'asc' then r.total_segundos end asc nulls last,
          case when v_sort_field = 'total_segundos' and v_sort_direction = 'desc' then r.total_segundos end desc nulls last,
          case when v_sort_field = 'percentual_aceitas' and v_sort_direction = 'asc'
            then coalesce(r.corridas_aceitas * 100 / nullif(r.corridas_ofertadas, 0), 0) end asc nulls last,
          case when v_sort_field = 'percentual_aceitas' and v_sort_direction = 'desc'
            then coalesce(r.corridas_aceitas * 100 / nullif(r.corridas_ofertadas, 0), 0) end desc nulls last,
          case when v_sort_field = 'percentual_completadas' and v_sort_direction = 'asc'
            then coalesce(r.corridas_completadas * 100 / nullif(r.corridas_aceitas, 0), 0) end asc nulls last,
          case when v_sort_field = 'percentual_completadas' and v_sort_direction = 'desc'
            then coalesce(r.corridas_completadas * 100 / nullif(r.corridas_aceitas, 0), 0) end desc nulls last,
          r.id_entregador asc
      ) as row_number
    from filtered_rows r
  ),
  page_rows as (
    select coalesce(jsonb_agg(to_jsonb(page_row) - 'row_number' order by page_row.row_number), '[]'::jsonb) as rows
    from ordered_rows page_row
    cross join page_size
    where (p_limit = 0 or page_row.row_number > ((p_page - 1) * page_size.value))
      and (p_limit = 0 or page_row.row_number <= (p_page * page_size.value))
  ),
  performers as (
    select jsonb_build_object(
      'aderencia', jsonb_build_object(
        'top', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (select * from filtered_rows order by aderencia_percentual desc nulls last, id_entregador asc limit 10) x),
        'bottom', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (select * from filtered_rows order by aderencia_percentual asc nulls last, id_entregador asc limit 10) x)
      ),
      'completadas', jsonb_build_object(
        'top', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (select * from filtered_rows order by corridas_completadas desc nulls last, id_entregador asc limit 10) x),
        'bottom', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (select * from filtered_rows order by corridas_completadas asc nulls last, id_entregador asc limit 10) x)
      ),
      'horas', jsonb_build_object(
        'top', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (select * from filtered_rows order by total_segundos desc nulls last, id_entregador asc limit 10) x),
        'bottom', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (select * from filtered_rows order by total_segundos asc nulls last, id_entregador asc limit 10) x)
      ),
      'rejeicao', jsonb_build_object(
        'top', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (select * from filtered_rows order by rejeicao_percentual asc nulls last, id_entregador asc limit 10) x),
        'bottom', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (select * from filtered_rows order by rejeicao_percentual desc nulls last, id_entregador asc limit 10) x)
      )
    ) as data
  )
  select jsonb_build_object(
    'entregadores', page_rows.rows,
    'total', totals.total,
    'page', p_page,
    'page_size', page_size.value,
    'periodo_resolvido', v_full -> 'periodo_resolvido',
    'summary', jsonb_build_object(
      'total_entregadores', totals.total,
      'aderencia_media', totals.aderencia_media,
      'rejeicao_media', totals.rejeicao_media,
      'corridas_completadas', totals.corridas_completadas,
      'total_segundos', totals.total_segundos
    ),
    'performers_by_metric', performers.data
  )
  into v_result
  from totals
  cross join page_rows
  cross join performers
  cross join page_size;

  return coalesce(v_result, jsonb_build_object(
    'entregadores', '[]'::jsonb,
    'total', 0,
    'periodo_resolvido', v_full -> 'periodo_resolvido',
    'summary', jsonb_build_object(
      'total_entregadores', 0,
      'aderencia_media', 0,
      'rejeicao_media', 0,
      'corridas_completadas', 0,
      'total_segundos', 0
    ),
    'performers_by_metric', '{}'::jsonb
  ));
end;
$function$;

revoke all on function public.listar_entregadores_dashboard_page_v1(
  integer, integer, text, text, text, date, date, text, boolean, text, integer[],
  integer, integer, text, text, boolean
) from public, anon, authenticated;
grant execute on function public.listar_entregadores_dashboard_page_v1(
  integer, integer, text, text, text, date, date, text, boolean, text, integer[],
  integer, integer, text, text, boolean
) to service_role;
