export interface Entregador {
    id_entregador: string;
    nome_entregador: string;
    corridas_ofertadas: number;
    corridas_aceitas: number;
    corridas_rejeitadas: number;
    corridas_completadas: number;
    aderencia_percentual: number;
    rejeicao_percentual: number;
    total_segundos: number;
}

export interface EntregadoresData {
    entregadores: Entregador[];
    total: number;
}
