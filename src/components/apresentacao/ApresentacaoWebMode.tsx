import React, { useEffect, useRef } from 'react';
import { SLIDE_WIDTH } from './constants';

interface ApresentacaoWebModeProps {
    slides: Array<{ key: string; render: (visible: boolean) => React.ReactNode }>;
    onClose: () => void;
}

export const ApresentacaoWebMode: React.FC<ApresentacaoWebModeProps> = ({
    slides,
    onClose,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Esc to exit
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Handle scaling for smaller screens
    useEffect(() => {
        const handleResize = () => {
            if (!containerRef.current) return;
            const container = containerRef.current;
            const windowWidth = window.innerWidth;
            const padding = 40; // 20px on each side
            const availableWidth = windowWidth - padding;

            // Calculate scale if viewport is smaller than slide width
            if (availableWidth < SLIDE_WIDTH) {
                const scale = availableWidth / SLIDE_WIDTH;
                container.style.transform = `scale(${scale})`;
                container.style.transformOrigin = 'top center';
                // Adjust container height to compensate for scale
                // This is tricky for a scrollable container, but for the inner wrapper it works
            } else {
                container.style.transform = 'none';
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="fixed inset-0 bg-slate-100 dark:bg-slate-950 z-[60] overflow-y-auto overflow-x-hidden">
            {/* Floating Header */}
            <div className="fixed top-0 left-0 right-0 z-[70] p-4 flex justify-between items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm border-b border-slate-200 dark:border-slate-800 transition-all duration-300 hover:opacity-100 opacity-0 hover:translate-y-0 -translate-y-2 pointer-events-none hover:pointer-events-auto group-hover:opacity-100 group">
                <div className="flex items-center gap-4">
                    {/* Trigger area to show header */}
                    <div className="absolute top-0 left-0 right-0 h-4 md:h-2 -translate-y-full group-hover:translate-y-0 pointer-events-auto" />
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Modo Apresentação</span>
                </div>

                <button
                    onClick={onClose}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm uppercase tracking-wide pointer-events-auto"
                >
                    Sair (Esc)
                </button>
            </div>

            {/* Trigger zone for header */}
            <div className="fixed top-0 left-0 right-0 h-4 z-[65] hover:opacity-0" />

            {/* Main Content */}
            <div className="min-h-screen py-10 flex flex-col items-center">
                <div
                    ref={containerRef}
                    style={{ width: SLIDE_WIDTH }}
                    className="flex flex-col items-center transition-transform duration-200 ease-out"
                >
                    {slides.map((slide) => (
                        <React.Fragment key={slide.key}>
                            {slide.render(true)}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Footer Instructions */}
            <div className="fixed bottom-6 right-6 z-[60] pointer-events-none opacity-50 mix-blend-difference text-white text-xs font-mono">
                Pressione ESC para sair
            </div>
        </div>
    );
};
