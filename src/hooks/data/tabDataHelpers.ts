import { UtrData, EntregadoresData, ValoresEntregador } from '@/types';

export type TabData = UtrData | EntregadoresData | ValoresEntregador[] | null;

export const processTabSuccessData = (tab: string, result: any): TabData => {
    let processedData: TabData;
    if (tab === 'valores') {
        const list = Array.isArray(result.data) ? result.data as ValoresEntregador[] : [];
        if (result.total !== undefined) (list as any).total = result.total;
        processedData = list;
    } else {
        processedData = result.data as TabData;
    }
    return processedData;
};

export const getTabFallbackData = (tab: string): TabData => {
    if (tab === 'entregadores' || tab === 'prioridade') return { entregadores: [], total: 0 };
    if (tab === 'valores') return [];
    return null;
};
