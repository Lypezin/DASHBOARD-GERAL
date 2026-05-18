-- Backfill only the comparison-weekly overlay for imports that happened after
-- the last physical refresh of mv_comparison_weekly. This keeps the upload path
-- light while making weeks imported after the full MV refresh read correctly.

update public.mv_refresh_impacts i
set comparison_weekly_processed_at = null
where i.source = 'corridas'
  and i.updated_at > coalesce(
    (
      select mrc.last_refresh
      from public.mv_refresh_control mrc
      where mrc.mv_name = 'mv_comparison_weekly'
      limit 1
    ),
    '-infinity'::timestamptz
  )
  and i.comparison_weekly_processed_at is not null;
