import React from 'react';
import { DashboardResumoData, UtrComparacaoItem } from '@/types';
import { ApresentacaoPreview } from './apresentacao/ApresentacaoPreview';
import { ApresentacaoWebMode } from './apresentacao/ApresentacaoWebMode';
import { PresentationContext } from '@/contexts/PresentationContext';
import { MediaManagerModal } from './apresentacao/components/MediaManagerModal';
import { PresentationManager } from './apresentacao/components/PresentationManager';
import { SavePresentationDialog } from './apresentacao/components/SavePresentationDialog';
import { PresentationEditorProvider } from '@/components/apresentacao/context/PresentationEditorContext';
import { useApresentacaoFacade } from '@/hooks/apresentacao/useApresentacaoFacade';
import { exportComparacaoToExcel } from '@/utils/comparacao/exportExcel';
import { safeLog } from '@/lib/errorHandler';
import { toast } from 'sonner';

interface ApresentacaoViewProps {
  dadosComparacao: DashboardResumoData[];
  utrComparacao: UtrComparacaoItem[];
  semanasSelecionadas: string[];
  pracaSelecionada: string | null;
  anoSelecionado?: number;
  dimensionFilters?: Record<string, unknown>;
  onClose: () => void;
  onPracaChange?: (praca: string) => void;
  onSemanasChange?: (semanas: string[]) => void;
}

const ApresentacaoView: React.FC<ApresentacaoViewProps> = (props) => {
  const facade = useApresentacaoFacade(props);
  const [isExportingExcel, setIsExportingExcel] = React.useState(false);

  const handleExportExcel = React.useCallback(async () => {
    if (isExportingExcel) return;

    const includesEntregadores = facade.state.visibleSections.entregadores === true;
    if (includesEntregadores && facade.isLoadingEntregadores) return;
    if (includesEntregadores && facade.entregadoresError) {
      toast.error(`Não foi possível incluir os entregadores no Excel: ${facade.entregadoresError}`);
      return;
    }

    setIsExportingExcel(true);
    try {
      await exportComparacaoToExcel(
        props.dadosComparacao,
        props.utrComparacao,
        props.semanasSelecionadas,
        props.pracaSelecionada,
        facade.entregadoresComparativo,
        {
          p_ano: props.anoSelecionado,
          p_semanas: props.semanasSelecionadas,
          p_praca: props.pracaSelecionada,
          ...props.dimensionFilters,
        }
      );
    } catch (error) {
      safeLog.error('Erro ao exportar comparativo para Excel:', error);
      toast.error(error instanceof Error ? error.message : 'Não foi possível gerar o Excel comparativo.');
    } finally {
      setIsExportingExcel(false);
    }
  }, [facade.entregadoresComparativo, facade.entregadoresError, facade.isLoadingEntregadores, facade.state.visibleSections, isExportingExcel, props.anoSelecionado, props.dadosComparacao, props.dimensionFilters, props.pracaSelecionada, props.semanasSelecionadas, props.utrComparacao]);

  const {
    state, actions, savedPresentations, isLoadingSaves, savedPresentationsError, fetchPresentations, deletePresentation,
    isManagersOpen, setIsManagersOpen, isSaveDialogOpen, setIsSaveDialogOpen,
    handleSavePresentation, handleLoadPresentation, dadosBasicos, slides,
    goToNextSlide, goToPrevSlide, initialOrder, entregadoresComparativo
  } = facade;

  const isWebMode = state.viewMode === 'web_presentation';

  return (
    <PresentationEditorProvider initialOrder={initialOrder}>
      <PresentationContext.Provider value={{ isWebMode }}>
        {isWebMode ? (
          <ApresentacaoWebMode
            slides={state.orderedPresentationSlides.length > 0 ? state.orderedPresentationSlides : slides}
            currentSlide={state.currentSlide}
            onSlideChange={actions.setCurrentSlide}
            onNext={goToNextSlide}
            onPrev={goToPrevSlide}
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
            onExportExcel={handleExportExcel}
            isExportingExcel={isExportingExcel}
            exportDisabled={facade.state.visibleSections.entregadores === true && facade.isLoadingEntregadores}
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
          error={savedPresentationsError}
          onRetry={fetchPresentations}
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
