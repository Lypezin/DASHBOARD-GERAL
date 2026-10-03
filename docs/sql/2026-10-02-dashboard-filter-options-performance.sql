-- Reduces the amount of duplicate work while building the dashboard city filter.
-- EXPLAIN (ANALYZE, BUFFERS) measured the existing RPC at ~135 ms with a temp spill;
-- deduplicating each source before UNION measured ~75 ms with no temp spill.
CREATE OR REPLACE FUNCTION public.list_pracas_disponiveis()
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

    UNION

    SELECT DISTINCT inc.praca
    FROM public.tb_dashboard_resumo_incremental AS inc
    WHERE inc.praca IS NOT NULL
      AND btrim(inc.praca) <> ''
  ) AS available
  ORDER BY available.praca ASC;
$function$;

-- This interrupted index build left a 0-byte, invalid, non-ready index.
-- It cannot serve reads and blocks CREATE INDEX IF NOT EXISTS from repairing it.
DROP INDEX IF EXISTS public.idx_dados_corridas_incremental_refresh;
