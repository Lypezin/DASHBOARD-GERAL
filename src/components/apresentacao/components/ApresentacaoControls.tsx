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

export const ApresentacaoControls: React.FC<ApresentacaoControlsProps> = ({
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
        <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:p-4">
            <div className="flex items-center gap-3 shrink-0">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white md:text-xl shrink-0">Preview da Apresentação</h3>
                <PresentationSectionToggle
                    visibleSections={visibleSections}
                    onToggleSection={onToggleSection}
                />
            </div>

            {/* Spacer to push controls to the right on desktop */}
            <div className="hidden md:block flex-grow" />

            <div className="flex flex-nowrap items-center gap-2 md:gap-3 overflow-x-auto pb-1 md:pb-0 hide-scrollbar-custom" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style dangerouslySetInnerHTML={{ __html: `.hide-scrollbar-custom::-webkit-scrollbar { display: none; }` }} />

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

                {onExportExcel && (
                    <Button
                        variant="outline"
                        className="shrink-0 border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        onClick={onExportExcel}
                        title="Exportar Planilha Excel"
                    >
                        <FileSpreadsheet className="h-4 w-4 sm:mr-2 text-emerald-600" />
                        <span className="hidden sm:inline">Excel</span>
                    </Button>
                )}

                <Button
                    variant="outline"
                    className="shrink-0 border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                    onClick={onGeneratePDF}
                    disabled={isGenerating}
                    title="Exportar PDF"
                >
                    <Download className="h-4 w-4 sm:mr-2 text-sky-600" />
                    <span className="hidden sm:inline">PDF</span>
                </Button>

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
