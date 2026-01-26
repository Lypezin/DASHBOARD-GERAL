import React from 'react';
import { motion } from 'framer-motion';
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
                minWidth: '200px'
            }}
            whileDrag={{ cursor: 'grabbing', scale: (el.scale || 1) * 1.02 }}
            className="flex items-center justify-center group"
        >
            {/* Selection border and resize handles */}
            {canDrag && isSelected && (
                <>
                    {/* Resize handles */}
                    {[
                        { pos: 'tl', cursor: 'nwse-resize', sensitivity: -1 },
                        { pos: 'tr', cursor: 'nesw-resize', sensitivity: 1 },
                        { pos: 'bl', cursor: 'nesw-resize', sensitivity: -1 },
                        { pos: 'br', cursor: 'nwse-resize', sensitivity: 1 }
                    ].map((handle) => (
                        <div
                            key={handle.pos}
                            onPointerDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                const startX = e.clientX;
                                const startScale = el.scale || 1;

                                const onPointerMove = (moveEvent: PointerEvent) => {
                                    const currentScale = startScale;
                                    const deltaX = moveEvent.clientX - startX;
                                    const sensitivity = (0.005 / currentScale) * handle.sensitivity;
                                    const newScale = Math.max(0.3, Math.min(3.0, startScale + deltaX * sensitivity));
                                    onUpdate(el.id, { scale: newScale });
                                };

                                const onPointerUp = () => {
                                    window.removeEventListener('pointermove', onPointerMove);
                                    window.removeEventListener('pointerup', onPointerUp);
                                };

                                window.addEventListener('pointermove', onPointerMove);
                                window.addEventListener('pointerup', onPointerUp);
                            }}
                            style={{
                                position: 'absolute',
                                width: 20,
                                height: 20,
                                cursor: handle.cursor,
                                zIndex: 100,
                                left: handle.pos.includes('l') ? -10 : undefined,
                                right: handle.pos.includes('r') ? -10 : undefined,
                                top: handle.pos.includes('t') ? -10 : undefined,
                                bottom: handle.pos.includes('b') ? -10 : undefined,
                            }}
                            className="flex items-center justify-center bg-white border-2 border-blue-500 rounded-full shadow-lg"
                        />
                    ))}
                    <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
                </>
            )}

            {/* Text Content */}
            <div
                className={`relative p-3 text-center rounded focus:outline-none select-none`}
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
