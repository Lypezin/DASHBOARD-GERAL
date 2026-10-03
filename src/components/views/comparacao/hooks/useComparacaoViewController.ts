
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { FilterOption, CurrentUser } from '@/types';
import { useComparacaoData } from '@/hooks/data/useComparacaoData';
import { useComparacaoMemo } from './useComparacaoMemo';
import { useComparacaoFilters, ViewMode, SecoesVisiveis } from './useComparacaoFilters';

interface UseComparacaoViewControllerProps { semanas: string[]; pracas: FilterOption[]; subPracas: FilterOption[]; origens: FilterOption[]; currentUser: CurrentUser | null; anoSelecionado?: number; }

export type { ViewMode, SecoesVisiveis };

export function useComparacaoViewController({ semanas, currentUser, anoSelecionado }: UseComparacaoViewControllerProps) {
    const {
        semanasSelecionadas, setSemanasSelecionadas, pracaSelecionada, setPracaSelecionada,
        mostrarApresentacao, setMostrarApresentacao, viewModeDetalhada, setViewModeDetalhada,
        viewModeDia, setViewModeDia, viewModeSubPraca, setViewModeSubPraca, viewModeOrigem,
        setViewModeOrigem, toggleSemana, shouldDisablePracaFilter, secoesVisiveis, toggleSecao
    } = useComparacaoFilters(currentUser);

    const previousYearRef = useRef(anoSelecionado);
    const selectedWeeksForCurrentYear = useMemo(
        () => previousYearRef.current === anoSelecionado ? semanasSelecionadas : [],
        [anoSelecionado, semanasSelecionadas]
    );

    // Usar hook de dados
    const { loading, dadosComparacao, utrComparacao, todasSemanas, error, utrError, loadingSemanas, errorSemanas, retrySemanas, retryData } = useComparacaoData({
        semanas, semanasSelecionadas: selectedWeeksForCurrentYear, pracaSelecionada, currentUser, anoSelecionado
    });

    useEffect(() => {
        if (previousYearRef.current === anoSelecionado) return;
        previousYearRef.current = anoSelecionado;
        setSemanasSelecionadas([]);
    }, [anoSelecionado, setSemanasSelecionadas]);

    // Filtro automático de praça para não-admins/não-marketing
    useEffect(() => {
        const isMarketing = currentUser?.role === 'marketing';
        if (currentUser && !currentUser.is_admin && !isMarketing && currentUser.assigned_pracas.length === 1) {
            setPracaSelecionada(currentUser.assigned_pracas[0]);
        }
    }, [currentUser, setPracaSelecionada]);

    const { origensDisponiveis, totalColunasOrigem, utrComparacaoNormalizada } = useComparacaoMemo(dadosComparacao, selectedWeeksForCurrentYear, utrComparacao);

    const limparSemanas = useCallback(() => setSemanasSelecionadas([]), [setSemanasSelecionadas]);

    const state = useMemo(() => ({
            semanasSelecionadas: selectedWeeksForCurrentYear, pracaSelecionada, mostrarApresentacao, viewModeDetalhada, viewModeDia,
            viewModeSubPraca, viewModeOrigem, loading, error, utrError, shouldDisablePracaFilter, anoSelecionado, secoesVisiveis,
            loadingSemanas, errorSemanas
    }), [
        selectedWeeksForCurrentYear, pracaSelecionada, mostrarApresentacao, viewModeDetalhada, viewModeDia,
        viewModeSubPraca, viewModeOrigem, loading, error, utrError, shouldDisablePracaFilter, anoSelecionado, secoesVisiveis,
        loadingSemanas, errorSemanas
    ]);

    const data = useMemo(() => ({
        dadosComparacao,
        utrComparacao: utrComparacaoNormalizada,
        utrError,
        todasSemanas,
        origensDisponiveis,
        totalColunasOrigem
    }), [dadosComparacao, utrComparacaoNormalizada, utrError, todasSemanas, origensDisponiveis, totalColunasOrigem]);

    const actions = useMemo(() => ({
            setPracaSelecionada, setMostrarApresentacao, setViewModeDetalhada, setViewModeDia,
            setViewModeSubPraca, setViewModeOrigem, toggleSemana, setSemanasSelecionadas,
            limparSemanas, toggleSecao, retrySemanas, retryData
    }), [
        setPracaSelecionada, setMostrarApresentacao, setViewModeDetalhada, setViewModeDia,
        setViewModeSubPraca, setViewModeOrigem, toggleSemana, setSemanasSelecionadas,
        limparSemanas, toggleSecao, retrySemanas, retryData
    ]);

    return { state, data, actions };
}
