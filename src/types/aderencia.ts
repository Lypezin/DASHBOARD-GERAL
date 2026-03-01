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
