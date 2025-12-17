import React, { useRef } from 'react';
import { MediaSlideData, SlideElement } from '@/types/presentation';
import SlideWrapper from '../SlideWrapper';
import { usePresentationContext } from '@/contexts/PresentationContext';
import { usePresentationEditor } from '../context/PresentationEditorContext';
import { SlideElementItem } from './components/SlideElementItem';

interface SlideMediaProps {
    isVisible: boolean;
    slideData: MediaSlideData;
    index: number;
    onUpdate?: (updates: Partial<MediaSlideData>) => void;
}

const SlideMedia: React.FC<SlideMediaProps> = ({ isVisible, slideData, index, onUpdate }) => {
    const { isWebMode } = usePresentationContext();
    const containerRef = useRef<HTMLDivElement>(null);
    const { selectedElementId, setSelectedElementId } = usePresentationEditor();

    const canDrag = !isWebMode && !!onUpdate;

    // Normalizing elements (legacy support)
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

    if (elements.length <= 1 && slideData.text) {
        const legacyData = slideData as any;
        elements.push({
            id: 'legacy-text',
            type: 'text',
            content: slideData.text,
            position: legacyData.textPositionCoords || { x: 0, y: 0 }
        });
    }

    const handleUpdateElement = (elId: string, updates: Partial<SlideElement>) => {
        if (!onUpdate) return;
        const newElements = [...(slideData.elements || [])];
        const elIndex = newElements.findIndex(e => e.id === elId);
        if (elIndex >= 0) {
            newElements[elIndex] = { ...newElements[elIndex], ...updates };
            onUpdate({ elements: newElements });
        }
    };

    return (
        <SlideWrapper
            isVisible={isVisible}
            style={{ padding: 0, backgroundColor: '#ffffff' }}
            onClick={() => canDrag && setSelectedElementId(null)}
        >
            <div ref={containerRef} className="w-full h-full relative bg-white">
                {elements.map((el) => (
                    <SlideElementItem
                        key={el.id}
                        element={el}
                        canDrag={canDrag}
                        isSelected={selectedElementId === el.id}
                        onSelect={setSelectedElementId}
                        onUpdate={handleUpdateElement}
                    />
                ))}
            </div>
            <div className="absolute bottom-6 left-6 text-slate-400 text-sm font-medium z-10 pointer-events-none">
                Slide {index + 1}
            </div>
        </SlideWrapper>
    );
};

export default SlideMedia;
