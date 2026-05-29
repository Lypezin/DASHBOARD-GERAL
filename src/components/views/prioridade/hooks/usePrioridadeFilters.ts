import { useState, useMemo } from 'react';
import { Entregador } from '@/types';

export function usePrioridadeFilters(dataToDisplay: Entregador[]) {
    const [filtroAderencia, setFiltroAderencia] = useState<string>('');
    const [filtroRejeicao, setFiltroRejeicao] = useState<string>('');
    const [filtroCompletadas, setFiltroCompletadas] = useState<string>('');
    const [filtroAceitas, setFiltroAceitas] = useState<string>('');

    const dataFiltrada = useMemo(() => {
        if (!Array.isArray(dataToDisplay)) return [];
        let filtered = [...dataToDisplay];

        // Filtro por % de aderência (mostrar apenas quem tem o valor ou acima)
        if (filtroAderencia.trim()) {
            const aderenciaMin = parseFloat(filtroAderencia);
            if (!isNaN(aderenciaMin)) {
                filtered = filtered.filter(e => (e.aderencia_percentual ?? 0) >= aderenciaMin);
            }
        }

        // Filtro por % de rejeição (mostrar apenas quem tem o valor ou abaixo)
        if (filtroRejeicao.trim()) {
            const rejeicaoMax = parseFloat(filtroRejeicao);
            if (!isNaN(rejeicaoMax)) {
                filtered = filtered.filter(e => (e.rejeicao_percentual ?? 0) <= rejeicaoMax);
            }
        }

        // Filtro por % de completadas (mostrar apenas quem tem o valor ou acima)
        if (filtroCompletadas.trim()) {
            const completadasMin = parseFloat(filtroCompletadas);
            if (!isNaN(completadasMin)) {
                filtered = filtered.filter(e => {
                    const corridasOfertadas = e.corridas_ofertadas || 0;
                    if (corridasOfertadas === 0) return false;
                    const percentualCompletadas = (e.corridas_completadas / corridasOfertadas) * 100;
                    return percentualCompletadas >= completadasMin;
                });
            }
        }

        // Filtro por % de aceitas (mostrar apenas quem tem o valor ou acima)
        if (filtroAceitas.trim()) {
            const aceitasMin = parseFloat(filtroAceitas);
            if (!isNaN(aceitasMin)) {
                filtered = filtered.filter(e => {
                    const corridasOfertadas = e.corridas_ofertadas || 0;
                    if (corridasOfertadas === 0) return false;
                    const percentualAceitas = (e.corridas_aceitas / corridasOfertadas) * 100;
                    return percentualAceitas >= aceitasMin;
                });
            }
        }

        return filtered;
    }, [dataToDisplay, filtroAderencia, filtroRejeicao, filtroCompletadas, filtroAceitas]);

    const handleClearFilters = () => {
        setFiltroAderencia('');
        setFiltroRejeicao('');
        setFiltroCompletadas('');
        setFiltroAceitas('');
    };

    return {
        dataFiltrada,
        filtroAderencia,
        filtroRejeicao,
        filtroCompletadas,
        filtroAceitas,
        setFiltroAderencia,
        setFiltroRejeicao,
        setFiltroCompletadas,
        setFiltroAceitas,
        handleClearFilters
    };
}
