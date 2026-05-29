import { useMemo } from 'react';
import { Entregador } from '@/types';

export function usePrioridadeStats(dataFiltrada: Entregador[]) {
    return useMemo(() => {
        const totalOfertadas = dataFiltrada.reduce((sum, e) => sum + e.corridas_ofertadas, 0);
        const totalAceitas = dataFiltrada.reduce((sum, e) => sum + e.corridas_aceitas, 0);
        const totalRejeitadas = dataFiltrada.reduce((sum, e) => sum + e.corridas_rejeitadas, 0);
        const totalCompletadas = dataFiltrada.reduce((sum, e) => sum + e.corridas_completadas, 0);
        const totalEntregadores = dataFiltrada.length;
        const aderenciaMedia = totalEntregadores > 0 ? dataFiltrada.reduce((sum, e) => sum + (e.aderencia_percentual || 0), 0) / totalEntregadores : 0;

        return {
            totalOfertadas,
            totalAceitas,
            totalRejeitadas,
            totalCompletadas,
            totalEntregadores,
            aderenciaMedia
        };
    }, [dataFiltrada]);
}
