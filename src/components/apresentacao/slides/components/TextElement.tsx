import React from 'react';
import { SlideElement } from '@/types/presentation';

interface TextElementProps {
    element: SlideElement;
    canDrag: boolean;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onUpdate: (id: string, updates: Partial<SlideElement>) => void;
}

export const TextElement: React.FC<TextElementProps> = ({
    element: el,
    canDrag,
    isSelected,
    onSelect,
    onUpdate
}) => {
    return (
        <div
            key={el.id}
            onClick={(e) => {
                e.stopPropagation();
                if (canDrag) onSelect(el.id);
            }}
            style={{
                transform: `translate(-50%, -50%) translate(${el.position?.x || 0}px, ${el.position?.y || 0}px)`,
                position: 'absolute',
                zIndex: isSelected ? 50 : 30,
                cursor: canDrag ? 'grab' : 'default',
                left: '50%',
                top: '50%',
                minWidth: '300px'
            }}
        >
            <div
                className={`relative p-2 text-center rounded focus:outline-none ${isSelected && canDrag ? 'ring-2 ring-blue-500 bg-blue-50/10' : ''}`}
            >
                <p
                    className="text-3xl leading-relaxed whitespace-pre-wrap outline-none"
                    style={{
                        textShadow: '0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.8)',
                        color: el.style?.color || '#0f172a',
                        fontWeight: el.style?.fontWeight === 'bold' ? 'bold' : 'normal',
                        fontStyle: el.style?.fontStyle === 'italic' ? 'italic' : 'normal',
                        fontSize: el.style?.fontSize || '1.875rem',
                        backgroundColor: el.style?.bg || 'transparent',
                    }}
                    contentEditable={canDrag && isSelected}
                    suppressContentEditableWarning
                    onBlur={(e) => {
                        const newText = e.currentTarget.innerText;
                        if (newText !== el.content) {
                            onUpdate(el.id, { content: newText });
                        }
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                >
                    {el.content}
                </p>
            </div>
        </div>
    );
};
