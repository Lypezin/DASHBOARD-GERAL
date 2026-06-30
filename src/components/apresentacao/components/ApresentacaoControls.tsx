import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Check, FilePlus, FolderOpen, Save, Download, FileSpreadsheet } from 'lucide-react';
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
    onExportExcel?: () => void;
}

export const ApresentacaoControls: React.FC<ApresentacaoControlsProps> = React.memo(({
    currentSlide,
    totalSlides,
    onPrev,
    onNext,
    onClose,
    onGeneratePDF,
    onStartPresentation,
    isGenerating,
    visibleSections,
    onToggleSection,
    onManageMedia,
    onSaveClick,
    onManageClick,
    onExportExcel
}) => {
    return (
        <div className="sticky top-0 z-10 flex min-w-0 flex-col gap-2 border-b border-slate-200 bg-white/96 p-2.5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/96 md:flex-row md:items-center md:gap-3 md:p-3">
            <div className="flex min-w-0 shrink-0 items-center gap-3">
                <PresentationSectionToggle
                    visibleSections={visibleSections}
                    onToggleSection={onToggleSection}
                />
            </div>

            {/* Spacer to push controls to the right on desktop */}
            <div className="hidden md:block flex-grow" />

            <div className="subtle-scrollbar flex min-w-0 max-w-full items-center gap-2 overflow-x-auto pb-1 md:flex-wrap md:gap-2.5 md:overflow-visible md:pb-0">

                <PresentationNavigation
                    currentSlide={currentSlide}
                    totalSlides={totalSlides}
                    onPrev={onPrev}
                    onNext={onNext}
                />

                <div className="hidden h-6 w-px shrink-0 bg-slate-200 dark:bg-slate-700 sm:block" />

                {onManageMedia && (
                    <Button
                        variant="outline"
                        className="h-9 shrink-0 border-slate-200 px-3 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        onClick={onManageMedia}
                    >
                        <FilePlus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Fotos</span>
                    </Button>
                )}

                {onManageMedia && <div className="hidden h-6 w-px shrink-0 bg-slate-200 dark:bg-slate-700 sm:block" />}

                {onManageClick && (
                    <Button
                        variant="outline"
                        className="h-9 shrink-0 border-slate-200 px-3 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
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
                        className="h-9 shrink-0 border-slate-200 px-3 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700"
                        onClick={onSaveClick}
                        title="Salvar Apresentação"
                    >
                        <Save className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Salvar</span>
                    </Button>
                )}

                <div className="hidden h-6 w-px shrink-0 bg-slate-200 dark:bg-slate-700 sm:block" />

                {onExportExcel && (
                    <Button
                        variant="outline"
                        className="h-9 shrink-0 border-slate-200 px-3 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        onClick={onExportExcel}
                        title="Exportar Planilha Excel"
                    >
                        <FileSpreadsheet className="h-4 w-4 sm:mr-2 text-emerald-600" />
                        <span className="hidden sm:inline">Excel</span>
                    </Button>
                )}

                <Button
                    variant="outline"
                    className="h-9 shrink-0 border-slate-200 px-3 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                    onClick={onGeneratePDF}
                    disabled={isGenerating}
                    title="Exportar PDF"
                >
                    <Download className="h-4 w-4 sm:mr-2 text-sky-600" />
                    <span className="hidden sm:inline">PDF</span>
                </Button>

                <div className="hidden h-6 w-px shrink-0 bg-slate-200 dark:bg-slate-700 sm:block" />

                <Button
                    onClick={onStartPresentation}
                    className="h-9 shrink-0 bg-emerald-600 px-3 text-white hover:bg-emerald-700"
                >
                    <Check className="mr-2 h-4 w-4" />
                    Iniciar
                </Button>

                <Button
                    variant="outline"
                    onClick={onClose}
                    className="h-9 shrink-0 border-slate-200 px-3 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                    title="Fechar"
                >
                    <X className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Fechar</span>
                </Button>
            </div>
        </div>
    );
});

ApresentacaoControls.displayName = 'ApresentacaoControls';
