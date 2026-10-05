-- Support NULL-safe annual reconciliation scopes without scanning the
-- incremental table's unrelated years. The production index was built
-- concurrently before this migration was registered; IF NOT EXISTS makes this
-- migration a no-op there and keeps it repeatable in other environments.
CREATE INDEX IF NOT EXISTS idx_tb_entregadores_agregado_inc_org_year_scope_v1
  ON public.tb_entregadores_agregado_incremental (
    organization_id,
    ano_iso,
    data_do_periodo,
    praca,
    sub_praca,
    origem
  );
