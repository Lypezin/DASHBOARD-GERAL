CREATE OR REPLACE FUNCTION public.listar_valores_entregadores_page_fast_v1(
  p_ano integer,
  p_semana integer DEFAULT NULL,
  p_praca text DEFAULT NULL,
  p_sub_praca text DEFAULT NULL,
  p_origem text DEFAULT NULL,
  p_data_inicial date DEFAULT NULL,
  p_data_final date DEFAULT NULL,
  p_organization_id text DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_search text DEFAULT NULL,
  p_sort_field text DEFAULT 'total_taxas',
  p_sort_direction text DEFAULT 'desc',
  p_snapshot text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_org_filter uuid;
  v_limit integer;
  v_offset integer;
  v_search text;
  v_snapshot text;
  v_result jsonb;
BEGIN
  IF p_ano IS NULL OR p_ano < 2000 OR p_ano > 2100 OR p_semana IS NOT NULL
     OR p_data_inicial IS NOT NULL OR p_data_final IS NOT NULL
     OR (p_praca IS NOT NULL AND btrim(p_praca) <> '' AND lower(btrim(p_praca)) NOT IN ('todas', 'todos', 'all'))
     OR (p_sub_praca IS NOT NULL AND btrim(p_sub_praca) <> '' AND lower(btrim(p_sub_praca)) NOT IN ('todas', 'todos', 'all'))
     OR (p_origem IS NOT NULL AND btrim(p_origem) <> '' AND lower(btrim(p_origem)) NOT IN ('todas', 'todos', 'all')) THEN
    RAISE EXCEPTION 'A paginação rápida aceita apenas o escopo anual sem filtros de dimensão.'
      USING ERRCODE = '22023';
  END IF;

  IF coalesce(nullif(btrim(p_sort_field), ''), 'total_taxas') <> 'total_taxas'
     OR coalesce(lower(nullif(btrim(p_sort_direction), '')), 'desc') <> 'desc' THEN
    RAISE EXCEPTION 'A paginação rápida aceita a ordenação padrão por total de taxas.'
      USING ERRCODE = '22023';
  END IF;

  v_org_filter := nullif(btrim(p_organization_id), '')::uuid;
  IF v_org_filter IS NULL THEN
    RAISE EXCEPTION 'A organização é obrigatória para a paginação rápida de valores.'
      USING ERRCODE = '22023';
  END IF;

  v_limit := least(greatest(coalesce(p_limit, 100), 1), 100);
  v_offset := least(greatest(coalesce(p_offset, 0), 0), 1000000);
  v_search := lower(btrim(coalesce(p_search, '')));

  WITH incremental_scopes AS MATERIALIZED (
    SELECT
      inc.organization_id,
      inc.data_do_periodo,
      inc.praca,
      inc.sub_praca,
      inc.origem,
      pg_catalog.hash_record_extended(row(inc.praca, inc.sub_praca, inc.origem), 0) AS dimension_hash
    FROM public.tb_entregadores_agregado_incremental inc
    WHERE inc.organization_id = v_org_filter
      AND inc.ano_iso = p_ano
    GROUP BY inc.organization_id, inc.data_do_periodo, inc.praca, inc.sub_praca, inc.origem
  ),
  filtered_data AS (
    SELECT
      mv.id_entregador,
      mv.nome_entregador,
      mv.corridas_aceitas AS numero_corridas_aceitas,
      mv.soma_taxas_aceitas
    FROM public.mv_entregadores_agregado mv
    WHERE mv.organization_id = v_org_filter
      AND mv.ano_iso = p_ano
      AND mv.nome_entregador IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM incremental_scopes s
        WHERE s.organization_id = mv.organization_id
          AND s.data_do_periodo = mv.data_do_periodo
          AND s.dimension_hash = pg_catalog.hash_record_extended(row(mv.praca, mv.sub_praca, mv.origem), 0)
          AND s.praca IS NOT DISTINCT FROM mv.praca
          AND s.sub_praca IS NOT DISTINCT FROM mv.sub_praca
          AND s.origem IS NOT DISTINCT FROM mv.origem
      )
    UNION ALL
    SELECT
      inc.id_entregador,
      inc.nome_entregador,
      inc.corridas_aceitas AS numero_corridas_aceitas,
      inc.soma_taxas_aceitas
    FROM public.tb_entregadores_agregado_incremental inc
    WHERE inc.organization_id = v_org_filter
      AND inc.ano_iso = p_ano
      AND inc.nome_entregador IS NOT NULL
  ),
  aggregated_data AS MATERIALIZED (
    SELECT
      coalesce(
        max(nullif(btrim(nome_entregador), '')) FILTER (
          WHERE position(chr(195) IN nome_entregador) = 0
            AND position(chr(194) IN nome_entregador) = 0
        ),
        max(nullif(btrim(nome_entregador), '')),
        id_entregador
      ) AS nome_entregador,
      id_entregador,
      round((sum(soma_taxas_aceitas)::numeric / 100), 2) AS total_taxas,
      sum(numero_corridas_aceitas) AS numero_corridas_aceitas
    FROM filtered_data
    GROUP BY id_entregador
  ),
  prepared AS MATERIALIZED (
    SELECT
      btrim(id_entregador) AS id_entregador,
      coalesce(nullif(btrim(nome_entregador), ''), btrim(id_entregador)) AS nome_entregador,
      total_taxas,
      numero_corridas_aceitas,
      CASE
        WHEN numero_corridas_aceitas > 0 THEN total_taxas / numero_corridas_aceitas
        ELSE 0::numeric
      END AS taxa_media
    FROM aggregated_data
    WHERE nullif(btrim(id_entregador), '') IS NOT NULL
      AND (
        v_search = ''
        OR strpos(lower(coalesce(nome_entregador, '') || ' ' || btrim(id_entregador)), v_search) > 0
      )
  ),
  ranked AS MATERIALIZED (
    SELECT
      prepared.*,
      row_number() OVER (
        ORDER BY
          total_taxas DESC,
          lower(nome_entregador) COLLATE "pt-BR-x-icu",
          lower(id_entregador) COLLATE "pt-BR-x-icu",
          id_entregador
      ) AS page_row
    FROM prepared
  )
  SELECT jsonb_build_object(
    'entregadores', coalesce(
      jsonb_agg(jsonb_build_object(
        'id_entregador', ranked.id_entregador,
        'nome_entregador', ranked.nome_entregador,
        'total_taxas', ranked.total_taxas,
        'numero_corridas_aceitas', ranked.numero_corridas_aceitas,
        'taxa_media', ranked.taxa_media
      ) ORDER BY ranked.page_row) FILTER (
        WHERE ranked.page_row > v_offset
          AND ranked.page_row <= v_offset + v_limit
      ),
      '[]'::jsonb
    ),
    'total', count(*)::integer,
    'total_geral', coalesce(sum(ranked.total_taxas), 0::numeric),
    'total_corridas', coalesce(sum(ranked.numero_corridas_aceitas), 0::numeric),
    'taxa_media_geral', CASE
      WHEN coalesce(sum(ranked.numero_corridas_aceitas), 0::numeric) > 0
        THEN coalesce(sum(ranked.total_taxas), 0::numeric) / sum(ranked.numero_corridas_aceitas)
      ELSE 0::numeric
    END,
    'limit', v_limit,
    'offset', v_offset,
    'has_more', count(*) > v_offset + v_limit,
    'snapshot', encode(extensions.digest(
      convert_to(coalesce(string_agg(
        jsonb_build_array(
          ranked.id_entregador,
          ranked.nome_entregador,
          ranked.total_taxas,
          ranked.numero_corridas_aceitas
        )::text,
        E'\n' ORDER BY ranked.page_row
      ), ''), 'UTF8'),
      'sha256'
    ), 'hex')
  )
  INTO v_result
  FROM ranked;

  v_snapshot := v_result->>'snapshot';
  IF p_snapshot IS NOT NULL AND p_snapshot <> v_snapshot THEN
    RAISE EXCEPTION 'Os valores mudaram enquanto a lista era carregada. Atualize a consulta para evitar linhas repetidas ou ausentes.'
      USING ERRCODE = '40001';
  END IF;

  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.listar_valores_entregadores_page_fast_v1(integer, integer, text, text, text, date, date, text, integer, integer, text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listar_valores_entregadores_page_fast_v1(integer, integer, text, text, text, date, date, text, integer, integer, text, text, text, text)
  TO service_role;
