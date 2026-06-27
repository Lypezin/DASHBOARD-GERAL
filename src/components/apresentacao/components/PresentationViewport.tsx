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
    
    // Direction tracking for slides transition
    const [prevSlideIndex, setPrevSlideIndex] = useState(currentSlide);
    const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

    useEffect(() => {
        if (currentSlide > prevSlideIndex) {
            setDirection('forward');
        } else if (currentSlide < prevSlideIndex) {
            setDirection('backward');
        }
        setPrevSlideIndex(currentSlide);
    }, [currentSlide, prevSlideIndex]);

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

    const slideVariants = {
        enter: (dir: 'forward' | 'backward') => ({
            opacity: 0,
            x: dir === 'forward' ? 120 : -120,
            scale: 0.98,
        }),
        center: {
            opacity: 1,
            x: 0,
            scale: 1,
        },
        exit: (dir: 'forward' | 'backward') => ({
            opacity: 0,
            x: dir === 'forward' ? -120 : 120,
            scale: 0.98,
        }),
    };

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
                <AnimatePresence mode="wait" custom={direction} initial={false}>
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
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: 'spring', stiffness: 350, damping: 32 },
                                opacity: { duration: 0.2 },
                                scale: { duration: 0.2 }
                            }}
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
