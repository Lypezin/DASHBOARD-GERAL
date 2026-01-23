
import React, { useEffect } from 'react';
import { DashboardResumoData } from '@/types';
import { useApresentacaoData } from '@/hooks/apresentacao/useApresentacaoData';
import { useApresentacaoSlides } from '@/hooks/apresentacao/useApresentacaoSlides';
import { ApresentacaoPreview } from './apresentacao/ApresentacaoPreview';
import { ApresentacaoWebMode } from './apresentacao/ApresentacaoWebMode';
import { PresentationEditorProvider } from '@/components/apresentacao/context/PresentationEditorContext';

// ... existing imports

const ApresentacaoView: React.FC<ApresentacaoViewProps> = ({
  // ... props
}) => {
  // ... existing hooks

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
          />
        )}

        <MediaManagerModal
          isOpen={isMediaManagerOpen}
          onClose={() => setIsMediaManagerOpen(false)}
          mediaSlides={mediaSlides}
          onUpdateSlides={setMediaSlides}
        />
      </PresentationContext.Provider>
    </PresentationEditorProvider>
  );
};

export default ApresentacaoView;
