/**
 * Constantes para a view de comparação .
 */

export interface MetricaOrigem {
  key: string;
  label: string;
  tipo: 'percent' | 'number';
  icon: string;
  invertColors?: boolean;
}

export const METRICAS_ORIGEM: MetricaOrigem[] = [
  { key: 'aderencia_percentual', label: 'Aderência (%)', tipo: 'percent', icon: '📈' },
  { key: 'corridas_ofertadas', label: 'Corridas Ofertadas', tipo: 'number', icon: '📢' },
  { key: 'corridas_aceitas', label: 'Corridas Aceitas', tipo: 'number', icon: '✅' },
  {
    key: 'corridas_rejeitadas',
    label: 'Corridas Rejeitadas',
    tipo: 'number',
    icon: '❌',
    invertColors: true,
  },
  { key: 'pedidos_aceitos_concluidos', label: 'Numero de Pedidos', tipo: 'number', icon: '🏁' },
];

export const DIAS_DA_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'] as const;

