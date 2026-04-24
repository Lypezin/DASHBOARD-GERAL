set statement_timeout = '0';
set lock_timeout = '10s';

-- Restore fast index-only access for Entregadores, Valores and Prioridade/Promo
-- after consolidating mv_valores_entregador into mv_entregadores_agregado.
create index if not exists idx_mv_entregadores_agregado_org_ano_cover_v4
  on public.mv_entregadores_agregado (
    organization_id,
    ano_iso,
    semana_numero,
    praca,
    sub_praca,
    origem
  )
  include (
    id_entregador,
    nome_entregador,
    data_do_periodo,
    corridas_ofertadas,
    corridas_aceitas,
    corridas_rejeitadas,
    corridas_completadas,
    total_segundos,
    soma_taxas_aceitas
  )
  where nome_entregador is not null;

create index if not exists idx_mv_entregadores_agregado_org_data_cover_v4
  on public.mv_entregadores_agregado (
    organization_id,
    data_do_periodo,
    praca,
    sub_praca,
    origem
  )
  include (
    id_entregador,
    nome_entregador,
    ano_iso,
    semana_numero,
    corridas_ofertadas,
    corridas_aceitas,
    corridas_rejeitadas,
    corridas_completadas,
    total_segundos,
    soma_taxas_aceitas
  )
  where nome_entregador is not null;

analyze public.mv_entregadores_agregado;

alter function public.listar_entregadores_v2(
  integer,
  integer,
  text,
  text,
  text,
  date,
  date,
  text
) set statement_timeout = '30s';

alter function public.listar_valores_entregadores(
  integer,
  integer,
  text,
  text,
  text,
  date,
  date,
  text
) set statement_timeout = '30s';

notify pgrst, 'reload schema';
