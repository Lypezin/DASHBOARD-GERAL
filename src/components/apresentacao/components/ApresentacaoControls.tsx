import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, FileDown, X, Loader2 } from 'lucide-react';

interface ApresentacaoControlsProps {
    currentSlide: number;
    totalSlides: number;
    onPrev: () => void;
    onNext: () => void;
    onClose: () => void;
    onGeneratePDF: () => void;
    isGenerating: boolean;
}

export const ApresentacaoControls: React.FC<ApresentacaoControlsProps> = ({
    currentSlide,
    totalSlides,
    onPrev,
    onNext,
    onClose,
    onGeneratePDF,
    isGenerating
}) => {
    const slideAtualExibicao = totalSlides > 0 ? currentSlide + 1 : 0;

    return (
        <div className="sticky top-0 bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center z-10">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Preview da Apresentação</h3>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onPrev}
                        disabled={currentSlide === 0 || totalSlides === 0}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300 min-w-[3rem] text-center">
                        {slideAtualExibicao} / {totalSlides}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onNext}
                        disabled={totalSlides === 0 || currentSlide === totalSlides - 1}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

                <Button
                    onClick={onGeneratePDF}
                    disabled={totalSlides === 0 || isGenerating}
                    className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Gerando...
                        </>
                    ) : (
                        <>
                            <FileDown className="mr-2 h-4 w-4" />
                            Gerar PDF
                        </>
                    )}
                </Button>

                <Button
                    variant="outline"
                    onClick={onClose}
                    className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <X className="mr-2 h-4 w-4" />
                    Fechar
                </Button>
            </div>
        </div>
    );
};
