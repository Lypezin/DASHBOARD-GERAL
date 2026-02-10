export interface FluxoEntregadores {
    semana: string;
    entradas: number;
    saidas: number;
    entradas_total: number;
    entradas_marketing: number;
    entradas_operacional: number;
    saidas_total: number;
    saidas_marketing: number;
    saidas_operacional: number;
    saidas_novos: number;
    saidas_novos_operacional: number;
    saldo: number;
    nomes_entradas: string[];
    nomes_saidas: string[];
    nomes_saidas_novos: string[];
    nomes_entradas_marketing: string[];
    nomes_saidas_marketing: string[];
    nomes_saidas_novos_marketing: string[];
    nomes_entradas_operacional: string[];
    nomes_saidas_operacional: string[];
    nomes_saidas_novos_operacional: string[];
    // Retomada (Returning Drivers)
    retomada_total: number;
    retomada_marketing: number;
    retomada_operacional: number;
    nomes_retomada_marketing: string[];
    nomes_retomada_operacional: string[];
    retomada_origins?: Record<string, number>;
}

export const processFluxoData = (rawData: any[]): FluxoEntregadores[] => {
    const processedData = rawData.map(item => {
        return {
            semana: item.semana,

            entradas_total: Number(item.entradas_total),
            entradas_marketing: Number(item.entradas_mkt_count),
            entradas_operacional: Number(item.entradas_total) - Number(item.entradas_mkt_count),
            nomes_entradas_marketing: item.nomes_entradas_mkt || [],
            nomes_entradas_operacional: item.nomes_entradas_ops || [],

            saidas_total: Number(item.saidas_total),
            saidas_marketing: Number(item.saidas_mkt_count),
            saidas_operacional: Number(item.saidas_total) - Number(item.saidas_mkt_count),
            nomes_saidas_marketing: item.nomes_saidas_mkt || [],
            nomes_saidas_operacional: item.nomes_saidas_ops || [],

            saidas_novos: Number(item.saidas_novos_total),
            saidas_novos_operacional: Number(item.saidas_novos_total) - (item.nomes_saidas_novos_mkt ? item.nomes_saidas_novos_mkt.length : 0),
            nomes_saidas_novos_marketing: item.nomes_saidas_novos_mkt || [],
            nomes_saidas_novos_operacional: item.nomes_saidas_novos_ops || [],

            // Retomada
            retomada_total: Number(item.retomada_total || 0),
            retomada_marketing: Number(item.retomada_mkt_count || 0),
            retomada_operacional: Number(item.retomada_total || 0) - Number(item.retomada_mkt_count || 0),
            nomes_retomada_marketing: item.nomes_retomada_mkt || [],
            nomes_retomada_operacional: item.nomes_retomada_ops || [],
            retomada_origins: item.retomada_origins || {},

            saldo: Number(item.saldo),

            // Legacy compatibility
            entradas: Number(item.entradas_total),
            saidas: Number(item.saidas_total),
            nomes_entradas: [...(item.nomes_entradas_mkt || []), ...(item.nomes_entradas_ops || [])],
            nomes_saidas: [...(item.nomes_saidas_mkt || []), ...(item.nomes_saidas_ops || [])],
            nomes_saidas_novos: [...(item.nomes_saidas_novos_mkt || []), ...(item.nomes_saidas_novos_ops || [])]
        };
    });

    // Filter out Week 01 2024 due to cold-start "fake" entries (no 2023 data)
    let filteredData = processedData.filter(item => !item.semana.includes('2024-W01'));

    // Calculate Current ISO Week to filter it out (avoid incomplete data/false churn)
    const now = new Date();
    const target = new Date(now.valueOf());
    const dayNr = (now.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
    const currentYear = now.getFullYear();
    const currentWeekIso = `${currentYear}-W${weekNumber.toString().padStart(2, '0')}`;

    // Filter out CURRENT WEEK
    filteredData = filteredData.filter(item => item.semana !== currentWeekIso);

    return filteredData;
};
