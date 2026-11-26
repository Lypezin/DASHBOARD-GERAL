-- 1. Covering indexes for weekly Entregadores & Valores fast reads
CREATE INDEX IF NOT EXISTS idx_dash_ent_weekly_org_praca_wstart_cover_v1
  ON public.dashboard_entregadores_agregado_semanal (organization_id, praca, week_start_date)
  INCLUDE (id_entregador, nome_entregador, sub_praca, origem, ano_iso, semana_numero, corridas_ofertadas, corridas_aceitas, corridas_rejeitadas, corridas_completadas, total_segundos, soma_taxas_aceitas);

CREATE INDEX IF NOT EXISTS idx_dash_ent_weekly_org_ano_sem_praca_cover_v1
  ON public.dashboard_entregadores_agregado_semanal (organization_id, ano_iso, semana_numero, praca)
  INCLUDE (id_entregador, nome_entregador, sub_praca, origem, week_start_date, corridas_ofertadas, corridas_aceitas, corridas_rejeitadas, corridas_completadas, total_segundos, soma_taxas_aceitas);

CREATE INDEX IF NOT EXISTS idx_dash_ent_driver_weekly_org_ano_cover_v1
  ON public.dashboard_entregadores_agregado_semanal_entregador (organization_id, ano_iso, week_start_date)
  INCLUDE (semana_numero, id_entregador, nome_entregador, corridas_ofertadas, corridas_aceitas, corridas_rejeitadas, corridas_completadas, total_segundos, soma_taxas_aceitas);

CREATE INDEX IF NOT EXISTS idx_dash_ent_driver_weekly_org_wstart_cover_v1
  ON public.dashboard_entregadores_agregado_semanal_entregador (organization_id, week_start_date)
  INCLUDE (ano_iso, semana_numero, id_entregador, nome_entregador, corridas_ofertadas, corridas_aceitas, corridas_rejeitadas, corridas_completadas, total_segundos, soma_taxas_aceitas);

-- 2. Covering/skip-scan indexes for filter metadata & city last updates
CREATE INDEX IF NOT EXISTS idx_mv_dashboard_resumo_org_praca_data_v1
  ON public.mv_dashboard_resumo (organization_id, praca, data_do_periodo DESC);

CREATE INDEX IF NOT EXISTS idx_mv_dashboard_resumo_org_ano_sem_desc_v1
  ON public.mv_dashboard_resumo (organization_id, ano_iso DESC, semana_iso DESC);

CREATE INDEX IF NOT EXISTS idx_mv_dashboard_resumo_org_dim_options_v1
  ON public.mv_dashboard_resumo (organization_id, praca, sub_praca, origem, turno);

CREATE INDEX IF NOT EXISTS idx_tb_dashboard_resumo_inc_org_praca_data_v1
  ON public.tb_dashboard_resumo_incremental (organization_id, praca, data_do_periodo DESC);

CREATE INDEX IF NOT EXISTS idx_tb_dashboard_resumo_inc_org_ano_sem_desc_v1
  ON public.tb_dashboard_resumo_incremental (organization_id, ano_iso DESC, semana_iso DESC);

CREATE INDEX IF NOT EXISTS idx_dash_ent_month_cache_expires_at_v1
  ON public.dashboard_entregadores_month_cache (expires_at);

-- 3. Refresh planner statistics
ANALYZE public.dashboard_entregadores_agregado_semanal;
ANALYZE public.dashboard_entregadores_agregado_semanal_entregador;
ANALYZE public.dashboard_entregadores_agregado_ano;
ANALYZE public.mv_dashboard_resumo;
ANALYZE public.tb_dashboard_resumo_incremental;
ANALYZE public.dashboard_entregadores_month_cache;
