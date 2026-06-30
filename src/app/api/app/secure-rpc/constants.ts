export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const ALLOWED_RPC = new Set([
  'dashboard_evolucao_bundle',
  'dashboard_evolucao_bundle_org_year_fast',
  'dashboard_resumo',
  'get_available_weeks',
  'get_city_last_updates',
  'get_current_user_profile',
  'get_dashboard_dimension_options',
  'get_entregador_detail',
  'get_entregadores_details',
  'get_gamification_leaderboard',
  'get_marketing_atendentes_data',
  'get_marketing_comparison_weekly',
  'get_marketing_resultados_data',
  'get_origens_by_praca',
  'get_subpracas_by_praca',
  'get_turnos_by_praca',
  'get_valores_cidade_resumo',
  'is_global_admin',
  'list_pracas_disponiveis',
  'listar_anos_disponiveis',
  'listar_todas_semanas',
]);

export const ORG_PARAM_BY_RPC: Record<string, string> = {
  dashboard_evolucao_bundle: 'p_organization_id',
  dashboard_evolucao_bundle_org_year_fast: 'p_organization_id',
  dashboard_resumo: 'p_organization_id',
  get_available_weeks: 'p_organization_id',
  get_city_last_updates: 'p_organization_id',
  get_dashboard_dimension_options: 'p_organization_id',
  get_entregador_detail: 'p_org_id',
  get_entregadores_details: 'p_organization_id',
  get_marketing_atendentes_data: 'p_organization_id',
  get_marketing_comparison_weekly: 'p_organization_id',
  get_marketing_resultados_data: 'p_organization_id',
  get_valores_cidade_resumo: 'p_organization_id',
};

export const FULL_CITY_ACCESS_ONLY = new Set([
  'get_entregador_detail',
  'get_entregadores_details',
  'get_marketing_atendentes_data',
  'get_marketing_comparison_weekly',
  'get_marketing_resultados_data',
  'get_valores_cidade_resumo',
]);

export const RPCS_WITHOUT_CITY_SCOPE = new Set([
  'get_available_weeks',
  'get_city_last_updates',
  'listar_anos_disponiveis',
  'listar_todas_semanas',
  'list_pracas_disponiveis',
]);

export const RPCS_SUPPORTING_PRACAS_ARRAY = new Set([
  'get_dashboard_dimension_options',
  'get_origens_by_praca',
  'get_subpracas_by_praca',
  'get_turnos_by_praca',
]);

export const INTERNAL_SCOPED_PRACAS_PARAM = '__secure_scoped_pracas';

export const DASHBOARD_ARRAY_FIELDS = [
  { outputKey: 'aderencia_semanal', aliases: ['aderencia_semanal', 'semanal'], keys: ['semana'] },
  { outputKey: 'aderencia_dia', aliases: ['aderencia_dia', 'dia'], keys: ['data', 'dia', 'dia_iso'] },
  { outputKey: 'aderencia_turno', aliases: ['aderencia_turno', 'turno'], keys: ['turno'] },
  { outputKey: 'aderencia_sub_praca', aliases: ['aderencia_sub_praca', 'sub_praca'], keys: ['sub_praca'] },
  { outputKey: 'aderencia_origem', aliases: ['aderencia_origem', 'origem'], keys: ['origem'] },
  { outputKey: 'aderencia_dia_origem', aliases: ['aderencia_dia_origem', 'dia_origem'], keys: ['data', 'dia', 'dia_iso', 'origem'] },
];

export const DASHBOARD_ALIAS_BY_OUTPUT: Record<string, string> = {
  aderencia_semanal: 'semanal',
  aderencia_dia: 'dia',
  aderencia_turno: 'turno',
  aderencia_sub_praca: 'sub_praca',
  aderencia_origem: 'origem',
  aderencia_dia_origem: 'dia_origem',
};

export const DASHBOARD_ROW_SUM_FIELDS = [
  'segundos_planejados',
  'segundos_realizados',
  'corridas_ofertadas',
  'corridas_aceitas',
  'corridas_rejeitadas',
  'corridas_completadas',
  'numero_de_pedidos_aceitos_e_concluidos',
  'pedidos_aceitos_e_concluidos',
  'total_pedidos_aceitos_e_concluidos',
  'total_drivers',
  'total_slots',
];

export const DASHBOARD_TOTAL_SUM_FIELDS = [
  'total_ofertadas',
  'total_aceitas',
  'total_completadas',
  'numero_de_pedidos_aceitos_e_concluidos',
  'pedidos_aceitos_e_concluidos',
  'total_pedidos_aceitos_e_concluidos',
  'total_rejeitadas',
  'total_valor_bruto_centavos',
];

export const DASHBOARD_NESTED_TOTAL_SUM_FIELDS = [
  'corridas_ofertadas',
  'corridas_aceitas',
  'corridas_rejeitadas',
  'corridas_completadas',
  'numero_de_pedidos_aceitos_e_concluidos',
  'pedidos_aceitos_e_concluidos',
  'total_pedidos_aceitos_e_concluidos',
];
