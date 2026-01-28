/**
 * Tipos para dados de aderência
 */

export interface RawAderenciaItem {
    horas_a_entregar?: number;
    segundos_planejados?: number;
    horas_entregues?: number;
    segundos_realizados?: number;
    dia_da_semana?: string;
    dia_semana?: string;
    [key: string]: unknown;
}

export interface ProcessedAderenciaItem {
    horas_a_entregar: string;
    horas_entregues: string;
    dia_da_semana?: string;
    [key: string]: unknown;
}
