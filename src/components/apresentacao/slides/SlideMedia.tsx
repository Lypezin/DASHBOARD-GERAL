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
                        // Calculate new position relative to current
                        // We use the point relative to the parent? 
                        // Actually, x/y in framer motion are transforms. 
                        // We want to accumulate them?
                        // Simplest: Just save the `x, y` from style + delta?
                        // Framer motion 'style={{ x, y }}' works if we provide it.

                        // We get the final position from info.point or we just rely on visual drag
                        // and save the offset.
                        // Ideally we save the `x` and `y` translation values.

                        // Current logic: use current stored x/y + displacement
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
                        // Use x/y for position, but we needed initial centering.
                        // Translate -50% -50% centers it. Then x/y adds offset.
                        transform: 'translate(-50%, -50%)',
                        cursor: canDrag ? 'grab' : 'default',
                        touchAction: 'none'
                    }}
                    whileDrag={{ cursor: 'grabbing', scale: 1.02 }}
                    className="flex items-center justify-center origin-center"
                >
                    <div
                        className="relative transition-transform duration-500 ease-out"
                        style={{
                            transform: `scale(${slideData.scale})`,
                        }}
                    >
                        <img
                            src={slideData.url}
                            className="max-w-[85vw] max-h-[85vh] object-contain drop-shadow-2xl rounded-lg pointer-events-none select-none"
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
                            // Initial position based on "textPosition" legacy prop
                            // If we have coords, those take precedence via x/y translation?
                            // No, ideally we want to start from the legacy position and add offset.
                            // BUT "bottom", "top" are layout constraints.
                            // If user drags, we are breaking out of layout constraints.
                            // For simplicity: If user has coords, we essentially position absolutely relative to center or top-left?
                            // Let's stick to 'top: 0, left: 0' and full x/y control?
                            // Or better: Keep the base layout logic for initial render, and x/y translates from there?
                            // Let's try: Position based on legacy, then translate x/y.
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
                        className={`text-center font-semibold pointer-events-auto
                            ${slideData.textPosition === 'top' ? 'bg-gradient-to-b from-white/90 to-transparent' :
                                slideData.textPosition === 'center' ? 'bg-white/80 backdrop-blur-sm py-12' :
                                    'bg-gradient-to-t from-white/90 to-transparent'
                            }
                        `}
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
