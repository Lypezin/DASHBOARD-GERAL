export interface ValoresEntregador {
    id_entregador: string;
    nome_entregador: string;
    total_taxas: number;
    numero_corridas_aceitas: number;
    taxa_media: number;
    turno?: string | null;
    sub_praca?: string | null;
}

export interface ValoresData {
    valores: ValoresEntregador[];
    total_geral: number;
}

export interface ValoresBreakdownItem {
    turno?: string;
    sub_praca?: string;
    total_valor: number;
    total_corridas: number;
}

export interface ValoresBreakdown {
    by_turno: ValoresBreakdownItem[];
    by_sub_praca: ValoresBreakdownItem[];
}
