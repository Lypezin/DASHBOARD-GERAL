export interface EvolucaoMensal {
    ano: number;
    mes: number;
    mes_nome: string;
    total_corridas?: number;
    corridas_completadas?: number;
    corridas_ofertadas?: number;
    corridas_aceitas?: number;
    corridas_rejeitadas?: number;
    total_segundos: number;
}

export interface EvolucaoSemanal {
    ano: number;
    semana: number;
    semana_label: string;
    total_corridas?: number;
    corridas_completadas?: number;
    corridas_ofertadas?: number;
    corridas_aceitas?: number;
    corridas_rejeitadas?: number;
    total_segundos: number;
}
