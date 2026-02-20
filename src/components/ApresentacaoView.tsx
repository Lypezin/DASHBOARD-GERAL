import React from 'react';
import { DashboardResumoData } from '@/types';
import { ApresentacaoPreview } from './apresentacao/ApresentacaoPreview';
import { ApresentacaoWebMode } from './apresentacao/ApresentacaoWebMode';
import { PresentationContext } from '@/contexts/PresentationContext';
import { MediaManagerModal } from './apresentacao/components/MediaManagerModal';
import { PresentationManager } from './apresentacao/components/PresentationManager';
import { SavePresentationDialog } from './apresentacao/components/SavePresentationDialog';
import { PresentationEditorProvider } from '@/components/apresentacao/context/PresentationEditorContext';
import { useApresentacaoFacade } from '@/hooks/apresentacao/useApresentacaoFacade';

interface ApresentacaoViewProps {
  dadosComparacao: DashboardResumoData[];
  utrComparacao: any[];
  semanasSelecionadas: string[];
  pracaSelecionada: string | null;
  anoSelecionado?: number;
  onClose: () => void;
  onPracaChange?: (praca: string) => void;
  onSemanasChange?: (semanas: string[]) => void;
}

const ApresentacaoView: React.FC<ApresentacaoViewProps> = (props) => {
  const facade = useApresentacaoFacade(props);

  const {
    state, actions, savedPresentations, isLoadingSaves, deletePresentation,
    isManagersOpen, setIsManagersOpen, isSaveDialogOpen, setIsSaveDialogOpen,
    handleSavePresentation, handleLoadPresentation, dadosBasicos, slides,
    goToNextSlide, goToPrevSlide, initialOrder
  } = facade;

  const isWebMode = state.viewMode === 'web_presentation';

  return (
    <PresentationEditorProvider initialOrder={initialOrder}>
      <PresentationContext.Provider value={{ isWebMode }}>
        {isWebMode ? (
          <ApresentacaoWebMode
            slides={state.orderedPresentationSlides.length > 0 ? state.orderedPresentationSlides : slides}
            onClose={() => actions.setViewMode('preview')}
          />
        ) : (
          <ApresentacaoPreview
            slides={slides}
            currentSlide={state.currentSlide}
            onSlideChange={actions.setCurrentSlide}
            onNext={goToNextSlide}
            onPrev={goToPrevSlide}
            onClose={props.onClose}
            numeroSemana1={dadosBasicos.numeroSemana1}
            numeroSemana2={dadosBasicos.numeroSemana2}
            visibleSections={state.visibleSections}
            onToggleSection={actions.toggleSection}
            onStartPresentation={(orderedSlides) => {
              actions.setOrderedPresentationSlides(orderedSlides);
              actions.setViewMode('web_presentation');
            }}
            mediaSlides={state.mediaSlides}
            onUpdateMediaSlide={actions.handleUpdateMediaSlide}
            onAddMediaSlide={actions.handleAddMediaSlide}
            onDeleteMediaSlide={actions.handleDeleteMediaSlide}
            onManageClick={() => setIsManagersOpen(true)}
            onSaveClick={() => setIsSaveDialogOpen(true)}
          />
        )}

        <MediaManagerModal
          isOpen={state.isMediaManagerOpen}
          onClose={() => actions.setIsMediaManagerOpen(false)}
          mediaSlides={state.mediaSlides}
          onUpdateSlides={actions.setMediaSlides}
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
