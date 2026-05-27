-- Stabilize DEDICADO v2 RPCs without changing their public contracts.
-- These functions aggregate yearly dedicated-origin data and can occasionally
-- cross the old 20s/25s function timeout on large filters.

alter function public.dedicado_origens_rows_v2(
    text,
    integer,
    integer,
    integer[],
    text,
    text,
    date,
    date,
    text
) set statement_timeout = '60s';

alter function public.dashboard_dedicado_origens_v2(
    integer,
    integer,
    integer[],
    text,
    text,
    date,
    date,
    text,
    boolean
) set statement_timeout = '60s';

alter function public.listar_entregadores_origens_v2(
    integer,
    integer,
    integer[],
    text,
    text,
    date,
    date,
    text
) set statement_timeout = '60s';

alter function public.dedicado_entregador_origens_v2(
    text,
    integer,
    integer,
    integer[],
    text,
    text,
    date,
    date,
    text
) set statement_timeout = '60s';
