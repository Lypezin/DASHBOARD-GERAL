

import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { SLIDE_HEIGHT, SLIDE_WIDTH, slideDimensionsStyle } from './constants';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, FileDown, X, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ApresentacaoPreviewProps {
  slides: Array<{ key: string; render: (visible: boolean) => React.ReactNode }>;
  currentSlide: number;
  onSlideChange: (index: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  numeroSemana1: string;
  numeroSemana2: string;
}

// A4 Landscape dimensions in mm
const A4_WIDTH_MM = 297;
const A4_HEIGHT_MM = 210;
const SCALE_FACTOR = 2;

export const ApresentacaoPreview: React.FC<ApresentacaoPreviewProps> = ({
  slides,
  currentSlide,
  onSlideChange,
  onNext,
  onPrev,
  onClose,
  numeroSemana1,
  numeroSemana2,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const captureContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState({ current: 0, total: 0 });

  const calculateScale = useCallback(() => {
    if (previewContainerRef.current && contentRef.current) {
      const container = previewContainerRef.current.getBoundingClientRect();
      const availableWidth = container.width - 32;
      const availableHeight = container.height - 32;
      const scaleX = availableWidth / SLIDE_WIDTH;
      const scaleY = availableHeight / SLIDE_HEIGHT;
      const scale = Math.min(scaleX, scaleY) * 0.95;
      setPreviewScale(Math.max(0.1, Math.min(1, scale)));
    }
  }, []);

  useEffect(() => {
    calculateScale();
    const timeoutId = setTimeout(calculateScale, 100);
    window.addEventListener('resize', calculateScale);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', calculateScale);
    };
  }, [calculateScale]);

  const totalSlides = slides.length;
  const slideAtualExibicao = totalSlides > 0 ? currentSlide + 1 : 0;

  // Generate PDF using html2canvas
  const handleGeneratePDF = async () => {
    if (slides.length === 0 || !captureContainerRef.current) return;

    setIsGenerating(true);
    setGeneratingProgress({ current: 0, total: slides.length });

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const slideElements = captureContainerRef.current.querySelectorAll('.slide-for-capture');

      for (let i = 0; i < slideElements.length; i++) {
        setGeneratingProgress({ current: i + 1, total: slides.length });

        const slideElement = slideElements[i] as HTMLElement;

        // Capture slide with html2canvas
        const canvas = await html2canvas(slideElement, {
          scale: SCALE_FACTOR,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          logging: false,
        });

        // Add page (except for first slide)
        if (i > 0) {
          pdf.addPage();
        }

        // Add image to PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        pdf.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);

        // Small delay to allow UI updates
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Download PDF
      const filename = `Comparativo_Semana${numeroSemana1}_vs_Semana${numeroSemana2}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsGenerating(false);
      setGeneratingProgress({ current: 0, total: 0 });
    }
  };

  return (
    <>
      {/* CSS Global para sincronizar preview com PDF */}
      <style>{`
        .slide * {
          font-family: Inter, Arial, sans-serif !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
          text-rendering: optimizeLegibility !important;
          box-sizing: border-box !important;
        }
        .slide .absolute {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .slide span {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-align: center !important;
          word-break: break-word !important;
          white-space: normal !important;
        }
        .slide-for-capture {
          font-family: Inter, Arial, sans-serif !important;
        }
      `}</style>

      {/* Hidden container for PDF capture - renders ALL slides at full size */}
      <div
        ref={captureContainerRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT * slides.length,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        {slides.map((slide) => (
          <div
            key={`capture-${slide.key}`}
            className="slide-for-capture"
            style={{
              width: SLIDE_WIDTH,
              height: SLIDE_HEIGHT,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {slide.render(true)}
          </div>
        ))}
      </div>

      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <Card className="w-full max-w-6xl h-[95vh] flex flex-col overflow-hidden border-slate-200 dark:border-slate-800 shadow-2xl">
          <div className="sticky top-0 bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center z-10">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Preview da Apresentação</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPrev}
                  disabled={currentSlide === 0 || totalSlides === 0}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300 min-w-[3rem] text-center">
                  {slideAtualExibicao} / {totalSlides}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onNext}
                  disabled={totalSlides === 0 || currentSlide === totalSlides - 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

              <Button
                onClick={handleGeneratePDF}
                disabled={totalSlides === 0 || isGenerating}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4 w-4" />
                    Gerar PDF
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={onClose}
                className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="mr-2 h-4 w-4" />
                Fechar
              </Button>
            </div>
          </div>

          <div
            ref={previewContainerRef}
            className="bg-slate-100 dark:bg-slate-950 flex-1 overflow-hidden p-4 relative"
          >
            <div
              ref={contentRef}
              className="relative shadow-2xl"
              style={{
                ...slideDimensionsStyle,
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) scale(${previewScale})`,
                transformOrigin: 'center center',
                fontFamily: 'Inter, Arial, sans-serif',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                textRendering: 'optimizeLegibility',
              }}
            >
              {totalSlides === 0 ? (
                <div
                  className="slide bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 absolute inset-0 flex items-center justify-center text-xl font-medium border border-slate-200 dark:border-slate-800 rounded-lg"
                  style={slideDimensionsStyle}
                >
                  Nenhum dado disponível para visualização.
                </div>
              ) : (
                slides.map((slide, index) => (
                  <React.Fragment key={slide.key}>
                    {slide.render(currentSlide === index)}
                  </React.Fragment>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Overlay de carregamento com progresso */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] animate-in fade-in duration-200">
          <Card className="p-8 shadow-2xl flex flex-col items-center gap-6 max-w-sm mx-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin relative z-10" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Gerando PDF
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Processando slide {generatingProgress.current} de {generatingProgress.total}...
              </p>
              {/* Progress bar */}
              <div className="w-48 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{
                    width: generatingProgress.total > 0
                      ? `${(generatingProgress.current / generatingProgress.total) * 100}%`
                      : '0%'
                  }}
                />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Aguarde, não feche esta janela
              </p>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

