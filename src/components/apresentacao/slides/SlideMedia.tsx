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

    // Normalizing elements: if legacy data exists, convert to elements on the fly for rendering
    const elements = slideData.elements || [];
    if (elements.length === 0 && slideData.url) {
        const legacyData = slideData as any;
        elements.push({
            id: 'legacy-img',
            type: 'image',
            content: slideData.url,
            position: legacyData.imagePosition || { x: 0, y: 0 },
            scale: legacyData.scale || 1
        });
    }
    if (elements.length <= 1 && slideData.text) { // Check <= 1 so we don't duplicate if we just added legacy img
        const legacyData = slideData as any;
        elements.push({
            id: 'legacy-text',
            type: 'text',
            content: slideData.text,
            position: legacyData.textPositionCoords || { x: 0, y: 0 }
        });
    }

    const handleUpdateElement = (elId: string, updates: any) => {
        if (!onUpdate) return;

        const newElements = [...(slideData.elements || [])];

        // Handle migration from legacy if needed during first interaction
        if (newElements.length === 0 && (slideData.url || slideData.text)) {
            // We are interacting with a legacy slide, we should convert it fully now?
            // No, let's just stick to updating the array if it exists, or create it.
            // Simplest: If we are here, we should have a reliable way to update.
            // For now, let's assume we are fully migrated or the Sidebar created elements.
            // If we are editing "legacy" props via the new array...
        }

        const elIndex = newElements.findIndex(e => e.id === elId);
        if (elIndex >= 0) {
            newElements[elIndex] = { ...newElements[elIndex], ...updates };
            onUpdate({ elements: newElements });
        }
    };

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
                {elements.map((el) => {
                    if (el.type === 'image') {
                        return (
                            <motion.div
                                key={el.id}
                                drag={canDrag}
                                dragMomentum={false}
                                onDragEnd={(_, info) => {
                                    if (!canDrag) return;
                                    handleUpdateElement(el.id, {
                                        position: {
                                            x: (el.position?.x || 0) + info.offset.x,
                                            y: (el.position?.y || 0) + info.offset.y
                                        }
                                    });
                                }}
                                style={{
                                    x: el.position?.x || 0,
                                    y: el.position?.y || 0,
                                    scale: el.scale || 1,
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    cursor: canDrag ? 'grab' : 'default',
                                    touchAction: 'none',
                                    transformOrigin: 'center center'
                                }}
                                whileDrag={{ cursor: 'grabbing', scale: (el.scale || 1) * 1.02 }}
                                className="flex items-center justify-center group"
                            >
                                {/* 4 Resize Handles */}
                                {canDrag && (
                                    <>
                                        {[
                                            { pos: 'tl', cursor: 'nwse-resize', sensitivity: -1 },
                                            { pos: 'tr', cursor: 'nesw-resize', sensitivity: 1 },
                                            { pos: 'bl', cursor: 'nesw-resize', sensitivity: -1 },
                                            { pos: 'br', cursor: 'nwse-resize', sensitivity: 1 }
                                        ].map((handle) => (
                                            <motion.div
                                                key={handle.pos}
                                                drag="x"
                                                dragMomentum={false}
                                                dragPropagation={false}
                                                onDrag={(_, info) => {
                                                    const currentScale = el.scale || 1;
                                                    const sensitivity = (0.005 / currentScale) * handle.sensitivity;
                                                    const newScale = Math.max(0.1, Math.min(5.0, (el.scale || 1) + info.delta.x * sensitivity));
                                                    handleUpdateElement(el.id, { scale: newScale });
                                                }}
                                                onDragEnd={() => { }}
                                                dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
                                                style={{
                                                    position: 'absolute',
                                                    width: 40,
                                                    height: 40,
                                                    cursor: handle.cursor,
                                                    zIndex: 50,
                                                    left: handle.pos.includes('l') ? -20 : undefined,
                                                    right: handle.pos.includes('r') ? -20 : undefined,
                                                    top: handle.pos.includes('t') ? -20 : undefined,
                                                    bottom: handle.pos.includes('b') ? -20 : undefined,
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
                                        src={el.content}
                                        className={`max-w-[85vw] max-h-[85vh] object-contain drop-shadow-2xl rounded-lg ${canDrag ? 'ring-2 ring-blue-500/0 group-hover:ring-blue-500/50 transition-all' : ''}`}
                                        alt="Slide Element"
                                        draggable={false}
                                    />
                                </div>
                            </motion.div>
                        );
                    } else if (el.type === 'text') {
                        return (
                            <motion.div
                                key={el.id}
                                drag={canDrag}
                                dragMomentum={false}
                                onDragEnd={(_, info) => {
                                    if (!canDrag) return;
                                    handleUpdateElement(el.id, {
                                        position: {
                                            x: (el.position?.x || 0) + info.offset.x,
                                            y: (el.position?.y || 0) + info.offset.y
                                        }
                                    });
                                }}
                                style={{
                                    x: el.position?.x || 0,
                                    y: el.position?.y || 0,
                                    position: 'absolute',
                                    zIndex: 30,
                                    cursor: canDrag ? 'grab' : 'default',
                                    left: '50%', // Center default
                                    top: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    minWidth: '300px'
                                }}
                                whileDrag={{ cursor: 'grabbing', scale: 1.02 }}
                                className="text-center font-semibold pointer-events-auto text-slate-900 drop-shadow-xl"
                            >
                                <p className="text-3xl leading-relaxed select-none whitespace-pre-wrap" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.8)' }}>
                                    {el.content}
                                </p>
                            </motion.div>
                        );
                    }
                    return null;
                })}
            </div>

            {/* Footer Label */}
            <div className="absolute bottom-6 left-6 text-slate-400 text-sm font-medium z-10 pointer-events-none">
                Slide {index + 1}
            </div>
        </SlideWrapper>
    );
};

export default SlideMedia;
