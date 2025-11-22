'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DashboardResumoData } from '@/types';
import { useApresentacaoData } from '@/hooks/apresentacao/useApresentacaoData';
import { useApresentacaoSlides } from '@/hooks/apresentacao/useApresentacaoSlides.tsx';
import { prepararSlidesPDF, gerarPDF } from '@/utils/apresentacao/pdfGenerator';
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
  const [isGenerating, setIsGenerating] = useState(false);
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

  // Preparar dados dos slides para pdfmake
  const slidesPDFData = useMemo(() => {
    if (!dadosProcessados) return [];
    return prepararSlidesPDF(
      dadosProcessados,
      numeroSemana1,
      numeroSemana2,
      periodoSemana1,
      periodoSemana2,
      pracaSelecionada
    );
  }, [dadosProcessados, numeroSemana1, numeroSemana2, periodoSemana1, periodoSemana2, pracaSelecionada]);

  const handleGerarPDF = async () => {
    setIsGenerating(true);
    try {
      await gerarPDF(slidesPDFData, numeroSemana1, numeroSemana2);
    } finally {
      setIsGenerating(false);
    }
  };

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
      onGeneratePDF={handleGerarPDF}
      isGenerating={isGenerating}
      onClose={onClose}
    />
  );
};

export default ApresentacaoView;