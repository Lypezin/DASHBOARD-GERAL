alter function public.refresh_single_mv(text, boolean) set statement_timeout = '0';

alter function public.refresh_mvs_prioritized(boolean) set statement_timeout = '0';

alter function public.refresh_all_mvs_optimized() set statement_timeout = '0';
