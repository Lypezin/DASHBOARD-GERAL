import React, { useRef, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '@/components/ui/card';
import { ApresentacaoControls } from './components/ApresentacaoControls';
import { ApresentacaoLoadingOverlay } from './components/ApresentacaoLoadingOverlay';
import { PresentationViewport } from './components/PresentationViewport';
import { PresentationCaptureLayer } from './components/PresentationCaptureLayer';
import { SlideSidebar } from './slides/components/SlideSidebar';
import { MediaToolbar } from './components/MediaToolbar';
import { MediaSlideData } from '@/types/presentation';
import { PresentationEditorProvider, usePresentationEditor } from './context/PresentationEditorContext';
import { usePreviewController } from './hooks/usePreviewController';
import { useMediaActions } from './hooks/useMediaActions';

interface ApresentacaoPreviewProps {
  slides: Array<{ key: string; render: (visible: boolean) => React.ReactNode }>;
  currentSlide: number; onSlideChange: (index: number) => void; onNext: () => void; onPrev: () => void; onClose: () => void;
  numeroSemana1: string; numeroSemana2: string; visibleSections: Record<string, boolean>; onToggleSection: (section: string) => void;
  onStartPresentation: (orderedSlides: Array<{ key: string; render: (visible: boolean) => React.ReactNode }>) => void;
  mediaSlides?: MediaSlideData[]; onUpdateMediaSlide?: (id: string, updates: Partial<MediaSlideData>) => void;
  onAddMediaSlide?: () => void; onDeleteMediaSlide?: (id: string) => void; onManageMedia?: () => void;
  onSaveClick?: () => void; onManageClick?: () => void;
}

const ApresentacaoPreviewContent: React.FC<ApresentacaoPreviewProps> = ({
  slides, currentSlide, onSlideChange, onClose, numeroSemana1, numeroSemana2, visibleSections, onToggleSection, onStartPresentation, mediaSlides, onUpdateMediaSlide, onAddMediaSlide, onDeleteMediaSlide, onSaveClick, onManageClick
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const captureContainerRef = useRef<HTMLDivElement>(null);
  const { selectedElementId, setSelectedElementId } = usePresentationEditor();

  const { orderedSlides, handleNext, handlePrev, isGenerating, generatingProgress, capturingIndex, generatePDF } = usePreviewController({ slides, currentSlide, onSlideChange, numeroSemana1, numeroSemana2, contentRef, captureContainerRef });

  const activeSlideKey = orderedSlides[currentSlide]?.key;
  const activeMediaSlide = activeSlideKey && activeSlideKey.startsWith('media-') && mediaSlides ? mediaSlides.find(m => `media-${m.id}` === activeSlideKey) : null;

  const { handleUpdateElement, handleAddText, handleAddImage, handleDeleteSelection } = useMediaActions({ activeMediaSlide, onUpdateMediaSlide: onUpdateMediaSlide as any, selectedElementId, setSelectedElementId });

  return (
    <>
      <style>{`
        .slide * { font-family: Inter, Arial, sans-serif !important; box-sizing: border-box !important; }
        .slide-for-capture { font-family: Inter, Arial, sans-serif !important; }
      `}</style>
      <PresentationCaptureLayer ref={captureContainerRef} slides={orderedSlides} capturingIndex={capturingIndex} />
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 animate-in fade-in duration-200">
        <Card className="w-full max-w-[95vw] h-[95vh] flex overflow-hidden border-slate-200 dark:border-slate-800 shadow-2xl bg-slate-100 dark:bg-black">
          <SlideSidebar
            slides={slides} currentSlideIndex={currentSlide} onSlideSelect={onSlideChange}
            mediaSlides={mediaSlides || []} onUpdateMediaSlide={onUpdateMediaSlide} onAddMediaSlide={onAddMediaSlide} onDeleteMediaSlide={onDeleteMediaSlide}
          />
          <div className="flex-1 flex flex-col h-full min-w-0 bg-white relative">
            <ApresentacaoControls
              currentSlide={currentSlide} totalSlides={orderedSlides.length}
              onPrev={handlePrev} onNext={handleNext} onClose={onClose}
              onGeneratePDF={generatePDF} onStartPresentation={() => onStartPresentation(orderedSlides)}
              isGenerating={isGenerating} visibleSections={visibleSections} onToggleSection={onToggleSection}
              onSaveClick={onSaveClick} onManageClick={onManageClick}
            />
            <div className="flex-1 overflow-hidden relative bg-slate-100/50 flex flex-col">
              <PresentationViewport slides={orderedSlides} currentSlide={currentSlide} />
              {activeMediaSlide && onUpdateMediaSlide && (
                <MediaToolbar
                  hasSelection={!!selectedElementId}
                  selectedElement={activeMediaSlide.elements?.find(e => e.id === selectedElementId)}
                  onUpdateElement={handleUpdateElement}
                  onAddText={handleAddText}
                  onAddImage={handleAddImage}
                  onDeleteSelection={handleDeleteSelection}
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
