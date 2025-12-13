
import React, { useRef } from 'react';
import { usePresentationEditor } from '../../ApresentacaoPreview';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SlideSidebarProps {
    slides: Array<{ key: string; title?: string }>; // Minimal info needed
    currentSlideIndex: number;
    onSlideSelect: (index: number) => void;
}

export const SlideSidebar: React.FC<SlideSidebarProps> = ({ slides, currentSlideIndex, onSlideSelect }) => {
    const { slideOrder, moveSlide } = usePresentationEditor();
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    // Filter slides based on current order
    // But wait, 'slides' prop comes from parent which might be unordered?
    // We should map 'slideOrder' to the actual slide data.

    // Create a map for quick lookup
    const slidesMap = slides.reduce((acc, slide) => {
        acc[slide.key] = slide;
        return acc;
    }, {} as Record<string, { key: string; title?: string }>);

    // Valid ordered slides (intersection of order and available slides)
    const orderedMiddleware = slideOrder.filter(key => slidesMap[key]).map(key => slidesMap[key]);
    // Add any new slides that might not be in order yet (append them)
    const unorderedSlides = slides.filter(s => !slideOrder.includes(s.key));
    const displaySlides = [...orderedMiddleware, ...unorderedSlides];

    const onDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragItem.current = position;
        e.dataTransfer.effectAllowed = "move";
        // Ghost image styling if needed
    };

    const onDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragOverItem.current = position;
        e.preventDefault();

        // Optional: Live reorder preview (can be jittery without specialized lib)
        // For HTML5 simple implementation, we usually reorder onDrop, 
        // or reorder carefully with throttling. 
        // Let's stick to onDrop for stability first, or simple swap.
        // Actually, immediate feedback is better.
        if (dragItem.current !== null && dragItem.current !== position) {
            moveSlide(dragItem.current, position);
            dragItem.current = position; // Update drag index to new position
        }
    };

    const onDragEnd = () => {
        dragItem.current = null;
        dragOverItem.current = null;
    };

    return (
        <div className="w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Slides</h3>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                    {displaySlides.map((slide, index) => {
                        const isActive = index === currentSlideIndex;
                        return (
                            <div
                                key={slide.key}
                                draggable
                                onDragStart={(e) => onDragStart(e, index)}
                                onDragEnter={(e) => onDragEnter(e, index)}
                                onDragOver={(e) => e.preventDefault()}
                                onDragEnd={onDragEnd}
                                onClick={() => onSlideSelect(index)}
                                className={`
                                    group flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none
                                    ${isActive
                                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                                        : 'bg-white border-transparent hover:border-slate-200 hover:shadow-sm'}
                                `}
                            >
                                <div className="text-slate-400 cursor-grab active:cursor-grabbing p-1 hover:text-slate-600 rounded">
                                    <GripVertical className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>
                                        {/* Since we don't have titles in the 'slides' array objects directly usually (it's in the component), 
                                           we might need to map keys to readable labels or pass titles. 
                                           For now, using key as fallback or we can improve this mapping later. */}
                                        {formatSlideLabel(slide.key)}
                                    </p>
                                    <p className="text-[10px] text-slate-400">Slide {index + 1}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
};

// Helper for labels
function formatSlideLabel(key: string): string {
    const labels: Record<string, string> = {
        'capa': 'Capa',
        'aderencia-geral': 'Aderência Geral',
        'sub-pracas': 'Sub-Praças',
        'aderencia-diaria': 'Por Dia',
        'turnos': 'Turnos',
        'origens': 'Origens',
        'demanda': 'Demanda',
        'ranking': 'Ranking',
        'smart-summary': 'Resumo IA',
        'entregadores-overview': 'Entregadores',
        'financeiro': 'Financeiro',
        'marketing': 'Marketing'
    };
    return labels[key] || key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
