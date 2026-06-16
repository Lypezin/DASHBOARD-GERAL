import { useState } from 'react';
import { MediaSlideData, SlideElement } from '@/types/presentation';
import { useMediaUpload } from '@/hooks/apresentacao/useMediaUpload';

export function useMediaEditor(
    selectedSlide: MediaSlideData | undefined,
    onUpdate: (updates: Partial<MediaSlideData>) => void
) {
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

    const elements = selectedSlide?.elements || [];
    const activeElement = elements.find(el => el.id === selectedElementId);

    const handleUpdateElement = (elId: string, updates: Partial<SlideElement>) => {
        const newElements = elements.map(el =>
            el.id === elId ? { ...el, ...updates } : el
        );
        onUpdate({ elements: newElements });
    };

    const handleAddText = () => {
        const id = crypto.randomUUID();
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
        onUpdate({ elements: [...elements, newElement] });
        setSelectedElementId(id);
    };

    const { fileInputRef, handleFileUpload: handleAddImage, isUploading } = useMediaUpload((publicUrl) => {
        const id = crypto.randomUUID();
        const newElement: SlideElement = {
            id,
            type: 'image',
            content: publicUrl,
            position: { x: 0, y: 0 },
            scale: 1,
            width: 720
        };
        onUpdate({ elements: [...elements, newElement] });
        setSelectedElementId(id);
    });

    const handleDeleteElement = () => {
        if (selectedElementId) {
            onUpdate({ elements: elements.filter(el => el.id !== selectedElementId) });
            setSelectedElementId(null);
        }
    };

    return {
        selectedElementId,
        setSelectedElementId,
        fileInputRef,
        elements,
        activeElement,
        handleUpdateElement,
        handleAddText,
        handleAddImage,
        isUploading,
        handleDeleteElement
    };
}
