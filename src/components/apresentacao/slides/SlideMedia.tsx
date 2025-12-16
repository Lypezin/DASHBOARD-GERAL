
import React, { useRef, useState, useEffect } from 'react';
import { MediaSlideData, SlideElement } from '@/types/presentation';
import SlideWrapper from '../SlideWrapper';
import { motion } from 'framer-motion';
import { usePresentationContext } from '@/contexts/PresentationContext';
import { usePresentationEditor } from '../context/PresentationEditorContext';
import { SLIDE_HEIGHT, SLIDE_WIDTH } from './../constants';

interface SlideMediaProps {
    isVisible: boolean;
    slideData: MediaSlideData;
    index: number;
    onUpdate?: (updates: Partial<MediaSlideData>) => void;
}

const SlideMedia: React.FC<SlideMediaProps> = ({ isVisible, slideData, index, onUpdate }) => {
    const { isWebMode } = usePresentationContext();
    const containerRef = useRef<HTMLDivElement>(null);
    const editorContext = usePresentationEditor(); // Logic relies on provider existing up tree

    const canDrag = !isWebMode && !!onUpdate;

    // Normalizing elements: if legacy data exists, convert to elements on the fly for rendering
    const elements = slideData.elements || [];
    console.log('[SlideMedia] ID:', slideData.id, 'isVisible:', isVisible, 'Index:', index, 'Elements:', elements.length);

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

    const { selectedElementId, setSelectedElementId } = editorContext;

    const handleUpdateElement = (elId: string, updates: Partial<SlideElement>) => {
        if (!onUpdate) return;

        const newElements = [...(slideData.elements || [])];

        // Handle migration from legacy if needed (simple check)
        if (newElements.length === 0 && (slideData.url || slideData.text)) {
            // If we modify legacy items, we should probably initialize the elements array properly first.
            // For now, let's assume we are mostly using new data structures.
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
                backgroundColor: '#ffffff'
            }}
            // Deselect on click background
            onClick={() => canDrag && setSelectedElementId(null)}
        >
            {/* Main Container */}

            <div ref={containerRef} className="w-full h-full relative bg-white">
                {elements.map((el) => {
                    const isSelected = selectedElementId === el.id;

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
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (canDrag) setSelectedElementId(el.id);
                                }}
                                style={{
                                    x: el.position?.x || 0,
                                    y: el.position?.y || 0,
                                    scale: el.scale || 1,
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    // transform removed to avoid conflict with x/y
                                    cursor: canDrag ? 'grab' : 'default',
                                    touchAction: 'none',
                                    transformOrigin: 'center center',
                                    zIndex: isSelected ? 50 : 10
                                }}
                                whileDrag={{ cursor: 'grabbing', scale: (el.scale || 1) * 1.02 }}
                                className="flex items-center justify-center group"
                            >
                                {/* Resize Handles - Show when Selected */}
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
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    const startX = e.clientX;
                                                    const startScale = el.scale || 1;

                                                    const onPointerMove = (moveEvent: PointerEvent) => {
                                                        const currentScale = startScale;
                                                        const deltaX = moveEvent.clientX - startX;
                                                        const sensitivity = (0.005 / currentScale) * handle.sensitivity;
                                                        const newScale = Math.max(0.1, Math.min(5.0, startScale + deltaX * sensitivity));
                                                        handleUpdateElement(el.id, { scale: newScale });
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
                                                    width: 24,
                                                    height: 24,
                                                    cursor: handle.cursor,
                                                    zIndex: 100,
                                                    left: handle.pos.includes('l') ? -12 : undefined,
                                                    right: handle.pos.includes('r') ? -12 : undefined,
                                                    top: handle.pos.includes('t') ? -12 : undefined,
                                                    bottom: handle.pos.includes('b') ? -12 : undefined,
                                                }}
                                                className="flex items-center justify-center bg-white border-2 border-blue-500 rounded-full shadow-lg"
                                            />
                                        ))}
                                        {/* Box Border */}
                                        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
                                    </>
                                )}

                                <div className="relative pointer-events-none select-none">
                                    <img
                                        src={el.content}
                                        className={`max-w-[85vw] max-h-[85vh] object-contain drop-shadow-2xl rounded-lg`}
                                        alt="Slide Element"
                                        draggable={false}
                                    />
                                </div>
                            </motion.div>
                        );
                    } else if (el.type === 'text') {
                        return (
                            <div
                                key={el.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (canDrag) setSelectedElementId(el.id);
                                }}
                                style={{
                                    transform: `translate(-50%, -50%) translate(${el.position?.x || 0}px, ${el.position?.y || 0}px)`,
                                    position: 'absolute',
                                    zIndex: isSelected ? 50 : 30,
                                    cursor: canDrag ? 'grab' : 'default',
                                    left: '50%',
                                    top: '50%',
                                    minWidth: '300px'
                                }}
                            >
                                <div
                                    className={`relative p-2 text-center rounded focus:outline-none ${isSelected && canDrag ? 'ring-2 ring-blue-500 bg-blue-50/10' : ''}`}
                                >
                                    {/* Text Content */}
                                    <p
                                        className="text-3xl leading-relaxed whitespace-pre-wrap outline-none"
                                        style={{
                                            textShadow: '0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.8)',
                                            color: el.style?.color || '#0f172a',
                                            fontWeight: el.style?.fontWeight === 'bold' ? 'bold' : 'normal',
                                            fontStyle: el.style?.fontStyle === 'italic' ? 'italic' : 'normal',
                                            fontSize: el.style?.fontSize || '1.875rem', // 3xl
                                            backgroundColor: el.style?.bg || 'transparent',
                                        }}
                                        contentEditable={canDrag && isSelected}
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                            const newText = e.currentTarget.innerText;
                                            if (newText !== el.content) {
                                                handleUpdateElement(el.id, { content: newText });
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            e.stopPropagation();
                                        }}
                                    >
                                        {el.content}
                                    </p>

                                </div>
                            </div>
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
