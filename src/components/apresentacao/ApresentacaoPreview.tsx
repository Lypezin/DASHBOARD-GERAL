import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SLIDE_HEIGHT, SLIDE_WIDTH, slideDimensionsStyle } from './constants';
import { Card } from '@/components/ui/card';
import { ApresentacaoControls } from './components/ApresentacaoControls';
import { ApresentacaoLoadingOverlay } from './components/ApresentacaoLoadingOverlay';
import { usePresentationPDF } from './hooks/usePresentationPDF';

interface ApresentacaoPreviewProps {
  slides: Array<{ key: string; render: (visible: boolean) => React.ReactNode }>;
  currentSlide: number;
  onSlideChange: (index: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  numeroSemana1: string;
  numeroSemana2: string;
  visibleSections: Record<string, boolean>;
  onToggleSection: (section: string) => void;
  onStartPresentation: () => void;
}

export const ApresentacaoPreview: React.FC<ApresentacaoPreviewProps> = ({
  slides,
  currentSlide,
  onSlideChange,
  onNext,
  onPrev,
  onClose,
  numeroSemana1,
  numeroSemana2,
  visibleSections,
  onToggleSection,
  onStartPresentation,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const captureContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.5);

  const { isGenerating, generatingProgress, capturingIndex, generatePDF } = usePresentationPDF({
    slides,
    numeroSemana1,
    numeroSemana2,
    contentRef,
    captureContainerRef
  });

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
        .slide-for-capture {
          font-family: Inter, Arial, sans-serif !important;
        }
      `}</style>

      {/* Hidden container for PDF capture - renders ONLY the active slide being captured */}
      <div
        ref={captureContainerRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        {capturingIndex !== null && slides[capturingIndex] && (
          <div
            key={`capture-${slides[capturingIndex].key}`}
            className="slide-for-capture"
            style={{
              width: SLIDE_WIDTH,
              height: SLIDE_HEIGHT,
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: 'white',
            }}
          >
            {slides[capturingIndex].render(true)}
          </div>
        )}
      </div>

      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <Card className="w-full max-w-6xl h-[95vh] flex flex-col overflow-hidden border-slate-200 dark:border-slate-800 shadow-2xl">
          <ApresentacaoControls
            currentSlide={currentSlide}
            totalSlides={totalSlides}
            onPrev={onPrev}
            onNext={onNext}
            onClose={onClose}
            onGeneratePDF={generatePDF}
            onStartPresentation={onStartPresentation}
            isGenerating={isGenerating}
            visibleSections={visibleSections}
            onToggleSection={onToggleSection}
          />

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

      <ApresentacaoLoadingOverlay
        isGenerating={isGenerating}
        current={generatingProgress.current}
        total={generatingProgress.total}
      />
    </>
  );
};
