import React, { useRef, useState, useEffect, useMemo, createContext, useContext, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '@/components/ui/card';
import { ApresentacaoControls } from './components/ApresentacaoControls';
import { ApresentacaoLoadingOverlay } from './components/ApresentacaoLoadingOverlay';
import { PresentationViewport } from './components/PresentationViewport';
import { PresentationCaptureLayer } from './components/PresentationCaptureLayer';
import { usePresentationPDF } from './hooks/usePresentationPDF';
import { SlideSidebar } from './slides/components/SlideSidebar';

// --- Embedded Context to avoid Build Issues ---
interface SlideOverride {
  title?: string;
  subTitle?: string;
}

interface PresentationEditorContextType {
  slideOrder: string[];
  setSlideOrder: (order: string[]) => void;
  moveSlide: (dragIndex: number, hoverIndex: number) => void;
  overrides: Record<string, SlideOverride>;
  setOverride: (key: string, override: Partial<SlideOverride>) => void;
  isEditing: boolean;
  toggleEditing: () => void;
}

export const PresentationEditorContext = createContext<PresentationEditorContextType | undefined>(undefined);

export const PresentationEditorProvider: React.FC<{ children: ReactNode; initialOrder: string[] }> = ({
  children,
  initialOrder
}) => {
  const [slideOrder, setSlideOrder] = useState<string[]>(initialOrder);
  const [overrides, setOverrides] = useState<Record<string, SlideOverride>>({});
  const [isEditing, setIsEditing] = useState(false);

  const moveSlide = useCallback((dragIndex: number, hoverIndex: number) => {
    setSlideOrder((prevOrder) => {
      const newOrder = [...prevOrder];
      const [removed] = newOrder.splice(dragIndex, 1);
      newOrder.splice(hoverIndex, 0, removed);
      return newOrder;
    });
  }, []);

  const setOverride = useCallback((key: string, override: Partial<SlideOverride>) => {
    setOverrides(prev => ({
      ...prev,
      [key]: { ...prev[key], ...override }
    }));
  }, []);

  const toggleEditing = useCallback(() => {
    setIsEditing(prev => !prev);
  }, []);

  return (
    <PresentationEditorContext.Provider value={{
      slideOrder,
      setSlideOrder,
      moveSlide,
      overrides,
      setOverride,
      isEditing,
      toggleEditing
    }}>
      {children}
    </PresentationEditorContext.Provider>
  );
};

export const usePresentationEditor = () => {
  const context = useContext(PresentationEditorContext);
  if (!context) {
    throw new Error('usePresentationEditor must be used within a PresentationEditorProvider');
  }
  return context;
};
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
  onStartPresentation: () => void;
  onManageMedia?: () => void;
}

const ApresentacaoPreviewContent: React.FC<ApresentacaoPreviewProps> = ({
  slides,
  currentSlide,
  onSlideChange,
  onNext,
  onPrev, // We will override these to use local order
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

  const { slideOrder, setSlideOrder } = usePresentationEditor();

  // Initialize order on mount if empty (or when slides change significantly)
  useEffect(() => {
    // Only set if order is different length or empty. 
    // Ideally we want to persist order across re-renders but invoke simple init.
    // For now, simple logic: if slideOrder is smaller than slides, append.
    // We trust context to keep state.
    const currentKeys = slides.map(s => s.key);
    // If context is fresh (empty), set it.
    if (slideOrder.length === 0) {
      setSlideOrder(currentKeys);
    }
  }, [slides, setSlideOrder, slideOrder.length]);

  // Compute Ordered Slides
  const orderedSlides = useMemo(() => {
    // Create map
    const map = new Map(slides.map(s => [s.key, s]));
    // Map based on order
    const ordered = slideOrder
      .map(key => map.get(key))
      .filter((s): s is typeof slides[0] => !!s);

    // Add any missing
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
    slides: orderedSlides, // Use ordered slides for PDF
    numeroSemana1,
    numeroSemana2,
    contentRef,
    captureContainerRef
  });

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
            slides={slides} // Pass original to list available keys, logic inside handles order
            currentSlideIndex={currentSlide}
            onSlideSelect={onSlideChange}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-full min-w-0 bg-white">
            <ApresentacaoControls
              currentSlide={currentSlide}
              totalSlides={orderedSlides.length}
              onPrev={handlePrev}
              onNext={handleNext}
              onClose={onClose}
              onGeneratePDF={generatePDF}
              onStartPresentation={onStartPresentation}
              isGenerating={isGenerating}
              visibleSections={visibleSections}
              onToggleSection={onToggleSection}
              onManageMedia={onManageMedia}
            />

            <div className="flex-1 overflow-hidden relative bg-slate-100/50">
              <PresentationViewport
                slides={orderedSlides}
                currentSlide={currentSlide}
              />
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
  // Ensure portal rendering on client side
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Initial Order derived from props
  const initialOrder = useMemo(() => props.slides.map(s => s.key), [props.slides]);

  if (!mounted) return null;

  return createPortal(
    <PresentationEditorProvider initialOrder={initialOrder}>
      <ApresentacaoPreviewContent {...props} />
    </PresentationEditorProvider>,
    document.body
  );
};
