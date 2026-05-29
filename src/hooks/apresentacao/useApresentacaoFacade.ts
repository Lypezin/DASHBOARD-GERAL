import { useState, useMemo } from 'react';
import { useApresentacaoController } from './useApresentacaoController';
import { useSavedPresentations } from './useSavedPresentations';
import { usePresentationManagerActions } from './usePresentationManagerActions';
import { useApresentacaoData } from './useApresentacaoData';
import { useApresentacaoSlides } from './useApresentacaoSlides';
import { usePresentationNavigation } from './usePresentationNavigation';
import { DashboardResumoData } from '@/types';

interface FacadeProps {
    dadosComparacao: DashboardResumoData[];
    utrComparacao: any[];
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

    const slides = useApresentacaoSlides(
        dadosProcessados, dadosComparacao, utrComparacao,
        dadosBasicos.numeroSemana1, dadosBasicos.numeroSemana2,
        dadosBasicos.periodoSemana1, dadosBasicos.periodoSemana2,
        pracaSelecionada, state.visibleSections, state.mediaSlides, actions.handleUpdateMediaSlide
    );

    const { goToNextSlide, goToPrevSlide } = usePresentationNavigation(slides, actions.setCurrentSlide);
    const initialOrder = useMemo(() => slides.map(s => s.key), [slides]);

    return {
        state, actions,
        savedPresentations, isLoadingSaves, deletePresentation,
        isManagersOpen, setIsManagersOpen,
        isSaveDialogOpen, setIsSaveDialogOpen,
        handleSavePresentation, handleLoadPresentation,
        dadosBasicos, slides, goToNextSlide, goToPrevSlide, initialOrder
    };
}
