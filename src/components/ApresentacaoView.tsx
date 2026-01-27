import React, { useEffect } from 'react';
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
import { useSavedPresentations, SavedPresentation } from '@/hooks/apresentacao/useSavedPresentations';
import { PresentationEditorProvider } from '@/components/apresentacao/context/PresentationEditorContext';
import { toast } from 'sonner';

interface ApresentacaoViewProps {
  dadosComparacao: DashboardResumoData[];
  utrComparacao: any[]; // UtrComparacaoItem[]
  semanasSelecionadas: string[];
  pracaSelecionada: string | null;
  anoSelecionado?: number;
  onClose: () => void;
}

const ApresentacaoView: React.FC<ApresentacaoViewProps> = ({
  dadosComparacao,
  utrComparacao,
  semanasSelecionadas,
  pracaSelecionada,
  anoSelecionado,
  onClose,
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
    setIsMediaManagerOpen, setOrderedPresentationSlides, setMediaSlides, setVisibleSections,
    handleUpdateMediaSlide, handleAddMediaSlide, handleDeleteMediaSlide, toggleSection
  } = actions;

  // Saved Presentations Logic
  const { savedPresentations, loading: isLoadingSaves, savePresentation, deletePresentation } = useSavedPresentations();
  const [isManagersOpen, setIsManagersOpen] = React.useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = React.useState(false);

  const handleSavePresentation = async (name: string) => {
    try {
      await savePresentation(name, mediaSlides, visibleSections, {
        praca: pracaSelecionada,
        ano: anoSelecionado,
        semanas: semanasSelecionadas
      });
      toast({ title: 'Sucesso', description: 'Apresentação salva com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao salvar apresentação.', variant: 'destructive' });
    }
  };

  const handleLoadPresentation = (pres: SavedPresentation) => {
    // Need to verify if setVisibleSections is available in actions
    // useApresentacaoController returns toggleSection and setVisibleSections
    if (pres.slides) setMediaSlides(pres.slides);
    if (pres.sections) actions.setVisibleSections(pres.sections);
    setIsManagersOpen(false);
    toast({ title: 'Carregado', description: `Apresentação "${pres.name}" carregada.` });
  };

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

  useEffect(() => {
    setCurrentSlide((prev) => {
      if (slides.length === 0) return 0;
      return Math.min(prev, slides.length - 1);
    });
  }, [slides.length, setCurrentSlide]);

  const goToNextSlide = () => {
    setCurrentSlide((prev) => {
      if (slides.length === 0) return 0;
      return Math.min(prev + 1, slides.length - 1);
    });
  };

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => {
      if (slides.length === 0) return 0;
      return Math.max(prev - 1, 0);
    });
  };

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
