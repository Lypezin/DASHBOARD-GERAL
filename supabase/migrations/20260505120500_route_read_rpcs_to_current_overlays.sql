-- Route read-only/user-facing RPCs to overlay views.
-- Contracts are preserved: same function names, args and return types.
-- Refresh/control functions intentionally stay pointed at the physical MVs.

do $$
declare
  rec record;
  v_def text;
begin
  for rec in
    select p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and p.proname = any(array[
        'calcular_aderencia_por_dia',
        'calcular_aderencia_por_origem',
        'calcular_aderencia_por_sub_praca',
        'calcular_aderencia_por_turno',
        'calcular_utr_completo',
        'dashboard_evolucao_bundle',
        'dashboard_evolucao_mensal',
        'dashboard_evolucao_semanal',
        'dashboard_resumo',
        'dashboard_resumo_v2',
        'dashboard_utr_semanal',
        'get_available_weeks',
        'get_city_last_updates',
        'get_dashboard_dimension_options',
        'get_fluxo_semanal',
        'get_origens_by_praca',
        'get_subpracas_by_praca',
        'get_turnos_by_praca',
        'list_pracas_disponiveis',
        'listar_anos_disponiveis',
        'listar_entregadores_v2',
        'listar_evolucao_mensal',
        'listar_evolucao_semanal',
        'listar_todas_semanas',
        'listar_valores_entregadores',
        'obter_resumo_valores_breakdown',
        'resumo_semanal_pedidos'
      ])
      and (
        pg_get_functiondef(p.oid) ilike '%public.mv_dashboard_resumo%'
        or pg_get_functiondef(p.oid) ilike '%public.mv_entregadores_agregado%'
        or pg_get_functiondef(p.oid) ilike '%public.mv_corridas_agregadas%'
      )
  loop
    v_def := pg_get_functiondef(rec.oid);
    v_def := replace(v_def, 'public.mv_dashboard_resumo', 'public.vw_dashboard_resumo_current');
    v_def := replace(v_def, 'public.mv_entregadores_agregado', 'public.vw_entregadores_agregado_current');
    v_def := replace(v_def, 'public.mv_corridas_agregadas', 'public.vw_corridas_agregadas_current');

    execute v_def;
  end loop;
end $$;
