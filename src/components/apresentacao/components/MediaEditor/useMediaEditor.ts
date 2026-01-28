import { useState, useRef } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { MediaSlideData, SlideElement } from '@/types/presentation';
import { createBrowserClient } from '@supabase/ssr';

export function useMediaEditor(
    selectedSlide: MediaSlideData | undefined,
    onUpdate: (updates: Partial<MediaSlideData>) => void
) {
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const elements = selectedSlide?.elements || [];
    const activeElement = elements.find(el => el.id === selectedElementId);

    const handleUpdateElement = (elId: string, updates: Partial<SlideElement>) => {
        const newElements = elements.map(el =>
            el.id === elId ? { ...el, ...updates } : el
        );
        onUpdate({ elements: newElements });
    };

    const handleAddText = () => {
        const newElement: SlideElement = {
            id: crypto.randomUUID(),
            type: 'text',
            content: 'Novo Texto',
            position: { x: 0, y: 0 }
        };
        onUpdate({ elements: [...elements, newElement] });
        setSelectedElementId(newElement.id);
    };

    const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `presentation_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('presentation-media')
                .upload(filePath, file);

            if (uploadError) {
                safeLog.error('Error uploading image:', uploadError);
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('presentation-media')
                .getPublicUrl(filePath);

            const newElement: SlideElement = {
                id: crypto.randomUUID(),
                type: 'image',
                content: publicUrl,
                position: { x: 0, y: 0 },
                scale: 1
            };
            onUpdate({ elements: [...elements, newElement] });
            setSelectedElementId(newElement.id);

            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

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
        handleDeleteElement
    };
}
