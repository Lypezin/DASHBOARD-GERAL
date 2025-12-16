import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, FileDown, X, Loader2, Settings, Check, FilePlus } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
}

const SECTION_LABELS: Record<string, string> = {
    capa: 'Capa',
    'aderencia-geral': 'Aderência Geral',
    'sub-pracas': 'Sub-praças',
    'aderencia-diaria': 'Detalhamento Diário',
    turnos: 'Turnos',
    origens: 'Origens',
    demanda: 'Demanda e Rejeições',
};

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
}) => {
    const slideAtualExibicao = totalSlides > 0 ? currentSlide + 1 : 0;

    return (
        <div className="sticky top-0 bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center z-10">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Preview da Apresentação</h3>
            <div className="flex items-center gap-4">
                {/* Customize Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                            <Settings className="mr-2 h-4 w-4" />
                            Personalizar
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 z-[100001]">
                        <DropdownMenuLabel>Seções do PDF</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {Object.keys(visibleSections).map((key) => (
                            <DropdownMenuCheckboxItem
                                key={key}
                                checked={visibleSections[key]}
                                onCheckedChange={() => onToggleSection(key)}
                                onSelect={(e) => e.preventDefault()}
                            >
                                {SECTION_LABELS[key] || key}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

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

                {/* Media Manager Button - Only show if callback provided */}
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
