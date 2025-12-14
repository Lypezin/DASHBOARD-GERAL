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
                        scale: slideData.scale || 1, // Apply scale here!
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)', // This centers the element
                        cursor: canDrag ? 'grab' : 'default',
                        touchAction: 'none',
                        transformOrigin: 'center center'
                    }}
                    whileDrag={{ cursor: 'grabbing', scale: (slideData.scale || 1) * 1.02 }}
                    className="flex items-center justify-center group"
                >
                    {/* Resize Handle - Now inside scaled parent, will move with borders */}
                    {canDrag && (
                        <motion.div
                            drag
                            dragMomentum={false}
                            dragPropagation={false}
                            onDrag={(_, info) => {
                                // Dividing delta by current scale to maintain consistent sensitivity
                                const currentScale = slideData.scale || 1;
                                const sensitivity = 0.005 / currentScale;
                                const newScale = Math.max(0.1, Math.min(5.0, slideData.scale + info.delta.x * sensitivity));
                                onUpdate({ scale: newScale });
                            }}
                            onDragEnd={() => { }}
                            style={{
                                position: 'absolute',
                                bottom: -20,
                                right: -20,
                                width: 40,
                                height: 40,
                                cursor: 'nwse-resize',
                                zIndex: 50,
                                // We need to inverse scale the handle so it stays constant size visualy?
                                // Actually if parent scales, handle scales. This is usually desired for "zoom".
                                // If we want handle to stay fixed size while parent scales, we'd need inverse scale.
                                // For now let it scale, it's easier to grab.
                            }}
                            className="flex items-center justify-center"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <div className="w-5 h-5 bg-blue-500 border-2 border-white rounded-full shadow-lg hover:bg-blue-600 transition-colors" />
                        </motion.div>
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
                        className="text-center font-semibold pointer-events-auto text-slate-800 drop-shadow-md"
                    >
                        <p className="text-3xl leading-relaxed max-w-5xl mx-auto select-none">
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
