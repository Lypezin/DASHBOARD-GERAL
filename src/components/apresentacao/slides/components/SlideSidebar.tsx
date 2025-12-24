import React, { useRef } from 'react';
import { usePresentationEditor } from '../../context/PresentationEditorContext';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MediaSlideData } from '@/types/presentation';
import { SlideSidebarItem } from './SlideSidebarItem';
import { SlideSidebarList } from './SlideSidebarList';

interface SlideSidebarProps {
    slides: Array<{ key: string; render: (visible: boolean) => React.ReactNode }>;
    currentSlideIndex: number;
    onSlideSelect: (index: number) => void;
    // Media Props
    mediaSlides?: MediaSlideData[];
    onUpdateMediaSlide?: (id: string, updates: Partial<MediaSlideData>) => void;
    onAddMediaSlide?: () => void;
    onDeleteMediaSlide?: (id: string) => void;
}

export const SlideSidebar: React.FC<SlideSidebarProps> = ({
    slides,
    currentSlideIndex,
    onSlideSelect,
    mediaSlides = [],
    onUpdateMediaSlide,
    onAddMediaSlide,
    onDeleteMediaSlide
}) => {
    const { slideOrder, moveSlide } = usePresentationEditor();
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    // Create a map for quick lookup
    const slidesMap = slides.reduce((acc, slide) => {
        acc[slide.key] = slide;
        return acc;
    }, {} as Record<string, { key: string }>);

    // Valid ordered slides
    const orderedMiddleware = slideOrder.filter(key => slidesMap[key]).map(key => slidesMap[key]);
    const unorderedSlides = slides.filter(s => !slideOrder.includes(s.key));
    const displaySlides = [...orderedMiddleware, ...unorderedSlides];

    const onDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragItem.current = position;
        e.dataTransfer.effectAllowed = "move";
    };

    const onDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragOverItem.current = position;
        e.preventDefault();
        if (dragItem.current !== null && dragItem.current !== position) {
            moveSlide(dragItem.current, position);
            dragItem.current = position;
        }
    };

    const onDragEnd = () => {
        dragItem.current = null;
        dragOverItem.current = null;
    };

    return (
        <div className="w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Slides</h3>
                {onAddMediaSlide && (
                    <Button variant="outline" size="sm" onClick={onAddMediaSlide} className="h-7 w-7 p-0 rounded-full hover:bg-blue-50 hover:text-blue-600" title="Adicionar Novo Slide">
                        <Plus className="w-4 h-4" />
                    </Button>
                )}
            </div>

            <ScrollArea className="flex-1">
                <SlideSidebarList
                    displaySlides={displaySlides}
                    currentSlideIndex={currentSlideIndex}
                    mediaSlides={mediaSlides}
                    onSlideSelect={onSlideSelect}
                    onDragStart={onDragStart}
                    onDragEnter={onDragEnter}
                    onDragEnd={onDragEnd}
                    onUpdateMediaSlide={onUpdateMediaSlide}
                    onDeleteMediaSlide={onDeleteMediaSlide}
                />
            </ScrollArea>
        </div>
    );
};
