
import { useEffect, useMemo } from 'react';
import { FilterOption, CurrentUser } from '@/types';
import { useComparacaoData } from '@/hooks/useComparacaoData';
import { useComparacaoChartRegistration } from './useComparacaoChart';
import { useComparacaoMemo } from './useComparacaoMemo';
import { useComparacaoFilters, ViewMode } from './useComparacaoFilters';

interface UseComparacaoViewControllerProps {
    semanas: string[];
    pracas: FilterOption[];
    subPracas: FilterOption[];
    origens: FilterOption[];
    currentUser: CurrentUser | null;
    anoSelecionado?: number;
}

export type { ViewMode };

export function useComparacaoViewController({
    semanas,
    currentUser,
    anoSelecionado,
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
        error
    } = useComparacaoData({
        semanas,
        semanasSelecionadas,
        pracaSelecionada,
        currentUser,
        anoSelecionado
    });

    // Registrar Chart.js
    useComparacaoChartRegistration();

    // Filtro automático de praça para não-admins/não-marketing
    useEffect(() => {
        const isMarketing = currentUser?.role === 'marketing';
        if (currentUser && !currentUser.is_admin && !isMarketing && currentUser.assigned_pracas.length === 1) {
            setPracaSelecionada(currentUser.assigned_pracas[0]);
        }
    }, [currentUser, setPracaSelecionada]);

    const {
        origensDisponiveis,
        totalColunasOrigem,
        utrComparacaoNormalizada
    } = useComparacaoMemo(dadosComparacao, semanasSelecionadas, utrComparacao);

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
            shouldDisablePracaFilter,
            anoSelecionado
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
            limparSemanas: () => setSemanasSelecionadas([])
        }
    };
}
