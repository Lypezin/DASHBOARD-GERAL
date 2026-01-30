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
