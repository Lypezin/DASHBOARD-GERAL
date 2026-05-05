-- Read overlays for shadow-mode incremental aggregates.
-- These views keep the current MV rows, but replace impacted/processed scopes with
-- rows from the incremental tables.

create or replace view public.vw_dashboard_resumo_current as
select
  mv.data_do_periodo,
  mv.ano_iso,
  mv.semana_iso,
  mv.praca,
  mv.sub_praca,
  mv.origem,
  mv.turno,
  mv.organization_id,
  mv.total_ofertadas,
  mv.total_aceitas,
  mv.total_rejeitadas,
  mv.total_completadas,
  mv.total_valor_bruto_centavos,
  mv.segundos_planejados,
  mv.segundos_realizados
from public.mv_dashboard_resumo mv
where not exists (
  select 1
  from public.mv_refresh_impacts i
  where i.source = 'corridas'
    and i.dashboard_resumo_processed_at is not null
    and i.organization_id = mv.organization_id
    and i.data_do_periodo = mv.data_do_periodo
    and i.praca is not distinct from mv.praca
    and i.sub_praca is not distinct from mv.sub_praca
    and i.origem is not distinct from mv.origem
)
union all
select
  t.data_do_periodo,
  t.ano_iso,
  t.semana_iso,
  t.praca,
  t.sub_praca,
  t.origem,
  t.turno,
  t.organization_id,
  t.total_ofertadas,
  t.total_aceitas,
  t.total_rejeitadas,
  t.total_completadas,
  t.total_valor_bruto_centavos,
  t.segundos_planejados,
  t.segundos_realizados
from public.tb_dashboard_resumo_incremental t;

create or replace view public.vw_entregadores_agregado_current as
select
  mv.id_entregador,
  mv.nome_entregador,
  mv.praca,
  mv.sub_praca,
  mv.origem,
  mv.ano_iso,
  mv.semana_numero,
  mv.data_do_periodo,
  mv.organization_id,
  mv.corridas_ofertadas,
  mv.corridas_aceitas,
  mv.corridas_rejeitadas,
  mv.corridas_completadas,
  mv.total_segundos,
  mv.soma_taxas_aceitas
from public.mv_entregadores_agregado mv
where not exists (
  select 1
  from public.mv_refresh_impacts i
  where i.source = 'corridas'
    and i.entregadores_agregado_processed_at is not null
    and i.organization_id = mv.organization_id
    and i.data_do_periodo = mv.data_do_periodo
    and i.praca is not distinct from mv.praca
    and i.sub_praca is not distinct from mv.sub_praca
    and i.origem is not distinct from mv.origem
)
union all
select
  t.id_entregador,
  t.nome_entregador,
  t.praca,
  t.sub_praca,
  t.origem,
  t.ano_iso,
  t.semana_numero,
  t.data_do_periodo,
  t.organization_id,
  t.corridas_ofertadas,
  t.corridas_aceitas,
  t.corridas_rejeitadas,
  t.corridas_completadas,
  t.total_segundos,
  t.soma_taxas_aceitas
from public.tb_entregadores_agregado_incremental t;

create or replace view public.vw_corridas_agregadas_current as
select
  mv.id_entregador,
  mv.nome_entregador,
  mv.praca,
  mv.ano_iso,
  mv.semana_numero,
  mv.week_start_date,
  mv.corridas_completadas,
  mv.organization_id
from public.mv_corridas_agregadas mv
where not exists (
  select 1
  from public.mv_refresh_impacts i
  where i.source = 'corridas'
    and i.corridas_agregadas_processed_at is not null
    and i.organization_id = mv.organization_id
    and i.week_start_date = mv.week_start_date
    and i.praca is not distinct from mv.praca
)
union all
select
  t.id_entregador,
  t.nome_entregador,
  t.praca,
  t.ano_iso,
  t.semana_numero,
  t.week_start_date,
  t.corridas_completadas,
  t.organization_id
from public.tb_corridas_agregadas_incremental t;

revoke all on public.vw_dashboard_resumo_current from anon, authenticated, public;
revoke all on public.vw_entregadores_agregado_current from anon, authenticated, public;
revoke all on public.vw_corridas_agregadas_current from anon, authenticated, public;

grant select on public.vw_dashboard_resumo_current to service_role;
grant select on public.vw_entregadores_agregado_current to service_role;
grant select on public.vw_corridas_agregadas_current to service_role;
