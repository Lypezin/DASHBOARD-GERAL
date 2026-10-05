-- Share the expensive unfiltered monthly Entregadores aggregates between
-- server instances. Only the service role may read or update this cache.
create table if not exists public.dashboard_entregadores_month_cache (
  cache_key text primary key,
  data jsonb not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_dashboard_entregadores_month_cache_expiry
  on public.dashboard_entregadores_month_cache (expires_at);

alter table public.dashboard_entregadores_month_cache enable row level security;
revoke all on public.dashboard_entregadores_month_cache from public, anon, authenticated;
grant select, insert, update on public.dashboard_entregadores_month_cache to service_role;
