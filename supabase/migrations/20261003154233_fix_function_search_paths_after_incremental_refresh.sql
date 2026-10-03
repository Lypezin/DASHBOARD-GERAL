-- Pin execution paths for internal refresh routines and RLS helpers.
-- Persistent relations and internal RPC calls in these functions are
-- schema-qualified. Refresh routines that create temporary work tables keep
-- only pg_catalog and pg_temp available so their scratch tables still resolve.

ALTER FUNCTION public.refresh_dashboard_resumo_incremental(integer)
  SET search_path TO 'pg_catalog, pg_temp';

ALTER FUNCTION public.refresh_entregadores_agregado_incremental(integer)
  SET search_path TO 'pg_catalog, pg_temp';

ALTER FUNCTION public.refresh_comparison_weekly_incremental(integer)
  SET search_path TO 'pg_catalog, pg_temp';

ALTER FUNCTION public.mark_mv_refresh_needed()
  SET search_path TO '';

ALTER FUNCTION public.process_incremental_refresh_impacts_job()
  SET search_path TO '';

ALTER FUNCTION public.get_my_organization_id()
  SET search_path TO '';

ALTER FUNCTION public.is_global_admin()
  SET search_path TO '';

ALTER FUNCTION public.is_org_admin()
  SET search_path TO '';
