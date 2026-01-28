import React from 'react';
import { DashboardResumoData } from '@/types';
import { useApresentacaoData } from '@/hooks/apresentacao/useApresentacaoData';
import { useApresentacaoSlides } from '@/hooks/apresentacao/useApresentacaoSlides';
import { ApresentacaoPreview } from './apresentacao/ApresentacaoPreview';
import { ApresentacaoWebMode } from './apresentacao/ApresentacaoWebMode';
import { PresentationContext } from '@/contexts/PresentationContext';
import { MediaManagerModal } from './apresentacao/components/MediaManagerModal';
import { PresentationManager } from './apresentacao/components/PresentationManager';
import { SavePresentationDialog } from './apresentacao/components/SavePresentationDialog';
import { useApresentacaoController } from '@/hooks/apresentacao/useApresentacaoController';
import { useSavedPresentations } from '@/hooks/apresentacao/useSavedPresentations';
import { PresentationEditorProvider } from '@/components/apresentacao/context/PresentationEditorContext';
import { usePresentationNavigation } from '@/hooks/apresentacao/usePresentationNavigation';
import { usePresentationManagerActions } from '@/hooks/apresentacao/usePresentationManagerActions';

interface ApresentacaoViewProps {
  dadosComparacao: DashboardResumoData[];
  utrComparacao: any[]; // UtrComparacaoItem[]
  semanasSelecionadas: string[];
  pracaSelecionada: string | null;
  anoSelecionado?: number;
  onClose: () => void;
  onPracaChange?: (praca: string) => void;
  onSemanasChange?: (semanas: string[]) => void;
}

const ApresentacaoView: React.FC<ApresentacaoViewProps> = ({
  dadosComparacao,
  utrComparacao,
  semanasSelecionadas,
  pracaSelecionada,
  anoSelecionado,
  onClose,
  onPracaChange,
  onSemanasChange,
}) => {
  const { state, actions } = useApresentacaoController({
    praca: pracaSelecionada,
    ano: anoSelecionado,
    semanas: semanasSelecionadas
  });
  const {
    currentSlide, viewMode, visibleSections,
    mediaSlides, isMediaManagerOpen, orderedPresentationSlides
  } = state;
  const {
    setCurrentSlide, setViewMode,
    setIsMediaManagerOpen, setOrderedPresentationSlides, setMediaSlides,
    handleUpdateMediaSlide, handleAddMediaSlide, handleDeleteMediaSlide, toggleSection
  } = actions;

  // Saved Presentations Logic
  const { savedPresentations, loading: isLoadingSaves, savePresentation, deletePresentation } = useSavedPresentations();
  const [isManagersOpen, setIsManagersOpen] = React.useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = React.useState(false);

  // Extracted Actions
  const { handleSavePresentation, handleLoadPresentation } = usePresentationManagerActions({
    savePresentation,
    mediaSlides,
    visibleSections,
    pracaSelecionada,
    anoSelecionado,
    semanasSelecionadas,
    setMediaSlides,
    setVisibleSections: actions.setVisibleSections,
    setIsManagersOpen,
    onPracaChange,
    onSemanasChange
  });

  const { dadosBasicos, dadosProcessados } = useApresentacaoData(dadosComparacao, semanasSelecionadas, anoSelecionado);
  const { numeroSemana1, numeroSemana2, periodoSemana1, periodoSemana2 } = dadosBasicos;

  const slides = useApresentacaoSlides(
    dadosProcessados,
    dadosComparacao,
    utrComparacao,
    numeroSemana1,
    numeroSemana2,
    periodoSemana1,
    periodoSemana2,
    pracaSelecionada,
    visibleSections,
    mediaSlides,
    handleUpdateMediaSlide
  );

  // Extracted Navigation
  const { goToNextSlide, goToPrevSlide } = usePresentationNavigation(slides, setCurrentSlide);

  const isWebMode = viewMode === 'web_presentation';

  // Calculate initial order from slides
  const initialOrder = React.useMemo(() => slides.map(s => s.key), [slides]);

  return (
    <PresentationEditorProvider initialOrder={initialOrder}>
      <PresentationContext.Provider value={{ isWebMode }}>
        {viewMode === 'web_presentation' ? (
          <ApresentacaoWebMode
            slides={orderedPresentationSlides.length > 0 ? orderedPresentationSlides : slides}
            onClose={() => setViewMode('preview')}
          />
        ) : (
          <ApresentacaoPreview
            slides={slides}
            currentSlide={currentSlide}
            onSlideChange={setCurrentSlide}
            onNext={goToNextSlide}
            onPrev={goToPrevSlide}
            onClose={onClose}
            numeroSemana1={numeroSemana1}
            numeroSemana2={numeroSemana2}
            visibleSections={visibleSections}
            onToggleSection={toggleSection}
            onStartPresentation={(orderedSlides) => {
              setOrderedPresentationSlides(orderedSlides);
              setViewMode('web_presentation');
            }}
            mediaSlides={mediaSlides}
            onUpdateMediaSlide={handleUpdateMediaSlide}
            onAddMediaSlide={handleAddMediaSlide}
            onDeleteMediaSlide={handleDeleteMediaSlide}
            onManageClick={() => setIsManagersOpen(true)}
            onSaveClick={() => setIsSaveDialogOpen(true)}
          />
        )}

        <MediaManagerModal
          isOpen={isMediaManagerOpen}
          onClose={() => setIsMediaManagerOpen(false)}
          mediaSlides={mediaSlides}
          onUpdateSlides={setMediaSlides}
        />

        <PresentationManager
          isOpen={isManagersOpen}
          onClose={() => setIsManagersOpen(false)}
          presentations={savedPresentations}
          onLoad={handleLoadPresentation}
          onDelete={deletePresentation}
          isLoading={isLoadingSaves}
        />
        <SavePresentationDialog
          isOpen={isSaveDialogOpen}
          onClose={() => setIsSaveDialogOpen(false)}
          onSave={handleSavePresentation}
        />
      </PresentationContext.Provider>
    </PresentationEditorProvider>
  );
};

export default ApresentacaoView;
