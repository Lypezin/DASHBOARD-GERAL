export interface UtrGeral {
    tempo_horas: number;
    corridas: number;
    utr: number;
}

export interface UtrPorPraca {
    praca: string;
    tempo_horas: number;
    corridas: number;
    utr: number;
}

export interface UtrPorSubPraca {
    sub_praca: string;
    tempo_horas: number;
    corridas: number;
    utr: number;
}

export interface UtrPorOrigem {
    origem: string;
    tempo_horas: number;
    corridas: number;
    utr: number;
}

export interface UtrPorTurno {
    turno?: string;
    periodo?: string;
    tempo_horas: number;
    corridas: number;
    utr: number;
}

export interface UtrData {
    geral: UtrGeral;
    praca?: UtrPorPraca[];
    sub_praca?: UtrPorSubPraca[];
    origem?: UtrPorOrigem[];
    turno?: UtrPorTurno[];
    por_praca?: UtrPorPraca[];
    por_sub_praca?: UtrPorSubPraca[];
    por_origem?: UtrPorOrigem[];
    por_turno?: UtrPorTurno[];
}

export interface UtrSemanal {
    ano: number;
    semana: number;
    semana_label: string;
    tempo_horas: number;
    total_corridas: number;
    utr: number;
}
