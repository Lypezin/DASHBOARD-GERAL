import React, { useState, useEffect } from 'react';
import { DashboardResumoData } from '@/types';
import { useApresentacaoData } from '@/hooks/apresentacao/useApresentacaoData';
import { useApresentacaoSlides } from '@/hooks/apresentacao/useApresentacaoSlides';
import { ApresentacaoPreview } from './apresentacao/ApresentacaoPreview';
import { ApresentacaoWebMode } from './apresentacao/ApresentacaoWebMode';
import { PresentationContext } from '@/contexts/PresentationContext';
import { MediaSlideData } from '@/types/presentation';
import { MediaManagerModal } from './apresentacao/components/MediaManagerModal';

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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [viewMode, setViewMode] = useState<'preview' | 'web_presentation'>('preview');

  const [visibleSections, setVisibleSections] = useState({
    capa: true,
    'aderencia-geral': true,
    'sub-pracas': true,
    'aderencia-diaria': true,
    turnos: true,
    origens: true,
    demanda: true,
    'capa-final': true,
  });

  // Media Files State
  const [mediaSlides, setMediaSlides] = useState<MediaSlideData[]>([]);
  const [isMediaManagerOpen, setIsMediaManagerOpen] = useState(false);

  // Ordered Slides for Presentation Mode
  const [orderedPresentationSlides, setOrderedPresentationSlides] = useState<Array<{ key: string; render: (visible: boolean) => React.ReactNode }>>([]);

  const { dadosBasicos, dadosProcessados } = useApresentacaoData(dadosComparacao, semanasSelecionadas);
  const { numeroSemana1, numeroSemana2, periodoSemana1, periodoSemana2 } = dadosBasicos;

  const handleUpdateMediaSlide = (id: string, updates: Partial<MediaSlideData>) => {
    setMediaSlides(prev => prev.map(slide =>
      slide.id === id ? { ...slide, ...updates } : slide
    ));
  };

  const handleAddMediaSlide = () => {
    const newSlide: MediaSlideData = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'Novo Slide',
      elements: []
    };
    setMediaSlides(prev => [...prev, newSlide]);
    // Optionally jump to new slide? Requires knowing index mapping. 
    // Let sidebar handle selection logic if needed or just let user click.
  };

  const handleDeleteMediaSlide = (id: string) => {
    setMediaSlides(prev => prev.filter(s => s.id !== id));
  };

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
  }, [slides.length]);

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
          onToggleSection={(section) => setVisibleSections(prev => ({ ...prev, [section]: !prev[section as keyof typeof prev] }))}
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
