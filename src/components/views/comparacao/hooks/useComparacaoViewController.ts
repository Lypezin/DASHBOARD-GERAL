
import { useEffect, useMemo } from 'react';
import { FilterOption, CurrentUser } from '@/types';
import { useComparacaoData } from '@/hooks/useComparacaoData';
import { registerChartJS } from '@/lib/chartConfig';
import { safeLog } from '@/lib/errorHandler';
import { useComparacaoFilters, ViewMode } from './useComparacaoFilters';

interface UseComparacaoViewControllerProps {
    semanas: string[];
    pracas: FilterOption[];
    subPracas: FilterOption[];
    origens: FilterOption[];
    currentUser: CurrentUser | null;
}

export type { ViewMode };

export function useComparacaoViewController({
    semanas,
    currentUser,
}: UseComparacaoViewControllerProps) {
    const {
        semanasSelecionadas,
        setSemanasSelecionadas,
        pracaSelecionada,
        setPracaSelecionada,
        mostrarApresentacao,
        setMostrarApresentacao,
        viewModeDetalhada,
        setViewModeDetalhada,
        viewModeDia,
        setViewModeDia,
        viewModeSubPraca,
        setViewModeSubPraca,
        viewModeOrigem,
        setViewModeOrigem,
        toggleSemana,
        shouldDisablePracaFilter
    } = useComparacaoFilters(currentUser);

    // Usar hook de dados
    const {
        loading,
        dadosComparacao,
        utrComparacao,
        todasSemanas,
        compararSemanas,
        error
    } = useComparacaoData({
        semanas,
        semanasSelecionadas,
        pracaSelecionada,
        currentUser,
    });

    // Registrar Chart.js
    useEffect(() => {
        if (typeof window !== 'undefined') {
            registerChartJS().catch((err) => {
                safeLog.error('Erro ao registrar Chart.js:', err);
            });
        }
    }, []);

    // Filtro automático de praça para não-admins/não-marketing
    useEffect(() => {
        const isMarketing = currentUser?.role === 'marketing';
        if (currentUser && !currentUser.is_admin && !isMarketing && currentUser.assigned_pracas.length === 1) {
            setPracaSelecionada(currentUser.assigned_pracas[0]);
        }
    }, [currentUser, setPracaSelecionada]);

    const origensDisponiveis = useMemo(() => {
        const conjunto = new Set<string>();
        dadosComparacao.forEach((dados) => {
            const origens = dados?.aderencia_origem || dados?.origem || [];
            origens.forEach((item) => {
                const nome = item?.origem?.trim();
                if (nome) {
                    conjunto.add(nome);
                }
            });
        });
        return Array.from(conjunto).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }, [dadosComparacao]);

    const totalColunasOrigem = useMemo(
        () => semanasSelecionadas.reduce((acc, _, idx) => acc + (idx === 0 ? 1 : 2), 0),
        [semanasSelecionadas]
    );

    const utrComparacaoNormalizada = useMemo(() => {
        return utrComparacao.map(item => ({
            semana: String(item.semana),
            utr: item.utr,
        }));
    }, [utrComparacao]);

    return {
        state: {
            semanasSelecionadas,
            pracaSelecionada,
            mostrarApresentacao,
            viewModeDetalhada,
            viewModeDia,
            viewModeSubPraca,
            viewModeOrigem,
            loading,
            error,
            shouldDisablePracaFilter
        },
        data: {
            dadosComparacao,
            utrComparacao: utrComparacaoNormalizada,
            todasSemanas,
            origensDisponiveis,
            totalColunasOrigem
        },
        actions: {
            setPracaSelecionada,
            setMostrarApresentacao,
            setViewModeDetalhada,
            setViewModeDia,
            setViewModeSubPraca,
            setViewModeOrigem,
            toggleSemana,
            limparSemanas: () => setSemanasSelecionadas([]),
            compararSemanas
        }
    };
}
