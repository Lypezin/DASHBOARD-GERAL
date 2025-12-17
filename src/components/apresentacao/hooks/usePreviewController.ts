import { useEffect, useMemo, RefObject } from 'react';
import { usePresentationEditor } from '../context/PresentationEditorContext';
import { usePresentationPDF } from './usePresentationPDF';

interface UsePreviewControllerProps {
    slides: Array<{ key: string; render: (visible: boolean) => React.ReactNode }>;
    currentSlide: number;
    onSlideChange: (index: number) => void;
    numeroSemana1: string;
    numeroSemana2: string;
    contentRef: RefObject<HTMLDivElement>;
    captureContainerRef: RefObject<HTMLDivElement>;
}

export function usePreviewController({
    slides,
    currentSlide,
    onSlideChange,
    numeroSemana1,
    numeroSemana2,
    contentRef,
    captureContainerRef
}: UsePreviewControllerProps) {
    const { slideOrder, setSlideOrder } = usePresentationEditor();

    // Initialize order
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

    const handleNext = () => {
        if (currentSlide < orderedSlides.length - 1) onSlideChange(currentSlide + 1);
    };

    const handlePrev = () => {
        if (currentSlide > 0) onSlideChange(currentSlide - 1);
    };

    const pdfState = usePresentationPDF({
        slides: orderedSlides,
        numeroSemana1,
        numeroSemana2,
        contentRef,
        captureContainerRef
    });

    return {
        orderedSlides,
        handleNext,
        handlePrev,
        ...pdfState
    };
}
