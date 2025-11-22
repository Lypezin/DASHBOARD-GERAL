import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SLIDE_HEIGHT, SLIDE_WIDTH, slideDimensionsStyle } from './constants';

interface ApresentacaoPreviewProps {
  slides: Array<{ key: string; render: (visible: boolean) => React.ReactNode }>;
  currentSlide: number;
  onSlideChange: (index: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onGeneratePDF: () => void;
  isGenerating: boolean;
  onClose: () => void;
}

export const ApresentacaoPreview: React.FC<ApresentacaoPreviewProps> = ({
  slides,
  currentSlide,
  onSlideChange,
  onNext,
  onPrev,
  onGeneratePDF,
  isGenerating,
  onClose,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.5);

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
      `}</style>
      
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        {isGenerating && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50">
            <svg className="animate-spin h-16 w-16 text-white mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h2 className="text-white text-2xl font-bold">Gerando PDF, por favor aguarde...</h2>
            <p className="text-white text-lg mt-2">Isso pode levar alguns segundos.</p>
          </div>
        )}
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full h-[95vh] flex flex-col">
          <div className="sticky top-0 bg-white p-4 border-b border-slate-200 flex justify-between items-center z-10">
            <h3 className="text-xl font-bold text-slate-800">Preview da Apresentação</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={onPrev}
                  disabled={currentSlide === 0 || totalSlides === 0}
                  className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg shadow-sm hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-slate-600 font-medium text-sm">
                  {slideAtualExibicao} / {totalSlides}
                </span>
                <button
                  onClick={onNext}
                  disabled={totalSlides === 0 || currentSlide === totalSlides - 1}
                  className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg shadow-sm hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo
                </button>
              </div>
              <div className="h-6 w-px bg-slate-300"></div>
              <button
                onClick={onGeneratePDF}
                disabled={totalSlides === 0 || isGenerating}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-3 min-w-[140px] justify-center"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Gerando...</span>
                  </>
                ) : (
                  <>
                    <span>📄</span>
                    <span>Gerar PDF</span>
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg shadow-md hover:bg-slate-300 transition-colors"
              >
                ✕ Fechar
              </button>
            </div>
          </div>

          <div
            ref={previewContainerRef}
            className="bg-slate-100 flex-1 overflow-hidden p-4"
            style={{ position: 'relative' }}
          >
            <div
              ref={contentRef}
              className="relative"
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
                  className="slide bg-gradient-to-br from-blue-600 to-blue-800 text-white absolute inset-0 flex items-center justify-center text-4xl font-semibold"
                  style={slideDimensionsStyle}
                >
                  Nenhum dado disponível.
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
        </div>
      </div>

      {/* Overlay de carregamento */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]">
          <div className="bg-white rounded-xl p-8 shadow-2xl flex flex-col items-center gap-6 max-w-sm mx-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Gerando PDF
              </h3>
              <p className="text-sm text-gray-600">
                Processando slides e otimizando qualidade...
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Aguarde, não feche esta janela
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

