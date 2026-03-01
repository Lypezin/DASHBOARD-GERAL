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

import type {
  AderenciaSemanal,
  AderenciaDia,
  AderenciaTurno,
  AderenciaSubPraca,
  AderenciaOrigem
} from './aderencia';

export type {
  AderenciaSemanal,
  AderenciaDia,
  AderenciaTurno,
  AderenciaSubPraca,
  AderenciaOrigem
};

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
