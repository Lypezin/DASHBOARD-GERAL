-- Keep the incremental shadow layer lean while it is not in the active read path.

alter table public.tb_dashboard_resumo_incremental
  add column if not exists id bigserial;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tb_dashboard_resumo_incremental_pkey'
      and conrelid = 'public.tb_dashboard_resumo_incremental'::regclass
  ) then
    alter table public.tb_dashboard_resumo_incremental
      add constraint tb_dashboard_resumo_incremental_pkey primary key (id);
  end if;
end $$;

drop index if exists public.idx_mv_refresh_impacts_scope;
drop index if exists public.idx_tb_dashboard_resumo_incremental_org_week;
drop index if exists public.idx_tb_dashboard_resumo_incremental_org_praca_date;

grant usage, select on sequence public.tb_dashboard_resumo_incremental_id_seq to service_role;
