
import React, { useEffect } from 'react';
import { DashboardResumoData } from '@/types';
import { useApresentacaoData } from '@/hooks/apresentacao/useApresentacaoData';
import { useApresentacaoSlides } from '@/hooks/apresentacao/useApresentacaoSlides';
import { ApresentacaoPreview } from './apresentacao/ApresentacaoPreview';
import { ApresentacaoWebMode } from './apresentacao/ApresentacaoWebMode';
import { PresentationContext } from '@/contexts/PresentationContext';
import { MediaManagerModal } from './apresentacao/components/MediaManagerModal';
import { useApresentacaoController } from '@/hooks/apresentacao/useApresentacaoController';

interface ApresentacaoViewProps {
  dadosComparacao: DashboardResumoData[];
  semanasSelecionadas: string[];
  pracaSelecionada: string | null;
  onClose: () => void;
}

const ApresentacaoView: React.FC<ApresentacaoViewProps> = ({
  dadosComparacao,
  semanasSelecionadas,
  pracaSelecionada,
  onClose,
}) => {
  const { state, actions } = useApresentacaoController();
  const {
    currentSlide, viewMode, visibleSections,
    mediaSlides, isMediaManagerOpen, orderedPresentationSlides
  } = state;
  const {
    setCurrentSlide, setViewMode,
    setIsMediaManagerOpen, setOrderedPresentationSlides, setMediaSlides,
    handleUpdateMediaSlide, handleAddMediaSlide, handleDeleteMediaSlide, toggleSection
  } = actions;

  const { dadosBasicos, dadosProcessados } = useApresentacaoData(dadosComparacao, semanasSelecionadas);
  const { numeroSemana1, numeroSemana2, periodoSemana1, periodoSemana2 } = dadosBasicos;

  const slides = useApresentacaoSlides(
    dadosProcessados,
    dadosComparacao,
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

  return (
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
        />
      )}

      <MediaManagerModal
        isOpen={isMediaManagerOpen}
        onClose={() => setIsMediaManagerOpen(false)}
        mediaSlides={mediaSlides}
        onUpdateSlides={setMediaSlides}
      />
    </PresentationContext.Provider>
  );
};

export default ApresentacaoView;
