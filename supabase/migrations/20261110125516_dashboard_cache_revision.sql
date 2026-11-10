-- A revision changes in the same transaction as each source or incremental
-- aggregate change. Cache keys include it, so server instances cannot reuse a
-- result generated before a committed import or refresh.
create table public.dashboard_cache_revisions (
  organization_id uuid primary key,
  revision bigint not null default 0
);

-- A fresh epoch prevents old keys from becoming valid again if this schema is
-- ever rolled back and recreated.
create table public.dashboard_cache_revision_epoch (
  singleton boolean primary key default true check (singleton),
  epoch uuid not null default gen_random_uuid()
);
insert into public.dashboard_cache_revision_epoch default values;

alter table public.dashboard_cache_revisions enable row level security;
revoke all on public.dashboard_cache_revisions from public, anon, authenticated;
grant select on public.dashboard_cache_revisions to service_role;
alter table public.dashboard_cache_revision_epoch enable row level security;
revoke all on public.dashboard_cache_revision_epoch from public, anon, authenticated;

create function public.bump_dashboard_cache_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.dashboard_cache_revisions as revisions (organization_id, revision)
    select distinct organization_id, 1 from new_rows
    where organization_id is not null order by organization_id
    on conflict (organization_id) do update set revision = revisions.revision + 1;
  elsif tg_op = 'DELETE' then
    insert into public.dashboard_cache_revisions as revisions (organization_id, revision)
    select distinct organization_id, 1 from old_rows
    where organization_id is not null order by organization_id
    on conflict (organization_id) do update set revision = revisions.revision + 1;
  else
    insert into public.dashboard_cache_revisions as revisions (organization_id, revision)
    select organization_id, 1 from (
      select organization_id from old_rows where organization_id is not null
      union
      select organization_id from new_rows where organization_id is not null
    ) changed order by organization_id
    on conflict (organization_id) do update set revision = revisions.revision + 1;
  end if;
  return null;
end;
$$;

revoke all on function public.bump_dashboard_cache_revision() from public, anon, authenticated;

create function public.get_dashboard_cache_revision(p_organization_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select epoch::text || ':' || coalesce((select revision::text from public.dashboard_cache_revisions
    where organization_id = p_organization_id), '0')
  from public.dashboard_cache_revision_epoch where singleton;
$$;

revoke all on function public.get_dashboard_cache_revision(uuid) from public, anon, authenticated;
grant execute on function public.get_dashboard_cache_revision(uuid) to service_role;

-- A full MV refresh can change results without touching the incremental
-- queue. Rotate the shared epoch only after a recorded refresh completes.
create function public.bump_dashboard_epoch_after_full_refresh()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from new_rows n join old_rows o on o.id = n.id
    where n.last_refresh is distinct from o.last_refresh
  ) then
    update public.dashboard_cache_revision_epoch set epoch = gen_random_uuid() where singleton;
  end if;
  return null;
end;
$$;
revoke all on function public.bump_dashboard_epoch_after_full_refresh() from public, anon, authenticated;
create trigger dashboard_revision_full_refresh after update on public.mv_refresh_control
referencing old table as old_rows new table as new_rows
for each statement execute function public.bump_dashboard_epoch_after_full_refresh();

create trigger dashboard_revision_corridas_insert after insert on public.dados_corridas
referencing new table as new_rows for each statement execute function public.bump_dashboard_cache_revision();
create trigger dashboard_revision_corridas_update after update on public.dados_corridas
referencing old table as old_rows new table as new_rows for each statement execute function public.bump_dashboard_cache_revision();
create trigger dashboard_revision_corridas_delete after delete on public.dados_corridas
referencing old table as old_rows for each statement execute function public.bump_dashboard_cache_revision();

create trigger dashboard_revision_impacts_insert after insert on public.mv_refresh_impacts
referencing new table as new_rows for each statement execute function public.bump_dashboard_cache_revision();
create trigger dashboard_revision_impacts_update after update on public.mv_refresh_impacts
referencing old table as old_rows new table as new_rows for each statement execute function public.bump_dashboard_cache_revision();
create trigger dashboard_revision_impacts_delete after delete on public.mv_refresh_impacts
referencing old table as old_rows for each statement execute function public.bump_dashboard_cache_revision();
