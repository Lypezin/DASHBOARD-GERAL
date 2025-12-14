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
            const availableWidth = container.width;
            const availableHeight = container.height;

            if (availableWidth === 0 || availableHeight === 0) {
                console.log('[PresentationViewport] Container has 0 size!', { availableWidth, availableHeight });
                return;
            }

            console.log('[PresentationViewport] Container Size:', { availableWidth, availableHeight });

            const scaleX = availableWidth / SLIDE_WIDTH;
            const scaleY = availableHeight / SLIDE_HEIGHT;

            // Use 0.95 factor to leave a small margin for shadow
            const newScale = Math.min(scaleX, scaleY) * 0.95;
            setScale(Math.max(0.1, Math.min(1.2, newScale)));
        }
    }, []);

    useEffect(() => {
        // Initial calculation with delays to ensure DOM is ready
        calculateScale();
        const t1 = setTimeout(calculateScale, 50);
        const t2 = setTimeout(calculateScale, 150);
        const t3 = setTimeout(calculateScale, 300);
        window.addEventListener('resize', calculateScale);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            window.removeEventListener('resize', calculateScale);
        };
    }, [calculateScale]);

    // Recalculate when slide changes
    useEffect(() => {
        calculateScale();
    }, [currentSlide, calculateScale]);

    const totalSlides = slides.length;

    return (
        <div
            ref={containerRef}
            className="bg-slate-100 dark:bg-slate-950 flex-1 w-full h-full overflow-hidden relative flex items-center justify-center"
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
                    backgroundColor: 'pink', // DEBUG: Visible background for container
                }}
            >
                {/* DEBUG: Raw Test Element */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: 200, height: 100, background: 'red', zIndex: 99999, color: 'white', fontSize: 20, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    VIEWPORT WORKING
                </div>
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
