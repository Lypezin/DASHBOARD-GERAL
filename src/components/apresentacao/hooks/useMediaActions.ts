import { SlideElement } from '@/types/presentation';

interface UseMediaActionsProps {
    activeMediaSlide?: { id: string, elements?: SlideElement[] } | null;
    onUpdateMediaSlide?: (id: string, updates: { elements: SlideElement[] }) => void;
    selectedElementId: string | null;
    setSelectedElementId: (id: string | null) => void;
}

export function useMediaActions({
    activeMediaSlide,
    onUpdateMediaSlide,
    selectedElementId,
    setSelectedElementId
}: UseMediaActionsProps) {

    const handleUpdateElement = (updates: Partial<SlideElement>) => {
        if (!selectedElementId || !activeMediaSlide || !onUpdateMediaSlide) return;

        const newElements = (activeMediaSlide.elements || []).map(el =>
            el.id === selectedElementId ? { ...el, ...updates } : el
        );
        onUpdateMediaSlide(activeMediaSlide.id, { elements: newElements });
    };

    const handleAddText = () => {
        if (!activeMediaSlide || !onUpdateMediaSlide) return;

        const id = Math.random().toString(36).substr(2, 9);
        const newElement: SlideElement = {
            id,
            type: 'text',
            content: 'Clique para editar',
            position: { x: 0, y: 0 },
            scale: 1,
            width: 520,
            style: {
                color: '#0f172a',
                fontSize: '2.25rem',
                fontWeight: 'bold',
                fontStyle: 'normal',
                bg: '#ffffff'
            }
        };
        onUpdateMediaSlide(activeMediaSlide.id, {
            elements: [...(activeMediaSlide.elements || []), newElement]
        });
        setSelectedElementId(id);
    };

    const handleAddImage = (url: string) => {
        if (!activeMediaSlide || !onUpdateMediaSlide) return;

        const id = Math.random().toString(36).substr(2, 9);
        const newElement: SlideElement = {
            id,
            type: 'image',
            content: url,
            position: { x: 0, y: 0 },
            scale: 1,
            width: 720
        };
        onUpdateMediaSlide(activeMediaSlide.id, {
            elements: [...(activeMediaSlide.elements || []), newElement]
        });
        setSelectedElementId(id);
    };

    const handleDeleteSelection = () => {
        if (!selectedElementId || !activeMediaSlide || !onUpdateMediaSlide) return;

        const newElements = (activeMediaSlide.elements || []).filter(el => el.id !== selectedElementId);
        onUpdateMediaSlide(activeMediaSlide.id, { elements: newElements });
        setSelectedElementId(null);
    };

    return {
        handleUpdateElement,
        handleAddText,
        handleAddImage,
        handleDeleteSelection
    };
}
