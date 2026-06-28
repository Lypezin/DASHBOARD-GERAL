import React from 'react';
import { motion } from 'framer-motion';
import { SlideElement } from '@/types/presentation';
import { TextElementResizeHandles } from './TextElementResizeHandles';

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
    const textWidth = el.width || 520;
    const backgroundColor = el.style?.bg || 'transparent';

    return (
        <motion.div
            key={el.id}
            drag={canDrag}
            dragMomentum={false}
            onDragEnd={(_, info) => {
                if (!canDrag) return;
                onUpdate(el.id, {
                    position: {
                        x: (el.position?.x || 0) + info.offset.x,
                        y: (el.position?.y || 0) + info.offset.y
                    }
                });
            }}
            onClick={(e) => {
                e.stopPropagation();
                if (canDrag) onSelect(el.id);
            }}
            style={{
                x: el.position?.x || 0,
                y: el.position?.y || 0,
                scale: el.scale || 1,
                position: 'absolute',
                top: '50%',
                left: '50%',
                cursor: canDrag ? 'grab' : 'default',
                touchAction: 'none',
                transformOrigin: 'center center',
                zIndex: isSelected ? 50 : 30,
                width: textWidth,
                maxWidth: '86%'
            }}
            whileDrag={{ cursor: 'grabbing', scale: (el.scale || 1) * 1.02 }}
            className="flex items-center justify-center group"
        >
            {/* Selection border and resize handles */}
            {canDrag && isSelected && <TextElementResizeHandles el={el} onUpdate={onUpdate} />
            }

            {/* Text Content */}
            <div className="relative w-full text-center rounded focus:outline-none select-none">
                <p
                    className="min-h-[64px] w-full rounded-lg px-6 py-4 leading-tight whitespace-pre-wrap break-words outline-none"
                    style={{
                        textShadow: backgroundColor === 'transparent' ? '0 2px 10px rgba(255,255,255,0.72)' : 'none',
                        color: el.style?.color || '#0f172a',
                        fontWeight: el.style?.fontWeight === 'bold' ? 'bold' : 'normal',
                        fontStyle: el.style?.fontStyle === 'italic' ? 'italic' : 'normal',
                        fontSize: el.style?.fontSize || '1.875rem',
                        fontFamily: el.style?.fontFamily === 'Outfit' ? 'var(--font-outfit), sans-serif' : 'var(--font-inter), sans-serif',
                        textAlign: el.style?.textAlign || 'center',
                        backgroundColor,
                        boxShadow: backgroundColor === 'transparent' ? 'none' : '0 18px 42px rgba(15,23,42,0.16)',
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
                    onPointerDown={(e) => {
                        // Prevent drag when clicking to edit text
                        if (isSelected && canDrag) {
                            e.stopPropagation();
                        }
                    }}
                >
                    {el.content}
                </p>
            </div>
        </motion.div>
    );
};
