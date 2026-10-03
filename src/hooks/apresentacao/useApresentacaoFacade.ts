import { useState, useMemo, useEffect } from 'react';
import { useApresentacaoController } from './useApresentacaoController';
import { useSavedPresentations } from './useSavedPresentations';
import { usePresentationManagerActions } from './usePresentationManagerActions';
import { useApresentacaoData } from './useApresentacaoData';
import { useApresentacaoSlides } from './useApresentacaoSlides';
import { usePresentationNavigation } from './usePresentationNavigation';
import { DashboardResumoData, UtrComparacaoItem } from '@/types';
import { useOrganization } from '@/contexts/OrganizationContext';
import { fetchEntregadoresData } from '@/utils/tabData/fetchers/entregadoresFetcher';
import { parseWeekString } from '@/utils/comparacaoHelpers';
import { createRequestKey } from '@/utils/request/createRequestKey';
import { safeLog } from '@/lib/errorHandler';

interface FacadeProps {
    dadosComparacao: DashboardResumoData[];
    utrComparacao: UtrComparacaoItem[];
    semanasSelecionadas: string[];
    pracaSelecionada: string | null;
    anoSelecionado?: number;
    onPracaChange?: (praca: string) => void;
    onSemanasChange?: (semanas: string[]) => void;
}

export function useApresentacaoFacade(props: FacadeProps) {
    const { dadosComparacao, utrComparacao, semanasSelecionadas, pracaSelecionada, anoSelecionado, onPracaChange, onSemanasChange } = props;

    const { state, actions } = useApresentacaoController({ praca: pracaSelecionada, ano: anoSelecionado, semanas: semanasSelecionadas });
    const {
        savedPresentations,
        loading: isLoadingSaves,
        error: savedPresentationsError,
        fetchPresentations,
        savePresentation,
        deletePresentation,
    } = useSavedPresentations();

    const [isManagersOpen, setIsManagersOpen] = useState(false);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

    const { handleSavePresentation, handleLoadPresentation } = usePresentationManagerActions({
        savePresentation, mediaSlides: state.mediaSlides, visibleSections: state.visibleSections,
        pracaSelecionada, anoSelecionado, semanasSelecionadas,
        setMediaSlides: actions.setMediaSlides, setVisibleSections: actions.setVisibleSections,
        setIsManagersOpen, onPracaChange, onSemanasChange
    });

    const { dadosBasicos, dadosProcessados } = useApresentacaoData(dadosComparacao, semanasSelecionadas, anoSelecionado);

    const { organizationId } = useOrganization();
    const [entregadoresComparativo, setEntregadoresComparativo] = useState<any[]>([]);
    const [entregadoresResolvedKey, setEntregadoresResolvedKey] = useState<string | null>(null);
    const [entregadoresError, setEntregadoresError] = useState<{ key: string; message: string } | null>(null);

    const shouldLoadEntregadores = state.visibleSections.entregadores === true;
    const parsedWeeks = useMemo(
        () => semanasSelecionadas.map((week) => parseWeekString(week, anoSelecionado)),
        [semanasSelecionadas, anoSelecionado]
    );
    const entregadoresRequestKey = createRequestKey({
        enabled: shouldLoadEntregadores,
        weeks: parsedWeeks,
        plaza: pracaSelecionada,
        organizationId,
    });
    const currentEntregadores = entregadoresResolvedKey === entregadoresRequestKey ? entregadoresComparativo : [];
    const isLoadingEntregadores = shouldLoadEntregadores
        && semanasSelecionadas.length === 2
        && entregadoresResolvedKey !== entregadoresRequestKey
        && entregadoresError?.key !== entregadoresRequestKey;
    const currentEntregadoresError = entregadoresError?.key === entregadoresRequestKey ? entregadoresError.message : null;

    useEffect(() => {
        if (!shouldLoadEntregadores || semanasSelecionadas.length !== 2) {
            setEntregadoresComparativo([]);
            setEntregadoresResolvedKey(entregadoresRequestKey);
            setEntregadoresError(null);
            return;
        }
        
        let active = true;
        const load = async () => {
            try {
                const [{ semanaNumero: sem1, anoNumero: ano1 }, { semanaNumero: sem2, anoNumero: ano2 }] = parsedWeeks;
                
                const [res1, res2] = await Promise.all([
                    fetchEntregadoresData({
                        filterPayload: {
                            p_ano: ano1,
                            p_semana: sem1,
                            p_praca: pracaSelecionada,
                            p_organization_id: organizationId
                        }
                    }),
                    fetchEntregadoresData({
                        filterPayload: {
                            p_ano: ano2,
                            p_semana: sem2,
                            p_praca: pracaSelecionada,
                            p_organization_id: organizationId
                        }
                    })
                ]);

                if (res1.error || res2.error || !res1.data || !res2.data) {
                    throw new Error('Não foi possível carregar os entregadores das duas semanas. Tente novamente.');
                }

                for (const [week, result] of [[parsedWeeks[0], res1], [parsedWeeks[1], res2]] as const) {
                    const data = result.data;
                    if (!data) {
                        throw new Error(`A lista de entregadores da semana ${week.semanaNumero} não retornou dados. Tente novamente.`);
                    }

                    const total = Number(data.total);
                    if (!Number.isSafeInteger(total) || total !== data.entregadores.length) {
                        throw new Error(`A lista de entregadores da semana ${week.semanaNumero} está incompleta. Tente novamente.`);
                    }
                }
                
                if (!active) return;
                
                const list1 = res1.data?.entregadores || [];
                const list2 = res2.data?.entregadores || [];
                
                const map = new Map<string, { id: string; nome: string; segundosSem1: number; segundosSem2: number }>();
                
                list1.forEach((e: any) => {
                    map.set(e.id_entregador, {
                        id: e.id_entregador,
                        nome: e.nome_entregador,
                        segundosSem1: e.total_segundos || 0,
                        segundosSem2: 0
                    });
                });
                
                list2.forEach((e: any) => {
                    const existing = map.get(e.id_entregador);
                    if (existing) {
                        existing.segundosSem2 = e.total_segundos || 0;
                    } else {
                        map.set(e.id_entregador, {
                            id: e.id_entregador,
                            nome: e.nome_entregador,
                            segundosSem1: 0,
                            segundosSem2: e.total_segundos || 0
                        });
                    }
                });
                
                const comparisonList = Array.from(map.values())
                    .sort((a, b) => (b.segundosSem1 + b.segundosSem2) - (a.segundosSem1 + a.segundosSem2));
                
                setEntregadoresComparativo(comparisonList);
                setEntregadoresResolvedKey(entregadoresRequestKey);
                setEntregadoresError(null);
            } catch (err) {
                safeLog.error('Erro ao buscar entregadores comparativo:', err);
                if (active) {
                    setEntregadoresComparativo([]);
                    setEntregadoresError({
                        key: entregadoresRequestKey,
                        message: err instanceof Error ? err.message : 'Não foi possível carregar os entregadores. Tente novamente.',
                    });
                }
            }
        };
        
        load();
        return () => { active = false; };
    }, [shouldLoadEntregadores, semanasSelecionadas, parsedWeeks, pracaSelecionada, organizationId, entregadoresRequestKey]);

    const slides = useApresentacaoSlides(
        dadosProcessados, dadosComparacao, utrComparacao,
        dadosBasicos.numeroSemana1, dadosBasicos.numeroSemana2,
        dadosBasicos.periodoSemana1, dadosBasicos.periodoSemana2,
        pracaSelecionada, state.visibleSections, state.mediaSlides, actions.handleUpdateMediaSlide,
        currentEntregadores, isLoadingEntregadores, currentEntregadoresError
    );

    const { goToNextSlide, goToPrevSlide } = usePresentationNavigation(slides, actions.setCurrentSlide);
    const initialOrder = useMemo(() => slides.map(s => s.key), [slides]);

    return {
        state, actions,
        savedPresentations, isLoadingSaves, savedPresentationsError, fetchPresentations, deletePresentation,
        isManagersOpen, setIsManagersOpen,
        isSaveDialogOpen, setIsSaveDialogOpen,
        handleSavePresentation, handleLoadPresentation,
        dadosBasicos, slides, goToNextSlide, goToPrevSlide, initialOrder,
        entregadoresComparativo: currentEntregadores,
        isLoadingEntregadores,
        entregadoresError: currentEntregadoresError
    };
}
