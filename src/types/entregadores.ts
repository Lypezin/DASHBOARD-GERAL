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
    primeira_data_aparicao?: string | null;
}

export type EntregadoresSortField = keyof Entregador | 'percentual_aceitas' | 'percentual_completadas';
export type EntregadoresPerformerMetric = 'aderencia' | 'completadas' | 'horas' | 'rejeicao';

export interface EntregadoresData {
    entregadores: Entregador[];
    total: number;
    page?: number;
    page_size?: number;
    summary?: {
        total_entregadores: number;
        aderencia_media: number;
        rejeicao_media: number;
        corridas_completadas: number;
        total_segundos: number;
    };
    performers_by_metric?: Partial<Record<EntregadoresPerformerMetric, {
        top: Entregador[];
        bottom: Entregador[];
    }>>;
    periodo_resolvido?: {
        ano?: number | null;
        semana?: number | null;
        semanas?: number[] | null;
        auto_semana?: boolean;
        search?: string | null;
    };
}
