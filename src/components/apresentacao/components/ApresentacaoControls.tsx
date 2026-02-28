import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Check, FilePlus, FolderOpen, Save } from 'lucide-react';
import { PresentationSectionToggle } from './PresentationSectionToggle';
import { PresentationNavigation } from './PresentationNavigation';

interface ApresentacaoControlsProps {
    currentSlide: number; totalSlides: number; onPrev: () => void; onNext: () => void;
    onClose: () => void; onGeneratePDF: () => void; onStartPresentation: () => void; isGenerating: boolean;
    visibleSections: Record<string, boolean>; onToggleSection: (section: string) => void;
    onManageMedia?: () => void; onSaveClick?: () => void; onManageClick?: () => void;
}

export const ApresentacaoControls: React.FC<ApresentacaoControlsProps> = ({
    currentSlide, totalSlides, onPrev, onNext, onClose, onStartPresentation,
    visibleSections, onToggleSection, onManageMedia, onSaveClick, onManageClick
}) => {
    return (
        <div className="sticky top-0 bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center z-10">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Preview da Apresentação</h3>
            <div className="flex items-center gap-4">
                <PresentationSectionToggle
                    visibleSections={visibleSections}
                    onToggleSection={onToggleSection}
                />

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

                <PresentationNavigation
                    currentSlide={currentSlide}
                    totalSlides={totalSlides}
                    onPrev={onPrev}
                    onNext={onNext}
                />

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

                {onManageMedia && (
                    <Button
                        variant="outline"
                        className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        onClick={onManageMedia}
                    >
                        <FilePlus className="mr-2 h-4 w-4" />
                        Adicionar Fotos
                    </Button>
                )}

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

                {onManageClick && (
                    <Button
                        variant="outline"
                        className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        onClick={onManageClick}
                        title="Minhas Apresentações"
                    >
                        <FolderOpen className="mr-2 h-4 w-4" />
                        Minhas
                    </Button>
                )}

                {onSaveClick && (
                    <Button
                        variant="outline"
                        className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={onSaveClick}
                        title="Salvar Apresentação"
                    >
                        <Save className="mr-2 h-4 w-4" />
                        Salvar
                    </Button>
                )}

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

                <Button
                    onClick={onStartPresentation}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[170px]"
                >
                    <Check className="mr-2 h-4 w-4" />
                    Iniciar Apresentação
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
