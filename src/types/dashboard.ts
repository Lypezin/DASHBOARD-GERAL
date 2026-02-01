/**
 * Tipos relacionados ao Dashboard
 */

export type TabType = 'dashboard' | 'analise' | 'utr' | 'entregadores' | 'valores' | 'evolucao' | 'prioridade' | 'comparacao' | 'marketing' | 'marketing_comparacao' | 'resumo';

export interface Totals {
  ofertadas: number;
  aceitas: number;
  rejeitadas: number;
  completadas: number;
}

export interface AderenciaSemanal {
  semana: string;
  horas_a_entregar?: string;
  horas_entregues?: string;
  segundos_planejados?: number;
  segundos_realizados?: number;
  aderencia_percentual: number;
  total_drivers?: number;
  total_slots?: number;
}

export interface AderenciaDia {
  data?: string;
  horas_a_entregar?: string;
  horas_entregues?: string;
  segundos_planejados?: number;
  segundos_realizados?: number;
  aderencia_percentual: number;
  corridas_ofertadas?: number;
  corridas_aceitas?: number;
  corridas_rejeitadas?: number;
  corridas_completadas?: number;
  taxa_aceitacao?: number;
  taxa_completude?: number;
  dia?: string;
  dia_da_semana?: string;
  dia_semana?: string;
  dia_iso?: number;
}

export interface AderenciaTurno {
  turno: string;
  horas_a_entregar?: string;
  horas_entregues?: string;
  segundos_planejados?: number;
  segundos_realizados?: number;
  aderencia_percentual: number;
  corridas_ofertadas?: number;
  corridas_aceitas?: number;
  corridas_rejeitadas?: number;
  corridas_completadas?: number;
  taxa_aceitacao?: number;
  taxa_completude?: number;
}

export interface AderenciaSubPraca {
  sub_praca: string;
  horas_a_entregar?: string;
  horas_entregues?: string;
  segundos_planejados?: number;
  segundos_realizados?: number;
  aderencia_percentual: number;
  corridas_ofertadas?: number;
  corridas_aceitas?: number;
  corridas_rejeitadas?: number;
  corridas_completadas?: number;
  taxa_aceitacao?: number;
  taxa_completude?: number;
}

export interface AderenciaOrigem {
  origem: string;
  horas_a_entregar?: string;
  horas_entregues?: string;
  segundos_planejados?: number;
  segundos_realizados?: number;
  aderencia_percentual: number;
  corridas_ofertadas?: number;
  corridas_aceitas?: number;
  corridas_rejeitadas?: number;
  corridas_completadas?: number;
  taxa_aceitacao?: number;
  taxa_completude?: number;
}

export interface DimensoesDashboard {
  anos: number[];
  semanas: string[];
  pracas: string[];
  sub_pracas: string[]
  origens: string[];
  turnos?: string[];
}

export interface DashboardResumoData {
  total_ofertadas: number;
  total_aceitas: number;
  total_completadas: number;
  total_rejeitadas: number;

  aderencia_semanal: AderenciaSemanal[];
  aderencia_dia: AderenciaDia[];
  aderencia_turno: AderenciaTurno[];
  aderencia_sub_praca: AderenciaSubPraca[];
  aderencia_origem: AderenciaOrigem[];

  dimensoes: DimensoesDashboard;

  totais?: {
    corridas_ofertadas: number;
    corridas_aceitas: number;
    corridas_rejeitadas: number;
    corridas_completadas: number;
  };
  semanal?: AderenciaSemanal[];
  dia?: AderenciaDia[];
  turno?: AderenciaTurno[];
  sub_praca?: AderenciaSubPraca[];
  origem?: AderenciaOrigem[];
}
