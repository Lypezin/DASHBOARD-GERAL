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
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        cursor: canDrag ? 'grab' : 'default',
                        touchAction: 'none'
                    }}
                    whileDrag={{ cursor: 'grabbing', scale: 1.02 }}
                    className="flex items-center justify-center origin-center group"
                >
                    {/* Resize Handle */}
                    {canDrag && (
                        <motion.div
                            drag
                            dragMomentum={false}
                            dragPropagation={false}
                            onDrag={(_, info) => {
                                const sensitivity = 0.005;
                                const newScale = Math.max(0.1, Math.min(5.0, slideData.scale + info.delta.x * sensitivity));
                                onUpdate({ scale: newScale });
                            }}
                            // Reset position after drag so it stays at the corner
                            onDragEnd={() => { }}
                            style={{
                                position: 'absolute',
                                bottom: -20,
                                right: -20,
                                width: 40,
                                height: 40,
                                cursor: 'nwse-resize',
                                zIndex: 50,
                            }}
                            className="flex items-center justify-center"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <div className="w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-lg hover:bg-blue-600 transition-colors" />
                        </motion.div>
                    )}

                    <div
                        className="relative transition-transform duration-75 ease-out"
                        style={{
                            transform: `scale(${slideData.scale})`,
                        }}
                    >
                        <img
                            src={slideData.url}
                            className={`max-w-[85vw] max-h-[85vh] object-contain drop-shadow-2xl rounded-lg pointer-events-none select-none ${canDrag ? 'ring-2 ring-blue-500/0 group-hover:ring-blue-500/50 transition-all' : ''}`}
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
                            // Use legacy positioning
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
