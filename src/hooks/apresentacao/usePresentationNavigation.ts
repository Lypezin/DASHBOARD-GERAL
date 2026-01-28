import { useEffect, useCallback } from 'react';

export const usePresentationNavigation = (
    slides: any[],
    setCurrentSlide: (value: React.SetStateAction<number>) => void
) => {

    useEffect(() => {
        setCurrentSlide((prev) => {
            if (slides.length === 0) return 0;
            return Math.min(prev, slides.length - 1);
        });
    }, [slides.length, setCurrentSlide]);

    const goToNextSlide = useCallback(() => {
        setCurrentSlide((prev) => {
            if (slides.length === 0) return 0;
            return Math.min(prev + 1, slides.length - 1);
        });
    }, [slides.length, setCurrentSlide]);

    const goToPrevSlide = useCallback(() => {
        setCurrentSlide((prev) => {
            if (slides.length === 0) return 0;
            return Math.max(prev - 1, 0);
        });
    }, [slides.length, setCurrentSlide]);

    return { goToNextSlide, goToPrevSlide };
};
