import { useMemo } from 'react';
import { EntregadorMarketing } from '@/types';

export function useEntregadoresTotals(entregadoresFiltrados: EntregadorMarketing[]) {
    return useMemo(() => {
        const totalEntregadores = entregadoresFiltrados.length;
        const totalSegundos = entregadoresFiltrados.reduce((sum, e) => sum + (e.total_segundos || 0), 0);
        const totalOfertadas = entregadoresFiltrados.reduce((sum, e) => sum + (e.total_ofertadas || 0), 0);
        const totalAceitas = entregadoresFiltrados.reduce((sum, e) => sum + (e.total_aceitas || 0), 0);
        const totalCompletadas = entregadoresFiltrados.reduce((sum, e) => sum + (e.total_completadas || 0), 0);
        const totalRejeitadas = entregadoresFiltrados.reduce((sum, e) => sum + (e.total_rejeitadas || 0), 0);

        const totalRodandoSim = entregadoresFiltrados.filter(e => (e.total_completadas || 0) > 30).length;
        const totalRodandoNao = totalEntregadores - totalRodandoSim;

        return {
            totalEntregadores,
            totalSegundos,
            totalOfertadas,
            totalAceitas,
            totalCompletadas,
            totalRejeitadas,
            totalRodandoSim,
            totalRodandoNao,
        };
    }, [entregadoresFiltrados]);
}
