import React from 'react';
import { motion } from 'framer-motion';
import { SlideElement } from '@/types/presentation';

interface ImageElementProps {
    element: SlideElement;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onUpdate: (id: string, updates: Partial<SlideElement>) => void;
    commonProps: any;
}

export const ImageElement: React.FC<ImageElementProps> = ({
    element,
    isSelected,
    onSelect,
    onUpdate,
    commonProps
}) => {
    return (
        <motion.div
            {...commonProps}
            className={`flex items-center justify-center origin-center group ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        >
            {isSelected && (
                <>
                    {[
                        { pos: 'tl', cursor: 'nwse-resize', sensitivity: -1 },
                        { pos: 'tr', cursor: 'nesw-resize', sensitivity: 1 },
                        { pos: 'bl', cursor: 'nesw-resize', sensitivity: -1 },
                        { pos: 'br', cursor: 'nwse-resize', sensitivity: 1 }
                    ].map((handle) => (
                        <motion.div
                            key={`${element.id}-${handle.pos}`}
                            drag="x"
                            dragMomentum={false}
                            dragPropagation={false}
                            onDrag={(_, info) => {
                                const currentScale = element.scale || 1;
                                const sensitivity = (0.005 / currentScale) * handle.sensitivity;
                                const newScale = Math.max(0.1, Math.min(5.0, (element.scale || 1) + info.delta.x * sensitivity));
                                onUpdate(element.id, { scale: newScale });
                            }}
                            style={{
                                position: 'absolute', width: 40, height: 40, cursor: handle.cursor, zIndex: 60,
                                left: handle.pos.includes('l') ? -20 : undefined,
                                right: handle.pos.includes('r') ? -20 : undefined,
                                top: handle.pos.includes('t') ? -20 : undefined,
                                bottom: handle.pos.includes('b') ? -20 : undefined,
                            }}
                            className="flex items-center justify-center"
                        >
                            <div className="w-4 h-4 bg-white border-2 border-slate-400 rounded-full shadow-lg" />
                        </motion.div>
                    ))}
                </>
            )}
            <div className="relative pointer-events-none select-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={element.content} alt="Preview" className="max-w-[70vw] max-h-[70vh] object-contain rounded pointer-events-none select-none" draggable={false} />
            </div>
        </motion.div>
    );
};
