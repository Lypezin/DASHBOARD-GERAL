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
    const { savedPresentations, loading: isLoadingSaves, savePresentation, deletePresentation } = useSavedPresentations();

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

    useEffect(() => {
        if (semanasSelecionadas.length !== 2) return;
        
        let active = true;
        const load = async () => {
            try {
                const getWeekNumber = (weekStr: string): number => {
                    const match = weekStr.match(/\d+/);
                    return match ? Number(match[0]) : 0;
                };
                const sem1 = getWeekNumber(semanasSelecionadas[0]);
                const sem2 = getWeekNumber(semanasSelecionadas[1]);
                
                const [res1, res2] = await Promise.all([
                    fetchEntregadoresData({
                        filterPayload: {
                            p_ano: anoSelecionado,
                            p_semana: sem1,
                            p_praca: pracaSelecionada,
                            p_organization_id: organizationId
                        }
                    }),
                    fetchEntregadoresData({
                        filterPayload: {
                            p_ano: anoSelecionado,
                            p_semana: sem2,
                            p_praca: pracaSelecionada,
                            p_organization_id: organizationId
                        }
                    })
                ]);
                
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
            } catch (err) {
                console.error('Erro ao buscar entregadores comparativo:', err);
            }
        };
        
        load();
        return () => { active = false; };
    }, [semanasSelecionadas, pracaSelecionada, anoSelecionado, organizationId]);

    const slides = useApresentacaoSlides(
        dadosProcessados, dadosComparacao, utrComparacao,
        dadosBasicos.numeroSemana1, dadosBasicos.numeroSemana2,
        dadosBasicos.periodoSemana1, dadosBasicos.periodoSemana2,
        pracaSelecionada, state.visibleSections, state.mediaSlides, actions.handleUpdateMediaSlide,
        entregadoresComparativo
    );

    const { goToNextSlide, goToPrevSlide } = usePresentationNavigation(slides, actions.setCurrentSlide);
    const initialOrder = useMemo(() => slides.map(s => s.key), [slides]);

    return {
        state, actions,
        savedPresentations, isLoadingSaves, deletePresentation,
        isManagersOpen, setIsManagersOpen,
        isSaveDialogOpen, setIsSaveDialogOpen,
        handleSavePresentation, handleLoadPresentation,
        dadosBasicos, slides, goToNextSlide, goToPrevSlide, initialOrder,
        entregadoresComparativo
    };
}
