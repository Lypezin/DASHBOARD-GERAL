import React, { useRef, useCallback, useMemo } from 'react';
import { usePresentationEditor } from '../../context/PresentationEditorContext';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MediaSlideData } from '@/types/presentation';
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

export const SlideSidebar: React.FC<SlideSidebarProps> = React.memo(({
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
    const slidesMap = useMemo(() => slides.reduce((acc, slide) => {
        acc[slide.key] = slide;
        return acc;
    }, {} as Record<string, { key: string }>), [slides]);

    const displaySlides = useMemo(() => {
        const orderedMiddleware = slideOrder.filter(key => slidesMap[key]).map(key => slidesMap[key]);
        const unorderedSlides = slides.filter(s => !slideOrder.includes(s.key));
        return [...orderedMiddleware, ...unorderedSlides];
    }, [slideOrder, slides, slidesMap]);

    const onDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragItem.current = position;
        e.dataTransfer.effectAllowed = "move";
    }, []);

    const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragOverItem.current = position;
        e.preventDefault();
        if (dragItem.current !== null && dragItem.current !== position) {
            moveSlide(dragItem.current, position);
            dragItem.current = position;
        }
    }, [moveSlide]);

    const onDragEnd = useCallback(() => {
        dragItem.current = null;
        dragOverItem.current = null;
    }, []);

    return (
        <div className="flex h-44 w-full min-w-0 shrink-0 flex-col overflow-hidden border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 md:h-full md:w-72 md:border-b-0 md:border-r">
            <div className="z-10 flex min-w-0 items-center justify-between gap-3 border-b border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 md:p-4">
                <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Preview</h3>
                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Arraste para ordenar os slides</p>
                </div>
                {onAddMediaSlide && (
                    <Button variant="outline" size="sm" onClick={onAddMediaSlide} className="h-7 w-7 p-0 rounded-full hover:bg-blue-50 hover:text-blue-600" title="Adicionar Novo Slide">
                        <Plus className="w-4 h-4" />
                    </Button>
                )}
            </div>

            <ScrollArea className="min-w-0 flex-1">
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
});

SlideSidebar.displayName = 'SlideSidebar';
