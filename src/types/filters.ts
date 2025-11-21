/**
 * Tipos relacionados a filtros e payloads de filtros
 */

/**
 * Payload de filtros para funções RPC
 */
export interface FilterPayload {
  p_ano?: number | null;
  p_semana?: number | null;
  p_data_inicial?: string | null;
  p_data_final?: string | null;
  p_praca?: string | string[] | null;
  p_sub_praca?: string | string[] | null;
  p_origem?: string | string[] | null;
  p_turno?: string | string[] | null;
  p_limite_semanas?: number | null;
  [key: string]: unknown;
}

/**
 * Payload validado de filtros (após validação)
 */
export interface ValidatedFilterPayload {
  p_ano?: number;
  p_semana?: number;
  p_data_inicial?: string;
  p_data_final?: string;
  p_praca?: string;
  p_sub_praca?: string;
  p_origem?: string;
  p_turno?: string;
  p_limite_semanas?: number;
}

/**
 * Filtros do dashboard (formato usado na UI)
 */
export interface DashboardFilters {
  ano: number | null;
  semana: number | null;
  praca: string | null;
  subPraca: string | null;
  origem: string | null;
  turno: string | null;
  subPracas: string[];
  origens: string[];
  turnos: string[];
  semanas: number[];
  filtroModo: 'ano_semana' | 'data_range';
  dataInicial: string | null;
  dataFinal: string | null;
}

