import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Check, FilePlus, FolderOpen, Save } from 'lucide-react';
import { PresentationSectionToggle } from './PresentationSectionToggle';
import { PresentationNavigation } from './PresentationNavigation';

interface ApresentacaoControlsProps {
    currentSlide: number;
    totalSlides: number;
    onPrev: () => void;
    onNext: () => void;
    onClose: () => void;
    onGeneratePDF: () => void;
    onStartPresentation: () => void;
    isGenerating: boolean;
    visibleSections: Record<string, boolean>;
    onToggleSection: (section: string) => void;
    onManageMedia?: () => void;
    onSaveClick?: () => void;
    onManageClick?: () => void;
}

export const ApresentacaoControls: React.FC<ApresentacaoControlsProps> = ({
    currentSlide,
    totalSlides,
    onPrev,
    onNext,
    onClose,
    onStartPresentation,
    visibleSections,
    onToggleSection,
    onManageMedia,
    onSaveClick,
    onManageClick
}) => {
    return (
        <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between md:p-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white md:text-xl">Preview da Apresentação</h3>

            <div className="flex flex-nowrap w-full items-center gap-2 md:gap-4 overflow-x-auto pb-1 md:pb-0 hide-scrollbar-custom" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style dangerouslySetInnerHTML={{ __html: `.hide-scrollbar-custom::-webkit-scrollbar { display: none; }` }} />
                <PresentationSectionToggle
                    visibleSections={visibleSections}
                    onToggleSection={onToggleSection}
                />

                <div className="h-6 w-px shrink-0 bg-slate-200 dark:bg-slate-700" />

                <PresentationNavigation
                    currentSlide={currentSlide}
                    totalSlides={totalSlides}
                    onPrev={onPrev}
                    onNext={onNext}
                />

                <div className="h-6 w-px shrink-0 bg-slate-200 dark:bg-slate-700" />

                {onManageMedia && (
                    <Button
                        variant="outline"
                        className="shrink-0 border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        onClick={onManageMedia}
                    >
                        <FilePlus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Fotos</span>
                    </Button>
                )}

                {onManageMedia && <div className="h-6 w-px shrink-0 bg-slate-200 dark:bg-slate-700" />}

                {onManageClick && (
                    <Button
                        variant="outline"
                        className="shrink-0 border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        onClick={onManageClick}
                        title="Minhas Apresentações"
                    >
                        <FolderOpen className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Minhas</span>
                    </Button>
                )}

                {onSaveClick && (
                    <Button
                        variant="outline"
                        className="shrink-0 border-slate-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700"
                        onClick={onSaveClick}
                        title="Salvar Apresentação"
                    >
                        <Save className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Salvar</span>
                    </Button>
                )}

                <div className="h-6 w-px shrink-0 bg-slate-200 dark:bg-slate-700" />

                <Button
                    onClick={onStartPresentation}
                    className="shrink-0 bg-emerald-600 text-white hover:bg-emerald-700"
                >
                    <Check className="mr-2 h-4 w-4" />
                    Iniciar
                </Button>

                <Button
                    variant="outline"
                    onClick={onClose}
                    className="shrink-0 border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                    title="Fechar"
                >
                    <X className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Fechar</span>
                </Button>
            </div>
        </div>
    );
};
