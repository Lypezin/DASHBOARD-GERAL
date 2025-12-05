'use client';

import React, { useState, useEffect } from 'react';
import { DashboardResumoData } from '@/types';
import { useApresentacaoData } from '@/hooks/apresentacao/useApresentacaoData';
import { useApresentacaoSlides } from '@/hooks/apresentacao/useApresentacaoSlides';
import { ApresentacaoPreview } from './apresentacao/ApresentacaoPreview';

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

  const { dadosBasicos, dadosProcessados } = useApresentacaoData(dadosComparacao, semanasSelecionadas);
  const { numeroSemana1, numeroSemana2, periodoSemana1, periodoSemana2 } = dadosBasicos;

  const slides = useApresentacaoSlides(
    dadosProcessados,
    dadosComparacao,
    numeroSemana1,
    numeroSemana2,
    periodoSemana1,
    periodoSemana2,
    pracaSelecionada
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

  return (
    <ApresentacaoPreview
      slides={slides}
      currentSlide={currentSlide}
      onSlideChange={setCurrentSlide}
      onNext={goToNextSlide}
      onPrev={goToPrevSlide}
      onClose={onClose}
      numeroSemana1={numeroSemana1}
      numeroSemana2={numeroSemana2}
    />
  );
};

export default ApresentacaoView;