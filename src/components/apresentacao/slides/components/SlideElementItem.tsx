import React from 'react';
import { SlideElement } from '@/types/presentation';
import { ImageElement } from './ImageElement';
import { TextElement } from './TextElement';

interface SlideElementItemProps {
    element: SlideElement;
    canDrag: boolean;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onUpdate: (id: string, updates: Partial<SlideElement>) => void;
}

export const SlideElementItem: React.FC<SlideElementItemProps> = ({
    element: el,
    canDrag,
    isSelected,
    onSelect,
    onUpdate
}) => {
    if (el.type === 'image') {
        return (
            <ImageElement
                element={el}
                canDrag={canDrag}
                isSelected={isSelected}
                onSelect={onSelect}
                onUpdate={onUpdate}
            />
        );
    } else if (el.type === 'text') {
        return (
            <TextElement
                element={el}
                canDrag={canDrag}
                isSelected={isSelected}
                onSelect={onSelect}
                onUpdate={onUpdate}
            />
        );
    }
    return null;
};
