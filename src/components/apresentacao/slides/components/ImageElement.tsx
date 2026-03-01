import React from 'react';
import { motion } from 'framer-motion';
import { SlideElement } from '@/types/presentation';

interface ImageElementProps {
    element: SlideElement; canDrag: boolean; isSelected: boolean;
    onSelect: (id: string) => void; onUpdate: (id: string, updates: Partial<SlideElement>) => void;
}

export const ImageElement: React.FC<ImageElementProps> = ({ element: el, canDrag, isSelected, onSelect, onUpdate }) => {
    return (
        <motion.div
            key={el.id}
            drag={canDrag}
            dragMomentum={false}
            onDragEnd={(_, info) => { if (!canDrag) return; onUpdate(el.id, { position: { x: (el.position?.x || 0) + info.offset.x, y: (el.position?.y || 0) + info.offset.y } }); }}
            onClick={(e) => {
                e.stopPropagation();
                if (canDrag) onSelect(el.id);
            }}
            style={{ x: el.position?.x || 0, y: el.position?.y || 0, scale: el.scale || 1, position: 'absolute', top: '50%', left: '50%', cursor: canDrag ? 'grab' : 'default', touchAction: 'none', transformOrigin: 'center center', zIndex: isSelected ? 50 : 10 }}
            whileDrag={{ cursor: 'grabbing', scale: (el.scale || 1) * 1.02 }}
            className="flex items-center justify-center group"
        >
            {/* Resize Handles */}
            {canDrag && isSelected && (
                <>
                    {[
                        { pos: 'tl', cursor: 'nwse-resize', sensitivity: -1 },
                        { pos: 'tr', cursor: 'nesw-resize', sensitivity: 1 },
                        { pos: 'bl', cursor: 'nesw-resize', sensitivity: -1 },
                        { pos: 'br', cursor: 'nwse-resize', sensitivity: 1 }
                    ].map((handle) => (
                        <div
                            key={handle.pos}
                            onPointerDown={(e) => {
                                e.stopPropagation(); e.preventDefault(); const startX = e.clientX; const startScale = el.scale || 1;
                                const onPointerMove = (moveEvent: PointerEvent) => {
                                    const sensitivity = (0.005 / startScale) * handle.sensitivity;
                                    onUpdate(el.id, { scale: Math.max(0.1, Math.min(5.0, startScale + (moveEvent.clientX - startX) * sensitivity)) });
                                };
                                const onPointerUp = () => { window.removeEventListener('pointermove', onPointerMove); window.removeEventListener('pointerup', onPointerUp); };
                                window.addEventListener('pointermove', onPointerMove); window.addEventListener('pointerup', onPointerUp);
                            }}
                            style={{ position: 'absolute', width: 24, height: 24, cursor: handle.cursor, zIndex: 100, left: handle.pos.includes('l') ? -12 : undefined, right: handle.pos.includes('r') ? -12 : undefined, top: handle.pos.includes('t') ? -12 : undefined, bottom: handle.pos.includes('b') ? -12 : undefined }}
                            className="flex items-center justify-center bg-white border-2 border-blue-500 rounded-full shadow-lg"
                        />
                    ))}
                    <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
                </>
            )}

            <div className="relative pointer-events-none select-none">
                <img src={el.content} className={`max-w-[85vw] max-h-[85vh] object-contain drop-shadow-2xl rounded-lg`} alt="Slide Element" draggable={false} />
            </div>
        </motion.div>
    );
};
