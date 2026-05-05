-- Avoid adding advisor noise while the incremental layer is still in shadow mode.
-- These can be recreated when the impact queue becomes an active high-volume path.

drop index if exists public.idx_mv_refresh_impacts_corridas_pending;
drop index if exists public.idx_mv_refresh_impacts_entregadores_pending;
