import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '@/components/ui/card';
import { ApresentacaoControls } from './components/ApresentacaoControls';
import { ApresentacaoLoadingOverlay } from './components/ApresentacaoLoadingOverlay';
import { PresentationViewport } from './components/PresentationViewport';
import { PresentationCaptureLayer } from './components/PresentationCaptureLayer';
import { SlideSidebar } from './slides/components/SlideSidebar';
import { MediaToolbar } from './components/MediaToolbar';
import { MediaSlideData } from '@/types/presentation';
import { usePresentationEditor } from './context/PresentationEditorContext';
import { usePreviewController } from './hooks/usePreviewController';
import { useMediaActions } from './hooks/useMediaActions';

interface ApresentacaoPreviewProps {
  slides: Array<{ key: string; render: (visible: boolean) => React.ReactNode }>;
  currentSlide: number; onSlideChange: (index: number) => void; onNext: () => void; onPrev: () => void; onClose: () => void;
  numeroSemana1: string; numeroSemana2: string; visibleSections: Record<string, boolean>; onToggleSection: (section: string) => void;
  onStartPresentation: (orderedSlides: Array<{ key: string; render: (visible: boolean) => React.ReactNode }>) => void;
  mediaSlides?: MediaSlideData[]; onUpdateMediaSlide?: (id: string, updates: Partial<MediaSlideData>) => void;
  onAddMediaSlide?: () => string | void; onDeleteMediaSlide?: (id: string) => void; onManageMedia?: () => void;
  onSaveClick?: () => void; onManageClick?: () => void;
  onExportExcel?: () => void;
}

const ApresentacaoPreviewContent: React.FC<ApresentacaoPreviewProps> = ({
  slides, currentSlide, onSlideChange, onClose, numeroSemana1, numeroSemana2, visibleSections, onToggleSection, onStartPresentation, mediaSlides, onUpdateMediaSlide, onAddMediaSlide, onDeleteMediaSlide, onSaveClick, onManageClick, onExportExcel
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const captureContainerRef = useRef<HTMLDivElement>(null);
  const pendingMediaSlideKeyRef = useRef<string | null>(null);
  const { selectedElementId, setSelectedElementId } = usePresentationEditor();

  const { orderedSlides, handleNext, handlePrev, isGenerating, generatingProgress, capturingIndex, generatePDF } = usePreviewController({ slides, currentSlide, onSlideChange, numeroSemana1, numeroSemana2, contentRef, captureContainerRef });

  const activeSlideKey = orderedSlides[currentSlide]?.key;
  const activeMediaSlide = activeSlideKey && activeSlideKey.startsWith('media-') && mediaSlides ? mediaSlides.find(m => `media-${m.id}` === activeSlideKey) : null;

  const { handleUpdateElement, handleAddText, handleAddImage, handleDeleteSelection } = useMediaActions({ activeMediaSlide, onUpdateMediaSlide: onUpdateMediaSlide as any, selectedElementId, setSelectedElementId });

  const handleAddMediaSlideAndSelect = useCallback(() => {
    if (!onAddMediaSlide) return;
    const createdId = onAddMediaSlide();
    if (createdId) {
      pendingMediaSlideKeyRef.current = `media-${createdId}`;
      setSelectedElementId(null);
    }
  }, [onAddMediaSlide, setSelectedElementId]);

  useEffect(() => {
    const pendingKey = pendingMediaSlideKeyRef.current;
    if (!pendingKey) return;

    const nextIndex = orderedSlides.findIndex((slide) => slide.key === pendingKey);
    if (nextIndex >= 0) {
      pendingMediaSlideKeyRef.current = null;
      onSlideChange(nextIndex);
    }
  }, [orderedSlides, onSlideChange]);

  useEffect(() => {
    if (orderedSlides.length === 0 || currentSlide < orderedSlides.length) return;
    onSlideChange(Math.max(0, orderedSlides.length - 1));
    setSelectedElementId(null);
  }, [currentSlide, orderedSlides.length, onSlideChange, setSelectedElementId]);

  return (
    <>
      <style>{`
        .slide * { font-family: Inter, Arial, sans-serif !important; box-sizing: border-box !important; }
        .slide-for-capture { font-family: Inter, Arial, sans-serif !important; }
      `}</style>
      <PresentationCaptureLayer ref={captureContainerRef} slides={orderedSlides} capturingIndex={capturingIndex} />
      <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-slate-950/82 p-1.5 backdrop-blur-md animate-in fade-in duration-200 sm:p-3">
        <Card className="flex h-[98dvh] w-full max-w-[99vw] min-w-0 flex-col overflow-hidden rounded-2xl border-slate-200 bg-slate-100 shadow-2xl dark:border-slate-800 dark:bg-black md:h-[97vh] md:max-w-[98vw] md:flex-row">
          <SlideSidebar
            slides={slides} currentSlideIndex={currentSlide} onSlideSelect={onSlideChange}
            mediaSlides={mediaSlides || []} onUpdateMediaSlide={onUpdateMediaSlide} onAddMediaSlide={handleAddMediaSlideAndSelect} onDeleteMediaSlide={onDeleteMediaSlide}
          />
          <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white dark:bg-slate-950">
            <ApresentacaoControls
              currentSlide={currentSlide} totalSlides={orderedSlides.length}
              onPrev={handlePrev} onNext={handleNext} onClose={onClose}
              onGeneratePDF={generatePDF} onStartPresentation={() => onStartPresentation(orderedSlides)}
              isGenerating={isGenerating} visibleSections={visibleSections} onToggleSection={onToggleSection}
              onSaveClick={onSaveClick} onManageClick={onManageClick}
              onExportExcel={onExportExcel}
            />
            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">
              <PresentationViewport
                slides={orderedSlides}
                currentSlide={currentSlide}
                onNext={handleNext}
                onPrev={handlePrev}
              />
              {activeMediaSlide && onUpdateMediaSlide && (
                <MediaToolbar
                  hasSelection={!!selectedElementId}
                  selectedElement={activeMediaSlide.elements?.find(e => e.id === selectedElementId)}
                  onUpdateElement={handleUpdateElement}
                  onAddText={handleAddText}
                  onAddImage={handleAddImage}
                  onDeleteSelection={handleDeleteSelection}
                  slideBackground={activeMediaSlide.backgroundColor || '#ffffff'}
                  onUpdateSlideBackground={(color) => onUpdateMediaSlide(activeMediaSlide.id, { backgroundColor: color })}
                />
              )}
            </div>
          </div>
        </Card>
      </div>
      <ApresentacaoLoadingOverlay isGenerating={isGenerating} current={generatingProgress.current} total={generatingProgress.total} />
    </>
  );
};

export const ApresentacaoPreview: React.FC<ApresentacaoPreviewProps> = (props) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);
  const initialOrder = useMemo(() => props.slides.map(s => s.key), [props.slides]);
  if (!mounted) return null;
  return createPortal(<ApresentacaoPreviewContent {...props} />, document.body);
};
