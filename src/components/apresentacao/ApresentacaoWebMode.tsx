import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SLIDE_WIDTH } from './constants';
import { PresentationInteractionLayer, ToolType } from './components/PresentationInteractionLayer';
import { MousePointer2, Pen, Eraser, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface ApresentacaoWebModeProps {
    slides: Array<{ key: string; render: (visible: boolean) => React.ReactNode }>;
    onClose: () => void;
}

export const ApresentacaoWebMode: React.FC<ApresentacaoWebModeProps> = ({
    slides,
    onClose,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [tool, setTool] = useState<ToolType>('laser');

    useEffect(() => {
        setMounted(true);
        // Lock body scroll
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

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


    if (!mounted) return null;

    return createPortal(
        <>
            {/* Interaction Layer - Fixed at viewport level, outside scroll container to avoid context trapping */}
            <PresentationInteractionLayer tool={tool} isActive={true} />

            {/* Global Cursor Override Style */}
            <style>{`
                .presentation-mode-container, .presentation-mode-container * {
                    cursor: none !important;
                }
                .presentation-toolbar, .presentation-toolbar * {
                    cursor: auto !important;
                }
            `}</style>

            {/* Toolbar & Trigger - GLOBAL SIBLING - Z-Index 100006 to sit above Interaction Layer (100000) and Scroll Container (99999) */}

            {/* Floating Header */}
            <div className={`fixed top-0 left-0 right-0 z-[100006] p-4 flex justify-between items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-800 transition-all duration-300 hover:opacity-100 opacity-0 hover:translate-y-0 -translate-y-2 pointer-events-none hover:pointer-events-auto group-hover:opacity-100 group presentation-toolbar`}>
                <div className="flex items-center gap-4">
                    {/* Trigger area to show header */}
                    <div className="absolute top-0 left-0 right-0 h-6 -translate-y-full group-hover:translate-y-0 pointer-events-auto" />
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Modo Apresentação</span>
                </div>

                {/* Tools Toolbar */}
                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border pointer-events-auto">
                    {/* Default tool is now LASER. Clicking Pen/Eraser toggles them. If they are off, we are in Laser mode. */}

                    <button
                        onClick={() => setTool(current => current === 'pen' ? 'laser' : 'pen')}
                        className={`p-2 rounded-md transition-colors ${tool === 'pen' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:bg-white/50'}`}
                        title="Caneta"
                    >
                        <Pen size={18} />
                    </button>
                    <button
                        onClick={() => setTool(current => current === 'eraser' ? 'laser' : 'eraser')}
                        className={`p-2 rounded-md transition-colors ${tool === 'eraser' ? 'bg-white shadow text-slate-600' : 'text-slate-500 hover:bg-white/50'}`}
                        title="Limpar Tela"
                    >
                        <Eraser size={18} />
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm uppercase tracking-wide pointer-events-auto"
                >
                    Sair (Esc)
                </button>
            </div>

            {/* Trigger zone for header - Boosted Z-Index to 100005 to sit ABOVE the canvas (100000) */}
            <div className="fixed top-0 left-0 right-0 h-3 z-[100005] hover:opacity-100 group">
                {/* Visual Hint Pill */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-200/50 hover:bg-slate-200 backdrop-blur-sm rounded-b-lg px-6 py-1 cursor-pointer transition-all duration-300 opacity-50 hover:opacity-100 group-hover:opacity-0 animate-pulse hover:animate-none">
                    <div className="w-8 h-1 bg-slate-400 rounded-full" />
                </div>
            </div>

            <div className={`presentation-mode-container fixed inset-0 bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-xl z-[99999] overflow-y-auto overflow-x-hidden`}>

                {/* Main Content */}
                <div className="min-h-screen py-10 flex flex-col items-center w-full">
                    <div
                        ref={containerRef}
                        className="flex flex-col items-center w-full max-w-[1920px] px-4 md:px-8 lg:px-12 transition-all duration-200 ease-out"
                    >
                        <AnimatePresence mode="popLayout" initial={false}>
                            {slides.map((slide, index) => (
                                <motion.div
                                    key={slide.key}
                                    initial={{ opacity: 0, x: 100, scale: 0.95 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: -100, scale: 0.95 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 30,
                                        duration: 0.5
                                    }}
                                    className="w-full flex justify-center"
                                >
                                    {slide.render(true)}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer Instructions */}
                <div className="fixed bottom-6 right-6 z-[99995] pointer-events-none opacity-50 mix-blend-difference text-white text-xs font-mono">
                    Pressione ESC para sair
                </div>
            </div>
        </>,
        document.body
    );
};
