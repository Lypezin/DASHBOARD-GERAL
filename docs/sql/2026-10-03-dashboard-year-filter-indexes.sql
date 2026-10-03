-- `listar_anos_disponiveis()` discovers distinct years by repeatedly asking
-- for the next lower year. These partial indexes avoid rescanning both
-- source relations for each year while preserving the existing function.
CREATE INDEX IF NOT EXISTS idx_mv_dashboard_resumo_ano_iso_v1
  ON public.mv_dashboard_resumo USING btree (ano_iso DESC)
  WHERE ano_iso IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tb_dashboard_resumo_incremental_ano_iso_v1
  ON public.tb_dashboard_resumo_incremental USING btree (ano_iso DESC)
  WHERE ano_iso IS NOT NULL;
