import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface SlideOverride {
    title?: string;
    subTitle?: string;
}

interface PresentationEditorContextType {
    slideOrder: string[];
    setSlideOrder: (order: string[]) => void;
    moveSlide: (dragIndex: number, hoverIndex: number) => void;
    overrides: Record<string, SlideOverride>;
    setOverride: (key: string, override: Partial<SlideOverride>) => void;
    isEditing: boolean;
    toggleEditing: () => void;
    selectedElementId: string | null;
    setSelectedElementId: (id: string | null) => void;
}

export const PresentationEditorContext = createContext<PresentationEditorContextType | undefined>(undefined);

export const PresentationEditorProvider: React.FC<{ children: ReactNode; initialOrder: string[] }> = ({
    children,
    initialOrder
}) => {
    const [slideOrder, setSlideOrder] = useState<string[]>(initialOrder);
    const [overrides, setOverrides] = useState<Record<string, SlideOverride>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

    const moveSlide = useCallback((dragIndex: number, hoverIndex: number) => {
        setSlideOrder((prevOrder) => {
            const newOrder = [...prevOrder];
            const [removed] = newOrder.splice(dragIndex, 1);
            newOrder.splice(hoverIndex, 0, removed);
            return newOrder;
        });
    }, []);

    const setOverride = useCallback((key: string, override: Partial<SlideOverride>) => {
        setOverrides(prev => ({
            ...prev,
            [key]: { ...prev[key], ...override }
        }));
    }, []);

    const toggleEditing = useCallback(() => {
        setIsEditing(prev => !prev);
    }, []);

    return (
        <PresentationEditorContext.Provider value={{
            slideOrder,
            setSlideOrder,
            moveSlide,
            overrides,
            setOverride,
            isEditing,
            toggleEditing,
            selectedElementId,
            setSelectedElementId
        }}>
            {children}
        </PresentationEditorContext.Provider>
    );
};

export const usePresentationEditor = () => {
    const context = useContext(PresentationEditorContext);
    if (!context) {
        throw new Error('usePresentationEditor must be used within a PresentationEditorProvider');
    }
    return context;
};
