import { UtrData, EntregadoresData, ValoresEntregador } from '@/types';

export type TabData = UtrData | EntregadoresData | ValoresEntregador[] | null;

export const processTabSuccessData = (tab: string, result: any): TabData => {
    let processedData: TabData;
    if (tab === 'valores') {
        const rawData = result?.data;
        const list = Array.isArray(rawData)
            ? rawData as ValoresEntregador[]
            : Array.isArray(rawData?.entregadores)
                ? rawData.entregadores as ValoresEntregador[]
                : [];
        const total = result?.total ?? rawData?.total;
        if (total !== undefined) (list as any).total = total;
        processedData = list;
    } else {
        processedData = result.data as TabData;
    }
    return processedData;
};

export const getTabFallbackData = (tab: string): TabData => {
    if (tab === 'entregadores' || tab === 'prioridade' || tab === 'dedicado') return { entregadores: [], total: 0 };
    if (tab === 'valores') return [];
    return null;
};
