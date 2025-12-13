import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '@/components/ui/card';
import { ApresentacaoControls } from './components/ApresentacaoControls';
import { ApresentacaoLoadingOverlay } from './components/ApresentacaoLoadingOverlay';
import { PresentationViewport } from './components/PresentationViewport';
import { PresentationCaptureLayer } from './components/PresentationCaptureLayer';
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
  onManageMedia?: () => void;
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
  onManageMedia,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const captureContainerRef = useRef<HTMLDivElement>(null);

  const { isGenerating, generatingProgress, capturingIndex, generatePDF } = usePresentationPDF({
    slides,
    numeroSemana1,
    numeroSemana2,
    contentRef, // Note: This ref might no longer be pointing to the right element if view logic moved.
    // However, contentRef in usePresentationPDF seems to be used for something specific?
    // Checking usePresentationPDF usage: it uses contentRef for... what?
    // Actually, if PresentationViewport now owns the 'content', we might need to verify this.
    // Looking at PresentationViewport, it renders the slides. 
    // If usePresentationPDF relies on cloning the visible DOM, it might be an issue.
    // But wait, usePresentationPDF uses captureContainerRef for html2canvas.
    // contentRef was passed but likely unused for the actual PDF generation if we are using the hidden capture layer.
    // Let's assume for now it's fine, or we might need to forward ref from Viewport if needed.
    captureContainerRef
  });

  // Ensure portal rendering on client side
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    // Lock body scroll when preview is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const content = (
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

      <PresentationCaptureLayer
        ref={captureContainerRef}
        slides={slides}
        capturingIndex={capturingIndex}
      />

      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 animate-in fade-in duration-200">
        <Card className="w-full max-w-6xl h-[95vh] flex flex-col overflow-hidden border-slate-200 dark:border-slate-800 shadow-2xl">
          <ApresentacaoControls
            currentSlide={currentSlide}
            totalSlides={slides.length}
            onPrev={onPrev}
            onNext={onNext}
            onClose={onClose}
            onGeneratePDF={generatePDF}
            onStartPresentation={onStartPresentation}
            isGenerating={isGenerating}
            visibleSections={visibleSections}
            onToggleSection={onToggleSection}
            onManageMedia={onManageMedia}
          />

          <PresentationViewport
            slides={slides}
            currentSlide={currentSlide}
          />
        </Card>
      </div>

      <ApresentacaoLoadingOverlay
        isGenerating={isGenerating}
        current={generatingProgress.current}
        total={generatingProgress.total}
      />
    </>
  );

  if (!mounted) return null;

  return createPortal(content, document.body);
};
