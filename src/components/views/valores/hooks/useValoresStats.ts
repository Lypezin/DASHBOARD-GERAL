import { useMemo } from 'react';
import { ValoresEntregador } from '@/types';

export function useValoresStats(dataToDisplay: ValoresEntregador[]) {
    const dataArray = useMemo(() => {
        return Array.isArray(dataToDisplay) ? dataToDisplay : [];
    }, [dataToDisplay]);

    const totalGeral = useMemo(() => {
        return dataArray.reduce((sum, e) => {
            const valor = Number(e?.total_taxas) || 0;
            return sum + valor;
        }, 0);
    }, [dataArray]);

    const totalCorridas = useMemo(() => {
        return dataArray.reduce((sum, e) => {
            const valor = Number(e?.numero_corridas_aceitas) || 0;
            return sum + valor;
        }, 0);
    }, [dataArray]);

    const taxaMediaGeral = useMemo(() => {
        return totalCorridas > 0 ? totalGeral / totalCorridas : 0;
    }, [totalGeral, totalCorridas]);

    const totalEntregadores = useMemo(() => {
        return Array.isArray(dataArray) ? dataArray.length : 0;
    }, [dataArray]);

    return {
        totalGeral,
        totalCorridas,
        taxaMediaGeral,
        totalEntregadores
    };
}
