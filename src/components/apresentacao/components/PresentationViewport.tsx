import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SLIDE_HEIGHT, SLIDE_WIDTH, slideDimensionsStyle } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

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
    const activeSlide = slides[currentSlide] || null;

    const calculateScale = useCallback(() => {
        if (containerRef.current) {
            const container = containerRef.current.getBoundingClientRect();
            const availableWidth = container.width;
            const availableHeight = container.height;

            if (availableWidth === 0 || availableHeight === 0) return;

            const scaleX = availableWidth / SLIDE_WIDTH;
            const scaleY = availableHeight / SLIDE_HEIGHT;

            // Use 0.95 factor to leave a small margin for shadow
            const newScale = Math.min(scaleX, scaleY) * 0.95;
            setScale(Math.max(0.1, Math.min(1.2, newScale)));
        }
    }, []);

    useEffect(() => {
        calculateScale();

        const observer = typeof ResizeObserver !== 'undefined' && containerRef.current
            ? new ResizeObserver(() => calculateScale())
            : null;

        if (observer && containerRef.current) {
            observer.observe(containerRef.current);
        }

        window.addEventListener('resize', calculateScale);

        return () => {
            observer?.disconnect();
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
                    overflow: 'hidden',
                }}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {totalSlides === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="slide bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 absolute inset-0 flex items-center justify-center text-xl font-medium border border-slate-200 dark:border-slate-800 rounded-lg"
                            style={slideDimensionsStyle}
                        >
                            Nenhum dado disponível para visualização.
                        </motion.div>
                    ) : activeSlide ? (
                        <motion.div
                            key={activeSlide.key}
                            initial={{ opacity: 0, x: 24, scale: 0.98 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -24, scale: 0.98 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            style={{
                                ...slideDimensionsStyle,
                                position: 'absolute',
                                top: 0,
                                left: 0,
                            }}
                        >
                            {activeSlide.render(true)}
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>
        </div>
    );
};
