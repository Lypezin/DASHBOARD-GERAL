import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { SLIDE_HEIGHT, SLIDE_WIDTH, slideDimensionsStyle } from '../constants';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface PresentationViewportProps {
    slides: Array<{ key: string; render: (visible: boolean) => React.ReactNode }>;
    currentSlide: number;
    onNext?: () => void;
    onPrev?: () => void;
}

export const PresentationViewport: React.FC<PresentationViewportProps> = React.memo(({
    slides,
    currentSlide,
    onNext,
    onPrev,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.5);
    const activeSlide = slides[currentSlide] || null;
    const lastScrollTimeRef = useRef(0);
    const previousSlideRef = useRef(currentSlide);
    const animationFrameRef = useRef<number | null>(null);
    const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
    const [isCompactViewport, setIsCompactViewport] = useState(false);
    const shouldReduceMotion = useReducedMotion();

    const renderedSlide = useMemo(() => {
        if (!activeSlide) return null;
        return activeSlide.render(true);
    }, [activeSlide]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            const currentTime = Date.now();
            if (currentTime - lastScrollTimeRef.current < 700) return;

            if (Math.abs(e.deltaY) > 20) {
                if (e.deltaY > 0) {
                    if (onNext) {
                        onNext();
                        lastScrollTimeRef.current = currentTime;
                    }
                } else {
                    if (onPrev) {
                        onPrev();
                        lastScrollTimeRef.current = currentTime;
                    }
                }
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: true });
        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [onNext, onPrev]);
    
    useEffect(() => {
        if (currentSlide === previousSlideRef.current) return;
        setDirection(currentSlide > previousSlideRef.current ? 'forward' : 'backward');
        previousSlideRef.current = currentSlide;
    }, [currentSlide]);

    const calculateScale = useCallback(() => {
        if (containerRef.current) {
            const container = containerRef.current.getBoundingClientRect();
            const availableWidth = container.width;
            const availableHeight = container.height;

            if (availableWidth === 0 || availableHeight === 0) return;
            const nextIsCompactViewport = availableWidth < 640;
            setIsCompactViewport((current) => current === nextIsCompactViewport ? current : nextIsCompactViewport);

            const scaleX = availableWidth / SLIDE_WIDTH;
            const scaleY = availableHeight / SLIDE_HEIGHT;

            const newScale = Math.min(scaleX, scaleY) * 0.98;
            const nextScale = Math.max(0.1, Math.min(1.2, newScale));
            setScale((currentScale) => Math.abs(currentScale - nextScale) < 0.005 ? currentScale : nextScale);
        }
    }, []);

    const scheduleScaleCalculation = useCallback(() => {
        if (animationFrameRef.current !== null) return;

        animationFrameRef.current = window.requestAnimationFrame(() => {
            animationFrameRef.current = null;
            calculateScale();
        });
    }, [calculateScale]);

    useEffect(() => {
        calculateScale();

        const observer = typeof ResizeObserver !== 'undefined' && containerRef.current
            ? new ResizeObserver(() => scheduleScaleCalculation())
            : null;

        if (observer && containerRef.current) {
            observer.observe(containerRef.current);
        }

        window.addEventListener('resize', calculateScale);

        return () => {
            if (animationFrameRef.current !== null) {
                window.cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            observer?.disconnect();
            window.removeEventListener('resize', calculateScale);
        };
    }, [calculateScale, scheduleScaleCalculation]);

    // Recalculate when slide changes
    useEffect(() => {
        calculateScale();
    }, [currentSlide, calculateScale]);

    const totalSlides = slides.length;

    const slideVariants = {
        enter: (dir: 'forward' | 'backward') => ({
            opacity: 0,
            x: shouldReduceMotion ? 0 : dir === 'forward' ? 72 : -72,
            scale: shouldReduceMotion ? 1 : 0.985,
        }),
        center: {
            opacity: 1,
            x: 0,
            scale: 1,
        },
        exit: (dir: 'forward' | 'backward') => ({
            opacity: 0,
            x: shouldReduceMotion ? 0 : dir === 'forward' ? -72 : 72,
            scale: shouldReduceMotion ? 1 : 0.985,
        }),
    };

    return (
        <div
            ref={containerRef}
            className="bg-slate-100 dark:bg-slate-950 flex-1 w-full h-full overflow-hidden relative flex items-start justify-center p-2 pt-4 sm:items-center sm:p-3"
        >
            <div
                className="relative shadow-2xl transition-transform duration-200 ease-out will-change-transform"
                style={{
                    ...slideDimensionsStyle,
                    position: 'absolute',
                    top: isCompactViewport ? 0 : '50%',
                    left: '50%',
                    transform: `translate(-50%, ${isCompactViewport ? '0' : '-50%'}) scale(${scale})`,
                    transformOrigin: isCompactViewport ? 'top center' : 'center center',
                    fontFamily: 'Inter, Arial, sans-serif',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                    textRendering: 'optimizeLegibility',
                    overflow: 'hidden',
                }}
            >
                <AnimatePresence custom={direction} initial={false}>
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
                                x: shouldReduceMotion ? { duration: 0.01 } : { type: 'spring', stiffness: 280, damping: 34, mass: 0.75 },
                                opacity: { duration: shouldReduceMotion ? 0.01 : 0.16 },
                                scale: { duration: shouldReduceMotion ? 0.01 : 0.16 }
                            }}
                            style={{
                                ...slideDimensionsStyle,
                                position: 'absolute',
                                top: 0,
                                left: 0,
                            }}
                        >
                            {renderedSlide}
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>
        </div>
    );
});

PresentationViewport.displayName = 'PresentationViewport';
