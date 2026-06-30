import { useCallback, useMemo, RefObject } from 'react';
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
    const { slideOrder } = usePresentationEditor();

    const orderedSlides = useMemo(() => {
        const slideMap = new Map(slides.map((slide) => [slide.key, slide]));
        const orderedKeys = new Set<string>();
        const ordered: typeof slides = [];

        slideOrder.forEach((key) => {
            const slide = slideMap.get(key);
            if (slide) {
                ordered.push(slide);
                orderedKeys.add(key);
            }
        });

        slides.forEach((slide) => {
            if (!orderedKeys.has(slide.key)) ordered.push(slide);
        });

        return ordered;
    }, [slides, slideOrder]);

    const handleNext = useCallback(() => {
        if (currentSlide < orderedSlides.length - 1) onSlideChange(currentSlide + 1);
    }, [currentSlide, onSlideChange, orderedSlides.length]);

    const handlePrev = useCallback(() => {
        if (currentSlide > 0) onSlideChange(currentSlide - 1);
    }, [currentSlide, onSlideChange]);

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
