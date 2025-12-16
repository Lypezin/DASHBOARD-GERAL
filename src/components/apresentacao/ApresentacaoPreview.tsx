
import React, { useRef, useState, useEffect, useMemo, createContext, useContext, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '@/components/ui/card';
import { ApresentacaoControls } from './components/ApresentacaoControls';
import { ApresentacaoLoadingOverlay } from './components/ApresentacaoLoadingOverlay';
import { PresentationViewport } from './components/PresentationViewport';
import { PresentationCaptureLayer } from './components/PresentationCaptureLayer';
import { usePresentationPDF } from './hooks/usePresentationPDF';
import { SlideSidebar } from './slides/components/SlideSidebar';
import { MediaToolbar } from './components/MediaToolbar';
import { MediaSlideData, SlideElement } from '@/types/presentation';

import {
  PresentationEditorProvider,
  usePresentationEditor
} from './context/PresentationEditorContext';

// ----------------------------------------------

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
  onStartPresentation: (orderedSlides: Array<{ key: string; render: (visible: boolean) => React.ReactNode }>) => void;

  // New props for Media Editing
  mediaSlides?: MediaSlideData[];
  onUpdateMediaSlide?: (id: string, updates: Partial<MediaSlideData>) => void;
  onAddMediaSlide?: () => void;
  onDeleteMediaSlide?: (id: string) => void;
  // Deprecated/Removed
  onManageMedia?: () => void;
}

const ApresentacaoPreviewContent: React.FC<ApresentacaoPreviewProps> = ({
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
  mediaSlides,
  onUpdateMediaSlide,
  onAddMediaSlide,
  onDeleteMediaSlide,
  onManageMedia
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const captureContainerRef = useRef<HTMLDivElement>(null);

  const { slideOrder, setSlideOrder, selectedElementId, setSelectedElementId } = usePresentationEditor();

  // Initialize order on mount if empty (or when slides change significantly)
  useEffect(() => {
    const currentKeys = slides.map(s => s.key);
    if (slideOrder.length === 0) {
      setSlideOrder(currentKeys);
    }
  }, [slides, setSlideOrder, slideOrder.length]);

  // Compute Ordered Slides
  const orderedSlides = useMemo(() => {
    const map = new Map(slides.map(s => [s.key, s]));
    const ordered = slideOrder
      .map(key => map.get(key))
      .filter((s): s is typeof slides[0] => !!s);

    slides.forEach(s => {
      if (!slideOrder.includes(s.key)) ordered.push(s);
    });

    return ordered;
  }, [slides, slideOrder]);

  // Override navigation to use ordered slides length
  const handleNext = () => {
    if (currentSlide < orderedSlides.length - 1) onSlideChange(currentSlide + 1);
  };
  const handlePrev = () => {
    if (currentSlide > 0) onSlideChange(currentSlide - 1);
  };

  const { isGenerating, generatingProgress, capturingIndex, generatePDF } = usePresentationPDF({
    slides: orderedSlides,
    numeroSemana1,
    numeroSemana2,
    contentRef,
    captureContainerRef
  });

  // Determine active media slide
  const activeSlideKey = orderedSlides[currentSlide]?.key;
  const activeMediaSlide = activeSlideKey && activeSlideKey.startsWith('media-') && mediaSlides
    ? mediaSlides.find(m => `media-${m.id}` === activeSlideKey)
    : null;

  return (
    <>
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

      {/* Capture Layer handles the ordered slides for PDF */}
      <PresentationCaptureLayer
        ref={captureContainerRef}
        slides={orderedSlides}
        capturingIndex={capturingIndex}
      />

      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 animate-in fade-in duration-200">
        <Card className="w-full max-w-[95vw] h-[95vh] flex overflow-hidden border-slate-200 dark:border-slate-800 shadow-2xl bg-slate-100 dark:bg-black">
          {/* Sidebar */}
          <SlideSidebar
            slides={slides}
            currentSlideIndex={currentSlide}
            onSlideSelect={onSlideChange}
            mediaSlides={mediaSlides || []}
            onUpdateMediaSlide={onUpdateMediaSlide}
            onAddMediaSlide={onAddMediaSlide}
            onDeleteMediaSlide={onDeleteMediaSlide}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-full min-w-0 bg-white relative">
            <ApresentacaoControls
              currentSlide={currentSlide}
              totalSlides={orderedSlides.length}
              onPrev={handlePrev}
              onNext={handleNext}
              onClose={onClose}
              onGeneratePDF={generatePDF}
              onStartPresentation={() => onStartPresentation(orderedSlides)}
              isGenerating={isGenerating}
              visibleSections={visibleSections}
              onToggleSection={onToggleSection}
            // onManageMedia={onManageMedia} // Hidden/Moved to side
            />

            <div className="flex-1 overflow-hidden relative bg-slate-100/50 flex flex-col">
              <PresentationViewport
                slides={orderedSlides}
                currentSlide={currentSlide}
              />

              {/* Media Toolbar Overlay */}
              {activeMediaSlide && onUpdateMediaSlide && (
                <MediaToolbar
                  hasSelection={!!selectedElementId}
                  selectedElement={activeMediaSlide.elements?.find(e => e.id === selectedElementId)}
                  onUpdateElement={(updates) => {
                    if (!selectedElementId) return;
                    const newElements = (activeMediaSlide.elements || []).map(el =>
                      el.id === selectedElementId ? { ...el, ...updates } : el
                    );
                    onUpdateMediaSlide(activeMediaSlide.id, { elements: newElements });
                  }}
                  onAddText={() => {
                    const newElement: SlideElement = {
                      id: Math.random().toString(36).substr(2, 9),
                      type: 'text',
                      content: 'Novo Texto',
                      position: { x: 0, y: 0 }
                    };
                    onUpdateMediaSlide(activeMediaSlide.id, {
                      elements: [...(activeMediaSlide.elements || []), newElement]
                    });
                  }}
                  onAddImage={(url) => {
                    const newElement: SlideElement = {
                      id: Math.random().toString(36).substr(2, 9),
                      type: 'image',
                      content: url,
                      position: { x: 0, y: 0 },
                      scale: 1,
                      width: 300 // default width
                    };
                    onUpdateMediaSlide(activeMediaSlide.id, {
                      elements: [...(activeMediaSlide.elements || []), newElement]
                    });
                  }}
                  onDeleteSelection={() => {
                    if (!selectedElementId) return;
                    const newElements = (activeMediaSlide.elements || []).filter(el => el.id !== selectedElementId);
                    onUpdateMediaSlide(activeMediaSlide.id, { elements: newElements });
                    setSelectedElementId(null);
                  }}
                />
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

export const ApresentacaoPreview: React.FC<ApresentacaoPreviewProps> = (props) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const initialOrder = useMemo(() => props.slides.map(s => s.key), [props.slides]);

  if (!mounted) return null;

  return createPortal(
    <PresentationEditorProvider initialOrder={initialOrder}>
      <ApresentacaoPreviewContent {...props} />
    </PresentationEditorProvider>,
    document.body
  );
};
