import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PresentationInteractionLayer, ToolType } from './components/PresentationInteractionLayer';
import { PresentationViewport } from './components/PresentationViewport';
import { ChevronLeft, ChevronRight, Sparkles, Pen, Eraser, X } from 'lucide-react';

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
        <div className="fixed inset-0 z-[99999] flex select-none flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">
            <PresentationInteractionLayer tool={tool} isActive={true} currentSlide={currentSlide} />

            <style>{`
                .presentation-mode-container, .presentation-mode-container * {
                    cursor: none !important;
                }
                .presentation-floating-bar, .presentation-floating-bar * {
                    cursor: auto !important;
                }
            `}</style>

            <div className="presentation-mode-container h-full w-full flex-1">
                <PresentationViewport
                    slides={slides}
                    currentSlide={currentSlide}
                    onNext={onNext}
                    onPrev={onPrev}
                />
            </div>

            <div className="presentation-floating-bar pointer-events-auto fixed bottom-4 left-1/2 z-[100006] flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/20 bg-white/82 px-3 py-2 shadow-[0_18px_44px_-20px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-all duration-300 dark:border-slate-800/40 dark:bg-slate-950/82 dark:shadow-[0_24px_50px_-16px_rgba(0,0,0,0.5)] sm:bottom-auto sm:left-6 sm:top-1/2 sm:-translate-x-0 sm:-translate-y-1/2 sm:flex-col sm:gap-3 sm:rounded-[24px] sm:px-3 sm:py-5 sm:opacity-35 sm:hover:scale-[1.03] sm:hover:opacity-100 sm:focus-within:opacity-100 sm:active:scale-[1.01]">
                <button
                    onClick={onClose}
                    className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-rose-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-rose-400"
                    title="Sair da apresentação (Esc)"
                >
                    <X size={16} />
                </button>

                <div className="hidden h-[1px] w-4 bg-slate-200 dark:bg-slate-800 sm:block" />

                <button
                    onClick={onPrev}
                    disabled={currentSlide === 0 || totalSlides === 0}
                    className="rounded-full p-1.5 text-slate-600 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800"
                    title="Slide anterior (Seta esquerda)"
                >
                    <ChevronLeft size={18} />
                </button>

                <span className="min-w-10 select-none py-1 text-center font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 sm:min-h-[1.5rem] sm:min-w-0">
                    <span className="sm:hidden">{slideAtualExibicao}/{totalSlides}</span>
                    <span className="hidden sm:inline">{slideAtualExibicao}<br />/<br />{totalSlides}</span>
                </span>

                <button
                    onClick={onNext}
                    disabled={totalSlides === 0 || currentSlide === totalSlides - 1}
                    className="rounded-full p-1.5 text-slate-600 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800"
                    title="Próximo slide (Seta direita / Espaço)"
                >
                    <ChevronRight size={18} />
                </button>

                <div className="hidden h-[1px] w-4 bg-slate-200 dark:bg-slate-800 sm:block" />

                <div className="flex items-center gap-1.5 sm:flex-col">
                    <button
                        onClick={() => setTool('laser')}
                        className={`rounded-full p-1.5 transition-all ${tool === 'laser' ? 'bg-red-500 text-white shadow-sm shadow-red-500/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        title="Apontador laser (Atalho: 1)"
                    >
                        <Sparkles size={16} />
                    </button>

                    <button
                        onClick={() => setTool('pen')}
                        className={`rounded-full p-1.5 transition-all ${tool === 'pen' ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        title="Caneta de desenho (Atalho: 2)"
                    >
                        <Pen size={16} />
                    </button>

                    <button
                        onClick={() => setTool('eraser')}
                        className={`rounded-full p-1.5 transition-all ${tool === 'eraser' ? 'bg-slate-700 text-white shadow-sm dark:bg-slate-300 dark:text-slate-900' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        title="Limpar desenhos (Atalho: 3)"
                    >
                        <Eraser size={16} />
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
