-- Production cleanup applied through Supabase MCP on 2026-10-03 UTC.
-- These non-unique indexes exactly duplicated existing unique indexes.
-- EXPLAIN after removal confirmed the unique indexes serve the same lookups.
-- No page-load latency improvement was measured; the change removes duplicate
-- index maintenance and 32 KiB of redundant index storage.

-- Forward change:
DROP INDEX IF EXISTS public.idx_organizations_slug;
DROP INDEX IF EXISTS public.idx_user_profiles_id;

-- Optional rollback to the former physical layout (functionally redundant):
-- CREATE INDEX idx_organizations_slug ON public.organizations USING btree (slug);
-- CREATE INDEX idx_user_profiles_id ON public.user_profiles USING btree (id);
