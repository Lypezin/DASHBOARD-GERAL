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



    return (
        <div className="fixed inset-0 bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-xl z-[9999] overflow-y-auto overflow-x-hidden">
            {/* Floating Header */}
            <div className="fixed top-0 left-0 right-0 z-[10000] p-4 flex justify-between items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-800 transition-all duration-300 hover:opacity-100 opacity-0 hover:translate-y-0 -translate-y-2 pointer-events-none hover:pointer-events-auto group-hover:opacity-100 group">
                <div className="flex items-center gap-4">
                    {/* Trigger area to show header */}
                    <div className="absolute top-0 left-0 right-0 h-6 -translate-y-full group-hover:translate-y-0 pointer-events-auto" />
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
            <div className="min-h-screen py-10 flex flex-col items-center w-full">
                <div
                    ref={containerRef}
                    className="flex flex-col items-center w-full max-w-[1920px] px-4 md:px-8 lg:px-12 transition-all duration-200 ease-out"
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
