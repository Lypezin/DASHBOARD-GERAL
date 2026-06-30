import React from 'react';
import { SlideSidebarItem } from './SlideSidebarItem';
import { MediaSlideData } from '@/types/presentation';

interface SlideSidebarListProps {
    displaySlides: Array<{ key: string }>;
    currentSlideIndex: number;
    mediaSlidesById: Map<string, MediaSlideData>;
    onSlideSelect: (index: number) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, position: number) => void;
    onDragEnter: (e: React.DragEvent<HTMLDivElement>, position: number) => void;
    onDragEnd: () => void;
    onUpdateMediaSlide?: (id: string, updates: Partial<MediaSlideData>) => void;
    onDeleteMediaSlide?: (id: string) => void;
}

export const SlideSidebarList: React.FC<SlideSidebarListProps> = React.memo(({
    displaySlides,
    currentSlideIndex,
    mediaSlidesById,
    onSlideSelect,
    onDragStart,
    onDragEnter,
    onDragEnd,
    onUpdateMediaSlide,
    onDeleteMediaSlide
}) => {
    return (
        <div className="flex w-max gap-2 p-3 md:block md:w-auto md:space-y-2">
            {displaySlides.map((slide, index) => {
                const isMediaSlide = slide.key.startsWith('media-');
                const mediaId = isMediaSlide ? slide.key.replace('media-', '') : null;
                const mediaData = mediaId ? mediaSlidesById.get(mediaId) : null;
                const displayName = mediaData?.title || formatSlideLabel(slide.key);

                return (
                    <SlideSidebarItem
                        key={slide.key}
                        slideKey={slide.key}
                        index={index}
                        displayName={displayName}
                        isActive={index === currentSlideIndex}
                        isMediaSlide={isMediaSlide}
                        mediaId={mediaId}
                        onSelect={onSlideSelect}
                        onDragStart={onDragStart}
                        onDragEnter={onDragEnter}
                        onDragEnd={onDragEnd}
                        onUpdateMediaSlide={onUpdateMediaSlide}
                        onDelete={onDeleteMediaSlide}
                    />
                );
            })}
        </div>
    );
});

SlideSidebarList.displayName = 'SlideSidebarList';

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
        'marketing': 'Marketing',
        'utr': 'UTR',
    };

    return labels[key] || key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
