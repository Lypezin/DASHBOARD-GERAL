/**
 * Constantes para a view de comparação
 */

export const METRICAS_ORIGEM = [
  { key: 'aderencia_percentual', label: 'Aderência (%)', tipo: 'percent' as const, icon: '📈' },
  { key: 'corridas_ofertadas', label: 'Corridas Ofertadas', tipo: 'number' as const, icon: '📢' },
  { key: 'corridas_aceitas', label: 'Corridas Aceitas', tipo: 'number' as const, icon: '✅' },
  {
    key: 'corridas_rejeitadas',
    label: 'Corridas Rejeitadas',
    tipo: 'number' as const,
    icon: '❌',
    invertColors: true,
  },
  { key: 'corridas_completadas', label: 'Corridas Completadas', tipo: 'number' as const, icon: '🏁' },
] as const;

export const DIAS_DA_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'] as const;

