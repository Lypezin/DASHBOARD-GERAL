-- Avoid serializing the complete Entregadores result to JSON and parsing it
-- back into rows before the server-paginated response is built.

CREATE OR REPLACE FUNCTION public.entregadores_dashboard_rows_for_page_v1(
  p_organization_id uuid,
  p_data_inicial date,
  p_data_final date,
  p_praca text DEFAULT NULL,
  p_sub_praca text DEFAULT NULL,
  p_origem text DEFAULT NULL
)
RETURNS TABLE (
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
LANGUAGE sql
STABLE
SET search_path TO ''
AS $function$
  WITH normalized_filters AS (
    SELECT
      CASE
        WHEN nullif(btrim(p_praca), '') IS NULL
          OR lower(btrim(p_praca)) IN ('todas', 'todos', 'all') THEN NULL::text[]
        ELSE (
          SELECT array_agg(btrim(selected.value))
          FROM unnest(string_to_array(p_praca, ',')) AS selected(value)
          WHERE btrim(selected.value) <> ''
        )
      END AS pracas,
      CASE
        WHEN nullif(btrim(p_sub_praca), '') IS NULL
          OR lower(btrim(p_sub_praca)) IN ('todas', 'todos', 'all') THEN NULL::text[]
        ELSE (
          SELECT array_agg(btrim(selected.value))
          FROM unnest(string_to_array(p_sub_praca, ',')) AS selected(value)
          WHERE btrim(selected.value) <> ''
        )
      END AS sub_pracas,
      CASE
        WHEN nullif(btrim(p_origem), '') IS NULL
          OR lower(btrim(p_origem)) IN ('todas', 'todos', 'all') THEN NULL::text[]
        ELSE (
          SELECT array_agg(btrim(selected.value))
          FROM unnest(string_to_array(p_origem, ',')) AS selected(value)
          WHERE btrim(selected.value) <> ''
        )
      END AS origens
  ),
  incremental_scopes AS MATERIALIZED (
    SELECT DISTINCT
      inc.organization_id,
      inc.data_do_periodo,
      inc.praca,
      inc.sub_praca,
      inc.origem
    FROM public.tb_entregadores_agregado_incremental inc
    CROSS JOIN normalized_filters filters
    WHERE inc.organization_id = p_organization_id
      AND inc.data_do_periodo >= p_data_inicial
      AND inc.data_do_periodo <= p_data_final
      AND (filters.pracas IS NULL OR inc.praca = ANY(filters.pracas))
      AND (filters.sub_pracas IS NULL OR inc.sub_praca = ANY(filters.sub_pracas))
      AND (filters.origens IS NULL OR inc.origem = ANY(filters.origens))
  ),
  filtered_data AS (
    SELECT
      mv.id_entregador,
      mv.nome_entregador,
      mv.corridas_ofertadas,
      mv.corridas_aceitas,
      mv.corridas_rejeitadas,
      mv.corridas_completadas,
      mv.total_segundos
    FROM public.mv_entregadores_agregado mv
    CROSS JOIN normalized_filters filters
    WHERE mv.organization_id = p_organization_id
      AND mv.data_do_periodo >= p_data_inicial
      AND mv.data_do_periodo <= p_data_final
      AND mv.id_entregador IS NOT NULL
      AND mv.id_entregador <> ''
      AND mv.nome_entregador IS NOT NULL
      AND (filters.pracas IS NULL OR mv.praca = ANY(filters.pracas))
      AND (filters.sub_pracas IS NULL OR mv.sub_praca = ANY(filters.sub_pracas))
      AND (filters.origens IS NULL OR mv.origem = ANY(filters.origens))
      AND NOT EXISTS (
        SELECT 1
        FROM incremental_scopes scope
        WHERE scope.organization_id = mv.organization_id
          AND scope.data_do_periodo = mv.data_do_periodo
          AND scope.praca IS NOT DISTINCT FROM mv.praca
          AND scope.sub_praca IS NOT DISTINCT FROM mv.sub_praca
          AND scope.origem IS NOT DISTINCT FROM mv.origem
      )
    UNION ALL
    SELECT
      inc.id_entregador,
      inc.nome_entregador,
      inc.corridas_ofertadas,
      inc.corridas_aceitas,
      inc.corridas_rejeitadas,
      inc.corridas_completadas,
      inc.total_segundos
    FROM public.tb_entregadores_agregado_incremental inc
    CROSS JOIN normalized_filters filters
    WHERE inc.organization_id = p_organization_id
      AND inc.data_do_periodo >= p_data_inicial
      AND inc.data_do_periodo <= p_data_final
      AND inc.id_entregador IS NOT NULL
      AND inc.id_entregador <> ''
      AND inc.nome_entregador IS NOT NULL
      AND (filters.pracas IS NULL OR inc.praca = ANY(filters.pracas))
      AND (filters.sub_pracas IS NULL OR inc.sub_praca = ANY(filters.sub_pracas))
      AND (filters.origens IS NULL OR inc.origem = ANY(filters.origens))
  ),
  aggregated_data AS (
    SELECT
      id_entregador,
      coalesce(
        max(nullif(btrim(nome_entregador), '')) FILTER (
          WHERE position(chr(195) IN nome_entregador) = 0
            AND position(chr(194) IN nome_entregador) = 0
        ),
        max(nullif(btrim(nome_entregador), '')),
        id_entregador
      ) AS nome_entregador,
      sum(corridas_ofertadas) AS corridas_ofertadas,
      sum(corridas_aceitas) AS corridas_aceitas,
      sum(corridas_rejeitadas) AS corridas_rejeitadas,
      sum(corridas_completadas) AS corridas_completadas,
      sum(total_segundos) AS total_segundos,
      CASE WHEN sum(corridas_ofertadas) > 0
        THEN round((sum(corridas_aceitas)::numeric / nullif(sum(corridas_ofertadas), 0)) * 100, 2)
        ELSE 0
      END AS aderencia_percentual,
      CASE WHEN sum(corridas_ofertadas) > 0
        THEN round((sum(corridas_rejeitadas)::numeric / nullif(sum(corridas_ofertadas), 0)) * 100, 2)
        ELSE 0
      END AS rejeicao_percentual
    FROM filtered_data
    GROUP BY id_entregador
  )
  SELECT
    aggregated_data.id_entregador,
    aggregated_data.nome_entregador,
    aggregated_data.corridas_ofertadas,
    aggregated_data.corridas_aceitas,
    aggregated_data.corridas_rejeitadas,
    aggregated_data.corridas_completadas,
    aggregated_data.total_segundos,
    aggregated_data.aderencia_percentual,
    aggregated_data.rejeicao_percentual
  FROM aggregated_data;
$function$;

REVOKE ALL ON FUNCTION public.entregadores_dashboard_rows_for_page_v1(uuid, date, date, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.entregadores_dashboard_rows_for_page_v1(uuid, date, date, text, text, text)
  TO service_role;

CREATE OR REPLACE FUNCTION public.listar_entregadores_dashboard_page_fast_v1(
  p_ano integer,
  p_organization_id uuid,
  p_data_inicial date,
  p_data_final date,
  p_praca text DEFAULT NULL,
  p_sub_praca text DEFAULT NULL,
  p_origem text DEFAULT NULL,
  p_limit integer DEFAULT -1,
  p_page integer DEFAULT 1,
  p_sort_field text DEFAULT 'aderencia_percentual',
  p_sort_direction text DEFAULT 'desc',
  p_only_inactive boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path TO ''
AS $function$
DECLARE
  v_result jsonb;
  v_sort_field text;
  v_sort_direction text;
  v_page_size integer;
BEGIN
  IF p_limit IS NULL OR p_limit < -1 OR p_limit > 200 THEN
    RAISE EXCEPTION 'p_limit deve ser -1 (tamanho responsivo), 0 (exportação completa) ou estar entre 1 e 200.' USING errcode = '22023';
  END IF;

  IF p_page IS NULL OR p_page < 1 OR p_page > 1000000 THEN
    RAISE EXCEPTION 'p_page inválida.' USING errcode = '22023';
  END IF;

  v_sort_field := CASE
    WHEN p_sort_field IN (
      'id_entregador', 'nome_entregador', 'corridas_ofertadas',
      'corridas_aceitas', 'corridas_rejeitadas', 'corridas_completadas',
      'aderencia_percentual', 'rejeicao_percentual', 'total_segundos',
      'percentual_aceitas', 'percentual_completadas'
    ) THEN p_sort_field
    ELSE 'aderencia_percentual'
  END;
  v_sort_direction := CASE WHEN lower(p_sort_direction) = 'asc' THEN 'asc' ELSE 'desc' END;

  WITH source_rows AS MATERIALIZED (
    SELECT *
    FROM public.entregadores_dashboard_rows_for_page_v1(
      p_organization_id,
      p_data_inicial,
      p_data_final,
      p_praca,
      p_sub_praca,
      p_origem
    )
  ),
  filtered_rows AS MATERIALIZED (
    SELECT *
    FROM source_rows
    WHERE NOT coalesce(p_only_inactive, false) OR coalesce(corridas_completadas, 0) = 0
  ),
  totals AS (
    SELECT
      count(*)::integer AS total,
      coalesce(avg(coalesce(aderencia_percentual, 0)), 0) AS aderencia_media,
      coalesce(avg(coalesce(rejeicao_percentual, 0)), 0) AS rejeicao_media,
      coalesce(sum(coalesce(corridas_completadas, 0)), 0) AS corridas_completadas,
      coalesce(sum(coalesce(total_segundos, 0)), 0) AS total_segundos
    FROM filtered_rows
  ),
  page_size AS (
    SELECT CASE
      WHEN p_limit <> -1 THEN p_limit
      WHEN totals.total > 1000 THEN 24
      WHEN totals.total > 400 THEN 35
      ELSE 50
    END AS value
    FROM totals
  ),
  ordered_rows AS MATERIALIZED (
    SELECT
      r.*,
      row_number() OVER (
        ORDER BY
          CASE WHEN v_sort_field = 'id_entregador' AND v_sort_direction = 'asc' AND r.id_entregador ~ '^[0-9]+$' THEN r.id_entregador::numeric END ASC NULLS LAST,
          CASE WHEN v_sort_field = 'id_entregador' AND v_sort_direction = 'desc' AND r.id_entregador ~ '^[0-9]+$' THEN r.id_entregador::numeric END DESC NULLS LAST,
          CASE WHEN v_sort_field = 'id_entregador' AND v_sort_direction = 'asc' AND r.id_entregador !~ '^[0-9]+$' THEN lower(r.id_entregador) END ASC NULLS LAST,
          CASE WHEN v_sort_field = 'id_entregador' AND v_sort_direction = 'desc' AND r.id_entregador !~ '^[0-9]+$' THEN lower(r.id_entregador) END DESC NULLS LAST,
          CASE WHEN v_sort_field = 'nome_entregador' AND v_sort_direction = 'asc' THEN lower(r.nome_entregador) END ASC NULLS LAST,
          CASE WHEN v_sort_field = 'nome_entregador' AND v_sort_direction = 'desc' THEN lower(r.nome_entregador) END DESC NULLS LAST,
          CASE WHEN v_sort_field = 'corridas_ofertadas' AND v_sort_direction = 'asc' THEN r.corridas_ofertadas END ASC NULLS LAST,
          CASE WHEN v_sort_field = 'corridas_ofertadas' AND v_sort_direction = 'desc' THEN r.corridas_ofertadas END DESC NULLS LAST,
          CASE WHEN v_sort_field = 'corridas_aceitas' AND v_sort_direction = 'asc' THEN r.corridas_aceitas END ASC NULLS LAST,
          CASE WHEN v_sort_field = 'corridas_aceitas' AND v_sort_direction = 'desc' THEN r.corridas_aceitas END DESC NULLS LAST,
          CASE WHEN v_sort_field = 'corridas_rejeitadas' AND v_sort_direction = 'asc' THEN r.corridas_rejeitadas END ASC NULLS LAST,
          CASE WHEN v_sort_field = 'corridas_rejeitadas' AND v_sort_direction = 'desc' THEN r.corridas_rejeitadas END DESC NULLS LAST,
          CASE WHEN v_sort_field = 'corridas_completadas' AND v_sort_direction = 'asc' THEN r.corridas_completadas END ASC NULLS LAST,
          CASE WHEN v_sort_field = 'corridas_completadas' AND v_sort_direction = 'desc' THEN r.corridas_completadas END DESC NULLS LAST,
          CASE WHEN v_sort_field = 'aderencia_percentual' AND v_sort_direction = 'asc' THEN r.aderencia_percentual END ASC NULLS LAST,
          CASE WHEN v_sort_field = 'aderencia_percentual' AND v_sort_direction = 'desc' THEN r.aderencia_percentual END DESC NULLS LAST,
          CASE WHEN v_sort_field = 'rejeicao_percentual' AND v_sort_direction = 'asc' THEN r.rejeicao_percentual END ASC NULLS LAST,
          CASE WHEN v_sort_field = 'rejeicao_percentual' AND v_sort_direction = 'desc' THEN r.rejeicao_percentual END DESC NULLS LAST,
          CASE WHEN v_sort_field = 'total_segundos' AND v_sort_direction = 'asc' THEN r.total_segundos END ASC NULLS LAST,
          CASE WHEN v_sort_field = 'total_segundos' AND v_sort_direction = 'desc' THEN r.total_segundos END DESC NULLS LAST,
          CASE WHEN v_sort_field = 'percentual_aceitas' AND v_sort_direction = 'asc'
            THEN coalesce(r.corridas_aceitas * 100 / nullif(r.corridas_ofertadas, 0), 0) END ASC NULLS LAST,
          CASE WHEN v_sort_field = 'percentual_aceitas' AND v_sort_direction = 'desc'
            THEN coalesce(r.corridas_aceitas * 100 / nullif(r.corridas_ofertadas, 0), 0) END DESC NULLS LAST,
          CASE WHEN v_sort_field = 'percentual_completadas' AND v_sort_direction = 'asc'
            THEN coalesce(r.corridas_completadas * 100 / nullif(r.corridas_aceitas, 0), 0) END ASC NULLS LAST,
          CASE WHEN v_sort_field = 'percentual_completadas' AND v_sort_direction = 'desc'
            THEN coalesce(r.corridas_completadas * 100 / nullif(r.corridas_aceitas, 0), 0) END DESC NULLS LAST,
          r.id_entregador ASC
      ) AS row_number
    FROM filtered_rows r
  ),
  page_rows AS (
    SELECT coalesce(jsonb_agg(to_jsonb(page_row) - 'row_number' ORDER BY page_row.row_number), '[]'::jsonb) AS rows
    FROM ordered_rows page_row
    CROSS JOIN page_size
    WHERE (p_limit = 0 OR page_row.row_number > ((p_page - 1) * page_size.value))
      AND (p_limit = 0 OR page_row.row_number <= (p_page * page_size.value))
  ),
  performers AS (
    SELECT jsonb_build_object(
      'aderencia', jsonb_build_object(
        'top', (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM (SELECT * FROM filtered_rows ORDER BY aderencia_percentual DESC NULLS LAST, id_entregador ASC LIMIT 10) x),
        'bottom', (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM (SELECT * FROM filtered_rows ORDER BY aderencia_percentual ASC NULLS LAST, id_entregador ASC LIMIT 10) x)
      ),
      'completadas', jsonb_build_object(
        'top', (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM (SELECT * FROM filtered_rows ORDER BY corridas_completadas DESC NULLS LAST, id_entregador ASC LIMIT 10) x),
        'bottom', (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM (SELECT * FROM filtered_rows ORDER BY corridas_completadas ASC NULLS LAST, id_entregador ASC LIMIT 10) x)
      ),
      'horas', jsonb_build_object(
        'top', (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM (SELECT * FROM filtered_rows ORDER BY total_segundos DESC NULLS LAST, id_entregador ASC LIMIT 10) x),
        'bottom', (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM (SELECT * FROM filtered_rows ORDER BY total_segundos ASC NULLS LAST, id_entregador ASC LIMIT 10) x)
      ),
      'rejeicao', jsonb_build_object(
        'top', (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM (SELECT * FROM filtered_rows ORDER BY rejeicao_percentual ASC NULLS LAST, id_entregador ASC LIMIT 10) x),
        'bottom', (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM (SELECT * FROM filtered_rows ORDER BY rejeicao_percentual DESC NULLS LAST, id_entregador ASC LIMIT 10) x)
      )
    ) AS data
  )
  SELECT jsonb_build_object(
    'entregadores', page_rows.rows,
    'total', totals.total,
    'page', p_page,
    'page_size', page_size.value,
    'periodo_resolvido', jsonb_build_object(
      'ano', p_ano,
      'semana', NULL,
      'semanas', '[]'::jsonb,
      'auto_semana', false,
      'search', NULL
    ),
    'summary', jsonb_build_object(
      'total_entregadores', totals.total,
      'aderencia_media', totals.aderencia_media,
      'rejeicao_media', totals.rejeicao_media,
      'corridas_completadas', totals.corridas_completadas,
      'total_segundos', totals.total_segundos
    ),
    'performers_by_metric', performers.data
  )
  INTO v_result
  FROM totals
  CROSS JOIN page_rows
  CROSS JOIN performers
  CROSS JOIN page_size;

  RETURN coalesce(v_result, jsonb_build_object(
    'entregadores', '[]'::jsonb,
    'total', 0,
    'page', p_page,
    'page_size', 0,
    'periodo_resolvido', jsonb_build_object(
      'ano', p_ano,
      'semana', NULL,
      'semanas', '[]'::jsonb,
      'auto_semana', false,
      'search', NULL
    ),
    'summary', jsonb_build_object(
      'total_entregadores', 0,
      'aderencia_media', 0,
      'rejeicao_media', 0,
      'corridas_completadas', 0,
      'total_segundos', 0
    ),
    'performers_by_metric', '{}'::jsonb
  ));
END;
$function$;

REVOKE ALL ON FUNCTION public.listar_entregadores_dashboard_page_fast_v1(integer, uuid, date, date, text, text, text, integer, integer, text, text, boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listar_entregadores_dashboard_page_fast_v1(integer, uuid, date, date, text, text, text, integer, integer, text, text, boolean)
  TO service_role;

CREATE OR REPLACE FUNCTION public.listar_entregadores_dashboard_page_v2(
  p_ano integer DEFAULT NULL,
  p_semana integer DEFAULT NULL,
  p_praca text DEFAULT NULL,
  p_sub_praca text DEFAULT NULL,
  p_origem text DEFAULT NULL,
  p_data_inicial date DEFAULT NULL,
  p_data_final date DEFAULT NULL,
  p_organization_id text DEFAULT NULL,
  p_only_dedicados boolean DEFAULT false,
  p_search text DEFAULT NULL,
  p_semanas integer[] DEFAULT NULL,
  p_limit integer DEFAULT -1,
  p_page integer DEFAULT 1,
  p_sort_field text DEFAULT 'aderencia_percentual',
  p_sort_direction text DEFAULT 'desc',
  p_only_inactive boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path TO ''
AS $function$
DECLARE
  v_organization_id uuid;
  v_data_inicial date := p_data_inicial;
  v_data_final date := p_data_final;
  v_search text := nullif(btrim(p_search), '');
BEGIN
  BEGIN
    v_organization_id := nullif(btrim(p_organization_id), '')::uuid;
  EXCEPTION WHEN others THEN
    v_organization_id := NULL;
  END;

  IF v_data_inicial IS NULL
     AND v_data_final IS NULL
     AND p_ano BETWEEN 2000 AND 2100 THEN
    v_data_inicial := make_date(p_ano, 1, 1);
    v_data_final := make_date(p_ano, 12, 31);
  END IF;

  IF v_organization_id IS NOT NULL
     AND v_data_inicial IS NOT NULL
     AND v_data_final IS NOT NULL
     AND v_data_final >= v_data_inicial
     AND v_data_final - v_data_inicial <= 366
     AND coalesce(p_semana, 0) = 0
     AND (p_semanas IS NULL OR cardinality(p_semanas) = 0)
     AND NOT coalesce(p_only_dedicados, false)
     AND v_search IS NULL THEN
    RETURN public.listar_entregadores_dashboard_page_fast_v1(
      p_ano,
      v_organization_id,
      v_data_inicial,
      v_data_final,
      p_praca,
      p_sub_praca,
      p_origem,
      p_limit,
      p_page,
      p_sort_field,
      p_sort_direction,
      p_only_inactive
    );
  END IF;

  RETURN public.listar_entregadores_dashboard_page_v1(
    p_ano := p_ano,
    p_semana := p_semana,
    p_praca := p_praca,
    p_sub_praca := p_sub_praca,
    p_origem := p_origem,
    p_data_inicial := p_data_inicial,
    p_data_final := p_data_final,
    p_organization_id := p_organization_id,
    p_only_dedicados := p_only_dedicados,
    p_search := p_search,
    p_semanas := p_semanas,
    p_limit := p_limit,
    p_page := p_page,
    p_sort_field := p_sort_field,
    p_sort_direction := p_sort_direction,
    p_only_inactive := p_only_inactive
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.listar_entregadores_dashboard_page_v2(integer, integer, text, text, text, date, date, text, boolean, text, integer[], integer, integer, text, text, boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listar_entregadores_dashboard_page_v2(integer, integer, text, text, text, date, date, text, boolean, text, integer[], integer, integer, text, text, boolean)
  TO service_role;

NOTIFY pgrst, 'reload schema';
