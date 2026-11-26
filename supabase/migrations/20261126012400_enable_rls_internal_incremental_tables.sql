-- Enable RLS on internal incremental/queue tables so anon/authenticated cannot
-- read or mutate raw incremental state directly via PostgREST.
ALTER TABLE public.mv_refresh_impacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_dashboard_resumo_incremental ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_corridas_agregadas_incremental ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_entregadores_agregado_incremental ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_comparison_weekly_incremental ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.mv_refresh_impacts FROM public, anon, authenticated;
REVOKE ALL ON TABLE public.tb_dashboard_resumo_incremental FROM public, anon, authenticated;
REVOKE ALL ON TABLE public.tb_corridas_agregadas_incremental FROM public, anon, authenticated;
REVOKE ALL ON TABLE public.tb_entregadores_agregado_incremental FROM public, anon, authenticated;
REVOKE ALL ON TABLE public.tb_comparison_weekly_incremental FROM public, anon, authenticated;

-- Ensure internal refresh functions run with SECURITY DEFINER and are restricted
-- to service_role (and postgres/pg_cron).
ALTER FUNCTION public.refresh_dashboard_resumo_incremental(integer) SECURITY DEFINER;
ALTER FUNCTION public.refresh_comparison_weekly_incremental(integer) SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.refresh_dashboard_resumo_incremental(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_dashboard_resumo_incremental(integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.refresh_comparison_weekly_incremental(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_comparison_weekly_incremental(integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.refresh_corridas_agregadas_incremental(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_corridas_agregadas_incremental(integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.refresh_entregadores_agregado_incremental(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_entregadores_agregado_incremental(integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.process_incremental_refresh_impacts(integer, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_incremental_refresh_impacts(integer, boolean) TO service_role;

REVOKE EXECUTE ON FUNCTION public.process_incremental_refresh_impacts_job() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_incremental_refresh_impacts_job() TO service_role;

-- Ensure Entregadores page RPCs remain executable by service_role.
GRANT EXECUTE ON FUNCTION public.entregadores_dashboard_rows_for_page_v1(uuid, date, date, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.listar_entregadores_dashboard_page_v1(integer, integer, text, text, text, date, date, text, boolean, text, integer[], integer, integer, text, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.listar_entregadores_dashboard_page_v2(integer, integer, text, text, text, date, date, text, boolean, text, integer[], integer, integer, text, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.listar_entregadores_dashboard_page_fast_v1(integer, uuid, date, date, text, text, text, integer, integer, text, text, boolean) TO service_role;
