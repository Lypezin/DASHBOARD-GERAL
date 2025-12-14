import React, { useRef } from 'react';
import { MediaSlideData } from '@/types/presentation';
import SlideWrapper from '../SlideWrapper';
import { motion } from 'framer-motion';
import { usePresentationContext } from '@/contexts/PresentationContext';

interface SlideMediaProps {
    isVisible: boolean;
    slideData: MediaSlideData;
    index: number;
    onUpdate?: (updates: Partial<MediaSlideData>) => void;
}

const SlideMedia: React.FC<SlideMediaProps> = ({ isVisible, slideData, index, onUpdate }) => {
    const { isWebMode } = usePresentationContext();
    const containerRef = useRef<HTMLDivElement>(null);

    // Only allow dragging in Preview mode (not in Web/Presentation mode)
    // AND if onUpdate is provided (which implies we are in an editable context)
    const canDrag = !isWebMode && !!onUpdate;

    return (
        <SlideWrapper
            isVisible={isVisible}
            style={{
                padding: 0,
                backgroundColor: '#ffffff',
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            {/* Main Container */}
            <div ref={containerRef} className="w-full h-full relative bg-white overflow-hidden">

                {/* Draggable Image */}
                <motion.div
                    drag={canDrag}
                    dragMomentum={false}
                    onDragEnd={(_, info) => {
                        if (!canDrag) return;
                        const currentX = slideData.imagePosition?.x || 0;
                        const currentY = slideData.imagePosition?.y || 0;

                        onUpdate({
                            imagePosition: {
                                x: currentX + info.offset.x,
                                y: currentY + info.offset.y
                            }
                        });
                    }}
                    style={{
                        x: slideData.imagePosition?.x || 0,
                        y: slideData.imagePosition?.y || 0,
                        scale: slideData.scale || 1, // Parent scale
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        cursor: canDrag ? 'grab' : 'default',
                        touchAction: 'none',
                        transformOrigin: 'center center'
                    }}
                    whileDrag={{ cursor: 'grabbing', scale: (slideData.scale || 1) * 1.02 }}
                    className="flex items-center justify-center group"
                >
                    {/* 4 Resize Handles */}
                    {canDrag && (
                        <>
                            {[
                                { pos: 'tl', cursor: 'nwse-resize', sensitivity: -1, x: -20, y: -20 },
                                { pos: 'tr', cursor: 'nesw-resize', sensitivity: 1, x: 'calc(100% - 20px)', y: -20 },
                                { pos: 'bl', cursor: 'nesw-resize', sensitivity: -1, x: -20, y: 'calc(100% - 20px)' },
                                { pos: 'br', cursor: 'nwse-resize', sensitivity: 1, x: 'calc(100% - 20px)', y: 'calc(100% - 20px)' }
                            ].map((handle) => (
                                <motion.div
                                    key={handle.pos}
                                    drag="x" // We only need horizontal drag delta for scaling logic simplicity
                                    dragMomentum={false}
                                    dragPropagation={false}
                                    onDrag={(_, info) => {
                                        const currentScale = slideData.scale || 1;
                                        // Sensitivity adjustment for smoother control at different scales
                                        const sensitivity = (0.005 / currentScale) * handle.sensitivity;
                                        const newScale = Math.max(0.1, Math.min(5.0, slideData.scale + info.delta.x * sensitivity));
                                        onUpdate({ scale: newScale });
                                    }}
                                    onDragEnd={() => { }}
                                    // Make dragConstraints loosely infinite so it doesn't get stuck
                                    dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
                                    // Snap back to position is handled by layout/style re-render? 
                                    // Actually if we use drag="x", framer motion might keep the offset.
                                    // We want it to be a "virtual" drag joystick.
                                    // Adding dragElastic={0} and dragConstraints={{...}} with onDragEnd cleaning up?
                                    // In Frame Motion, simplest "sticky handle" is to NOT let it move visually but capture drag delta.
                                    // But user expects visual movement. 
                                    // Let's rely on standard drag behavior but resetting position onDragEnd if needed? 
                                    // Actually, if we just render it absolutely, React re-renders will snap it back if we don't save its position.
                                    style={{
                                        position: 'absolute',
                                        left: handle.x !== undefined && typeof handle.x === 'number' && handle.x < 0 ? handle.x : undefined,
                                        right: handle.x !== undefined && typeof handle.x !== 'number' ? 20 : (handle.pos.includes('r') ? -20 : undefined),
                                        // Using simpler positioning style
                                        ...(handle.pos.includes('l') ? { left: -20 } : { right: -20 }),
                                        ...(handle.pos.includes('t') ? { top: -20 } : { bottom: -20 }),

                                        width: 40,
                                        height: 40,
                                        cursor: handle.cursor,
                                        zIndex: 50,
                                    }}
                                    className="flex items-center justify-center"
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <div className="w-4 h-4 bg-white border-2 border-slate-400 rounded-full shadow-lg hover:border-blue-500 hover:bg-blue-50 transition-colors" />
                                </motion.div>
                            ))}
                        </>
                    )}

                    <div className="relative pointer-events-none select-none">
                        <img
                            src={slideData.url}
                            className={`max-w-[85vw] max-h-[85vh] object-contain drop-shadow-2xl rounded-lg ${canDrag ? 'ring-2 ring-blue-500/0 group-hover:ring-blue-500/50 transition-all' : ''}`}
                            alt={`Anexo ${index + 1}`}
                            draggable={false}
                        />
                    </div>
                </motion.div>

                {/* Draggable Text Overlay */}
                {slideData.text && (
                    <motion.div
                        drag={canDrag}
                        dragMomentum={false}
                        onDragEnd={(_, info) => {
                            if (!canDrag) return;
                            const currentX = slideData.textPositionCoords?.x || 0;
                            const currentY = slideData.textPositionCoords?.y || 0;
                            onUpdate({
                                textPositionCoords: {
                                    x: currentX + info.offset.x,
                                    y: currentY + info.offset.y
                                }
                            });
                        }}
                        style={{
                            x: slideData.textPositionCoords?.x || 0,
                            y: slideData.textPositionCoords?.y || 0,
                            position: 'absolute',
                            zIndex: 30,
                            cursor: canDrag ? 'grab' : 'default',
                            left: 0,
                            right: 0,
                            ...(slideData.textPosition === 'top' ? { top: 0, paddingTop: '4rem' } :
                                slideData.textPosition === 'center' ? { top: '50%', transform: 'translateY(-50%)' } :
                                    { bottom: 0, paddingBottom: '4rem' })
                        }}
                        whileDrag={{ cursor: 'grabbing', scale: 1.02 }}
                        // True transparency: text-shadow only, no bg
                        className="text-center font-semibold pointer-events-auto text-slate-900 drop-shadow-xl"
                    >
                        <p className="text-3xl leading-relaxed max-w-5xl mx-auto select-none" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.8)' }}>
                            {slideData.text}
                        </p>
                    </motion.div>
                )}
            </div>

            {/* Footer Label */}
            <div className="absolute bottom-6 left-6 text-slate-400 text-sm font-medium z-10 pointer-events-none">
                Anexo {index + 1}
            </div>
        </SlideWrapper>
    );
};

export default SlideMedia;
