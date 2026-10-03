-- Keep the zero-argument admin RPCs available for organization management.
-- Dashboard filter options use these overloads so each response is scoped to
-- the organization authorized by the secure-rpc proxy.

CREATE OR REPLACE FUNCTION public.list_pracas_disponiveis(p_organization_id uuid)
RETURNS TABLE(praca text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT available.praca
  FROM (
    SELECT DISTINCT mv.praca
    FROM public.mv_dashboard_resumo AS mv
    WHERE mv.praca IS NOT NULL
      AND btrim(mv.praca) <> ''
      AND (p_organization_id IS NULL OR mv.organization_id = p_organization_id)

    UNION

    SELECT DISTINCT inc.praca
    FROM public.tb_dashboard_resumo_incremental AS inc
    WHERE inc.praca IS NOT NULL
      AND btrim(inc.praca) <> ''
      AND (p_organization_id IS NULL OR inc.organization_id = p_organization_id)
  ) AS available
  ORDER BY available.praca ASC;
$function$;

CREATE OR REPLACE FUNCTION public.listar_anos_disponiveis(p_organization_id uuid)
RETURNS SETOF integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT years.ano_iso
  FROM (
    SELECT DISTINCT mv.ano_iso
    FROM public.mv_dashboard_resumo AS mv
    WHERE mv.ano_iso IS NOT NULL
      AND (p_organization_id IS NULL OR mv.organization_id = p_organization_id)

    UNION

    SELECT DISTINCT inc.ano_iso
    FROM public.tb_dashboard_resumo_incremental AS inc
    WHERE inc.ano_iso IS NOT NULL
      AND (p_organization_id IS NULL OR inc.organization_id = p_organization_id)
  ) AS years
  ORDER BY years.ano_iso DESC;
$function$;

CREATE OR REPLACE FUNCTION public.listar_todas_semanas(p_organization_id uuid)
RETURNS TABLE(semana text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT
    weeks.ano_iso::text || '-W' || lpad(weeks.semana_iso::text, 2, '0') AS semana
  FROM (
    SELECT DISTINCT mv.ano_iso, mv.semana_iso
    FROM public.mv_dashboard_resumo AS mv
    WHERE mv.ano_iso IS NOT NULL
      AND mv.semana_iso IS NOT NULL
      AND (p_organization_id IS NULL OR mv.organization_id = p_organization_id)

    UNION

    SELECT DISTINCT inc.ano_iso, inc.semana_iso
    FROM public.tb_dashboard_resumo_incremental AS inc
    WHERE inc.ano_iso IS NOT NULL
      AND inc.semana_iso IS NOT NULL
      AND (p_organization_id IS NULL OR inc.organization_id = p_organization_id)
  ) AS weeks
  ORDER BY weeks.ano_iso DESC, weeks.semana_iso DESC;
$function$;

REVOKE ALL ON FUNCTION public.list_pracas_disponiveis(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.listar_anos_disponiveis(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.listar_todas_semanas(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.list_pracas_disponiveis(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.listar_anos_disponiveis(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.listar_todas_semanas(uuid) TO service_role;
