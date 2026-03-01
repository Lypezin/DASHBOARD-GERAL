import React from 'react';
import { SlideElement } from '@/types/presentation';

interface ResizeHandlesProps {
    el: SlideElement;
    onUpdate: (id: string, updates: Partial<SlideElement>) => void;
}

export const TextElementResizeHandles: React.FC<ResizeHandlesProps> = ({ el, onUpdate }) => {
    return (
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
                        e.stopPropagation();
                        e.preventDefault();
                        const startX = e.clientX;
                        const startScale = el.scale || 1;

                        const onPointerMove = (moveEvent: PointerEvent) => {
                            const newScale = Math.max(0.3, Math.min(3.0, startScale + (moveEvent.clientX - startX) * ((0.005 / startScale) * handle.sensitivity)));
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
                        width: 20, height: 20, cursor: handle.cursor, zIndex: 100,
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
    );
};
