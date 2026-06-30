
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PresentationInteractionLayer, ToolType } from './components/PresentationInteractionLayer';
import { PresentationViewport } from './components/PresentationViewport';
import { ChevronLeft, ChevronRight, MousePointer, Sparkles, Pen, Eraser, X } from 'lucide-react';

interface ApresentacaoWebModeProps {
    slides: Array<{ key: string; render: (visible: boolean) => React.ReactNode }>;
    currentSlide: number;
    onSlideChange: (index: number) => void;
    onNext: () => void;
    onPrev: () => void;
    onClose: () => void;
}

export const ApresentacaoWebMode: React.FC<ApresentacaoWebModeProps> = ({
    slides,
    currentSlide,
    onSlideChange,
    onNext,
    onPrev,
    onClose,
}) => {
    const [mounted, setMounted] = useState(false);
    const [tool, setTool] = useState<ToolType>('laser');

    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    // Keyboard events for slide navigation and tools
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
                e.preventDefault();
                onNext();
            } else if (e.key === 'ArrowLeft' || e.key === 'Backspace' || e.key === 'PageUp') {
                e.preventDefault();
                onPrev();
            } else if (e.key === '1') {
                setTool('laser');
            } else if (e.key === '2') {
                setTool('pen');
            } else if (e.key === '3') {
                setTool('eraser');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, onNext, onPrev]);

    if (!mounted) return null;

    const totalSlides = slides.length;
    const slideAtualExibicao = totalSlides > 0 ? currentSlide + 1 : 0;

    return createPortal(
        <div className="fixed inset-0 bg-slate-100 dark:bg-slate-950 z-[99999] overflow-hidden flex flex-col select-none">
            {/* Drawing/Laser interaction layer */}
            <PresentationInteractionLayer tool={tool} isActive={true} currentSlide={currentSlide} />

            <style>{`
                .presentation-mode-container, .presentation-mode-container * {
                    cursor: none !important;
                }
                .presentation-floating-bar, .presentation-floating-bar * {
                    cursor: auto !important;
                }
            `}</style>

            {/* Main scaled viewport for showing one slide at a time */}
            <div className="flex-1 w-full h-full presentation-mode-container">
                <PresentationViewport
                    slides={slides}
                    currentSlide={currentSlide}
                    onNext={onNext}
                    onPrev={onPrev}
                />
            </div>

            {/* Premium floating presentation controller on the left side vertically */}
            <div className="fixed bottom-4 left-1/2 z-[100006] flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/20 bg-white/82 px-3 py-2 shadow-[0_18px_44px_-20px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-all duration-300 dark:border-slate-800/40 dark:bg-slate-950/82 dark:shadow-[0_24px_50px_-16px_rgba(0,0,0,0.5)] sm:left-6 sm:top-1/2 sm:bottom-auto sm:-translate-x-0 sm:-translate-y-1/2 sm:flex-col sm:gap-3 sm:rounded-[24px] sm:px-3 sm:py-5 sm:opacity-35 sm:hover:scale-[1.03] sm:hover:opacity-100 sm:focus-within:opacity-100 sm:active:scale-[1.01] pointer-events-auto presentation-floating-bar">
                
                {/* Exit Button */}
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                    title="Sair da Apresentação (Esc)"
                >
                    <X size={16} />
                </button>

                <div className="hidden w-4 h-[1px] bg-slate-200 dark:bg-slate-800 sm:block" />

                {/* Navigation Buttons */}
                <button
                    onClick={onPrev}
                    disabled={currentSlide === 0 || totalSlides === 0}
                    className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="Slide Anterior (Seta Esquerda)"
                >
                    <ChevronLeft size={18} />
                </button>

                <span className="min-w-10 select-none py-1 text-center font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 sm:min-h-[1.5rem] sm:min-w-0">
                    <span className="sm:hidden">{slideAtualExibicao}/{totalSlides}</span>
                    <span className="hidden sm:inline">{slideAtualExibicao}<br/>/<br/>{totalSlides}</span>
                </span>

                <button
                    onClick={onNext}
                    disabled={totalSlides === 0 || currentSlide === totalSlides - 1}
                    className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="Próximo Slide (Seta Direita / Espaço)"
                >
                    <ChevronRight size={18} />
                </button>

                <div className="hidden w-4 h-[1px] bg-slate-200 dark:bg-slate-800 sm:block" />

                {/* Toolbar Tools */}
                <div className="flex items-center gap-1.5 sm:flex-col">
                    {/* Laser Tool */}
                    <button
                        onClick={() => setTool('laser')}
                        className={`p-1.5 rounded-full transition-all ${tool === 'laser' ? 'bg-red-500 text-white shadow-sm shadow-red-500/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        title="Apontador Laser (Atalho: 1)"
                    >
                        <Sparkles size={16} />
                    </button>

                    {/* Pen Tool */}
                    <button
                        onClick={() => setTool('pen')}
                        className={`p-1.5 rounded-full transition-all ${tool === 'pen' ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        title="Caneta de Desenho (Atalho: 2)"
                    >
                        <Pen size={16} />
                    </button>

                    {/* Clear Canvas Tool */}
                    <button
                        onClick={() => setTool('eraser')}
                        className={`p-1.5 rounded-full transition-all ${tool === 'eraser' ? 'bg-slate-700 text-white shadow-sm dark:bg-slate-300 dark:text-slate-900' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        title="Limpar Desenhos (Atalho: 3)"
                    >
                        <Eraser size={16} />
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
