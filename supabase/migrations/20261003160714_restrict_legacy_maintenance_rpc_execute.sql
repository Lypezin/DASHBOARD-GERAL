-- Keep legacy maintenance helpers unavailable to public client roles.
-- Server-side maintenance remains available to service_role; database-owned
-- callers continue to execute these functions as their owner.
REVOKE EXECUTE ON FUNCTION public.clear_admin_cache() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.clear_admin_cache() TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_admin_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO service_role;

REVOKE EXECUTE ON FUNCTION public.refresh_all_materialized_views() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_all_materialized_views() TO service_role;

REVOKE EXECUTE ON FUNCTION public.refresh_dashboard_mvs() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_dashboard_mvs() TO service_role;

REVOKE EXECUTE ON FUNCTION public.refresh_comparison_weekly_incremental(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_comparison_weekly_incremental(integer) TO service_role;
