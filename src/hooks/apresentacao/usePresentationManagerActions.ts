import { toast } from 'sonner';
import { SavedPresentation } from '@/hooks/apresentacao/useSavedPresentations';

interface UsePresentationManagerActionsProps {
    savePresentation: (name: string, slides: any[], sections: any, filters: any) => Promise<void>;
    mediaSlides: any[];
    visibleSections: any;
    pracaSelecionada: string | null;
    anoSelecionado: number | undefined;
    semanasSelecionadas: string[];
    setMediaSlides: (slides: any[]) => void;
    setVisibleSections: (sections: any) => void;
    setIsManagersOpen: (isOpen: boolean) => void;
    onPracaChange?: (praca: string) => void;
    onSemanasChange?: (semanas: string[]) => void;
}

export const usePresentationManagerActions = ({
    savePresentation,
    mediaSlides,
    visibleSections,
    pracaSelecionada,
    anoSelecionado,
    semanasSelecionadas,
    setMediaSlides,
    setVisibleSections,
    setIsManagersOpen,
    onPracaChange,
    onSemanasChange
}: UsePresentationManagerActionsProps) => {

    const handleSavePresentation = async (name: string) => {
        try {
            await savePresentation(name, mediaSlides, visibleSections, {
                praca: pracaSelecionada,
                ano: anoSelecionado,
                semanas: semanasSelecionadas
            });
            toast.success('Apresentação salva com sucesso!');
        } catch (error) {
            toast.error('Falha ao salvar apresentação.');
        }
    };

    const handleLoadPresentation = (pres: SavedPresentation) => {
        // 1. Restore Slides/Sections (Content)
        if (pres.slides) setMediaSlides(pres.slides);
        if (pres.sections) setVisibleSections(pres.sections);
        setIsManagersOpen(false);

        // 2. Restore Global Filters (Context) - If callbacks provided
        let contextChanged = false;

        // Restore Praca
        if (pres.filters?.praca && pres.filters.praca !== pracaSelecionada && onPracaChange) {
            onPracaChange(pres.filters.praca);
            contextChanged = true;
        }

        // Restore Weeks
        const savedWeeks = pres.filters?.semanas || [];
        const currentWeeks = semanasSelecionadas || [];
        const weeksChanged = savedWeeks.length !== currentWeeks.length ||
            !savedWeeks.slice().sort().every((val: any, index: any) => val === currentWeeks.slice().sort()[index]);

        if (weeksChanged && onSemanasChange && savedWeeks.length > 0) {
            onSemanasChange(savedWeeks);
            contextChanged = true;
        }

        if (contextChanged) {
            toast.success(`Contexto atualizado para: ${pres.filters?.praca || 'Geral'} (${pres.filters?.semanas?.length} semanas)`);
        } else {
            toast.success(`Apresentação "${pres.name}" carregada.`);
        }
    };

    return { handleSavePresentation, handleLoadPresentation };
};
