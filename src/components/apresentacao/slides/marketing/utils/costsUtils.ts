import { MarketingCostData } from '@/types';

export const calculateCostsTotals = (data: MarketingCostData[]) => {
    const totalValor = data.reduce((acc, curr) => acc + (curr.valorUsado || 0), 0);
    const totalRodando = data.reduce((acc, curr) => acc + (curr.rodando || 0), 0);
    const totalLiberados = data.reduce((acc, curr) => acc + (curr.liberado || 0), 0);
    const totalConversas = data.reduce((acc, curr) => acc + (curr.conversas || 0), 0);

    const totalCPA = totalRodando > 0 ? totalValor / totalRodando : 0;
    const totalCPL = totalLiberados > 0 ? totalValor / totalLiberados : 0;
    const totalCPC = totalConversas > 0 ? totalValor / totalConversas : 0;

    return {
        totalValor,
        totalRodando,
        totalLiberados,
        totalConversas,
        totalCPA,
        totalCPL,
        totalCPC
    };
};
