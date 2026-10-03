-- Replaces the per-driver PostgREST fallback used by the optional
-- "primeira aparição" enrichment. The lateral lookup uses the existing
-- (id_da_pessoa_entregadora, data_do_periodo) index and returns one row per ID.
CREATE OR REPLACE FUNCTION public.get_entregadores_first_seen_v1(
  p_entregador_ids text[],
  p_organization_id uuid,
  p_allowed_pracas text[] DEFAULT NULL
)
RETURNS TABLE (
  id_entregador text,
  primeira_data_aparicao date
)
LANGUAGE sql
STABLE
SET search_path = ''
AS $function$
  SELECT requested.id_entregador, first_seen.data_do_periodo
  FROM unnest(coalesce(p_entregador_ids, ARRAY[]::text[]))
       WITH ORDINALITY AS requested(id_entregador, ordinal)
  LEFT JOIN LATERAL (
    SELECT corridas.data_do_periodo
    FROM public.dados_corridas AS corridas
    WHERE corridas.id_da_pessoa_entregadora = requested.id_entregador
      AND corridas.data_do_periodo IS NOT NULL
      AND (p_organization_id IS NULL OR corridas.organization_id = p_organization_id)
      AND (p_allowed_pracas IS NULL OR corridas.praca = ANY(p_allowed_pracas))
    ORDER BY corridas.data_do_periodo ASC
    LIMIT 1
  ) AS first_seen ON true
  WHERE requested.id_entregador IS NOT NULL
  ORDER BY requested.ordinal;
$function$;

REVOKE ALL ON FUNCTION public.get_entregadores_first_seen_v1(text[], uuid, text[])
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_entregadores_first_seen_v1(text[], uuid, text[])
  TO service_role;

NOTIFY pgrst, 'reload schema';
