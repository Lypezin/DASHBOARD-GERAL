-- Recreates the previously benchmarked covering index used by both weekly
-- summary RPCs. CONCURRENTLY avoids blocking inserts/updates to dados_corridas.
create index concurrently if not exists idx_dados_corridas_resumo_semanal_v1
on public.dados_corridas using btree (
  organization_id,
  ano_iso,
  semana_numero,
  id_da_pessoa_entregadora
)
include (
  numero_minimo_de_entregadores_regulares_na_escala,
  numero_de_corridas_completadas,
  numero_de_corridas_ofertadas,
  numero_de_corridas_aceitas,
  praca
);

analyze public.dados_corridas;
