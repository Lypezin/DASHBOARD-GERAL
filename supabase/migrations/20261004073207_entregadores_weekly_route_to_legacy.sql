-- Keep the RPC contract and access grants while routing to the existing page
-- implementation. The relational single-week branch was slower on the
-- current 2,704-driver scope and returned an equivalent payload.
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
LANGUAGE sql
STABLE
SET search_path TO ''
AS $function$
  SELECT public.listar_entregadores_dashboard_page_v1(
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
$function$;

REVOKE ALL ON FUNCTION public.listar_entregadores_dashboard_page_v2(
  integer, integer, text, text, text, date, date, text, boolean, text,
  integer[], integer, integer, text, text, boolean
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.listar_entregadores_dashboard_page_v2(
  integer, integer, text, text, text, date, date, text, boolean, text,
  integer[], integer, integer, text, text, boolean
) TO service_role;

NOTIFY pgrst, 'reload schema';
