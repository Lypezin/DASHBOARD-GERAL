
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PresentationNavigationProps {
    currentSlide: number;
    totalSlides: number;
    onPrev: () => void;
    onNext: () => void;
}

export const PresentationNavigation: React.FC<PresentationNavigationProps> = ({
    currentSlide,
    totalSlides,
    onPrev,
    onNext,
}) => {
    const slideAtualExibicao = totalSlides > 0 ? currentSlide + 1 : 0;

    return (
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <Button
                variant="ghost"
                size="sm"
                onClick={onPrev}
                disabled={currentSlide === 0 || totalSlides === 0}
                className="h-8 w-8 p-0"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300 min-w-[3rem] text-center">
                {slideAtualExibicao} / {totalSlides}
            </span>
            <Button
                variant="ghost"
                size="sm"
                onClick={onNext}
                disabled={totalSlides === 0 || currentSlide === totalSlides - 1}
                className="h-8 w-8 p-0"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
};
