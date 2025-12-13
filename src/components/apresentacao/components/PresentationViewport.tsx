import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SLIDE_HEIGHT, SLIDE_WIDTH, slideDimensionsStyle } from '../constants';

interface PresentationViewportProps {
    slides: Array<{ key: string; render: (visible: boolean) => React.ReactNode }>;
    currentSlide: number;
}

export const PresentationViewport: React.FC<PresentationViewportProps> = ({
    slides,
    currentSlide
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.5);

    const calculateScale = useCallback(() => {
        if (containerRef.current) {
            const container = containerRef.current.getBoundingClientRect();
            // Use full available space
            const availableWidth = container.width;
            const availableHeight = container.height;

            const scaleX = availableWidth / SLIDE_WIDTH;
            const scaleY = availableHeight / SLIDE_HEIGHT;

            // Use entire space (1.0 factor instead of 0.95) for better visibility
            // The container has padding handling the margins
            const newScale = Math.min(scaleX, scaleY);
            setScale(Math.max(0.1, Math.min(1.5, newScale))); // Allow slight upsizing if needed, but keeping generally bounded
        }
    }, []);

    useEffect(() => {
        calculateScale();
        // Small delay to ensure layout is settled
        const timeoutId = setTimeout(calculateScale, 100);
        window.addEventListener('resize', calculateScale);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', calculateScale);
        };
    }, [calculateScale]);

    const totalSlides = slides.length;

    return (
        <div
            ref={containerRef}
            className="bg-slate-100 dark:bg-slate-950 flex-1 overflow-hidden p-4 relative"
        >
            <div
                className="relative shadow-2xl transition-transform duration-200 ease-out"
                style={{
                    ...slideDimensionsStyle,
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    transformOrigin: 'center center',
                    fontFamily: 'Inter, Arial, sans-serif',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                    textRendering: 'optimizeLegibility',
                }}
            >
                {totalSlides === 0 ? (
                    <div
                        className="slide bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 absolute inset-0 flex items-center justify-center text-xl font-medium border border-slate-200 dark:border-slate-800 rounded-lg"
                        style={slideDimensionsStyle}
                    >
                        Nenhum dado disponível para visualização.
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
    );
};
