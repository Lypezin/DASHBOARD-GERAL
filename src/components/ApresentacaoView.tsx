import React, { useState, useEffect } from 'react';
import { DashboardResumoData } from '@/types';
import { useApresentacaoData } from '@/hooks/apresentacao/useApresentacaoData';
import { useApresentacaoSlides } from '@/hooks/apresentacao/useApresentacaoSlides';
import { ApresentacaoPreview } from './apresentacao/ApresentacaoPreview';
import { ApresentacaoWebMode } from './apresentacao/ApresentacaoWebMode';
import { PresentationContext } from '@/contexts/PresentationContext';

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
  });

  // Media Files State (DataURLs)
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);

  const handleAddMedia = (files: File[]) => {
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setMediaFiles(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

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
    mediaFiles
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
          slides={slides}
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
          onStartPresentation={() => setViewMode('web_presentation')}
          onAddMedia={handleAddMedia}
        />
      )}
    </PresentationContext.Provider>
  );
};

export default ApresentacaoView;
