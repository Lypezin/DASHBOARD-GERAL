
import React from 'react';
import { SlideSidebarItem } from './SlideSidebarItem';
import { MediaSlideData } from '@/types/presentation';

interface SlideSidebarListProps {
    displaySlides: Array<{ key: string }>;
    currentSlideIndex: number;
    mediaSlides: MediaSlideData[];
    onSlideSelect: (index: number) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, position: number) => void;
    onDragEnter: (e: React.DragEvent<HTMLDivElement>, position: number) => void;
    onDragEnd: () => void;
    onUpdateMediaSlide?: (id: string, updates: Partial<MediaSlideData>) => void;
    onDeleteMediaSlide?: (id: string) => void;
}

export const SlideSidebarList: React.FC<SlideSidebarListProps> = ({
    displaySlides,
    currentSlideIndex,
    mediaSlides,
    onSlideSelect,
    onDragStart,
    onDragEnter,
    onDragEnd,
    onUpdateMediaSlide,
    onDeleteMediaSlide
}) => {
    return (
        <div className="p-3 space-y-2">
            {displaySlides.map((slide, index) => {
                const isMediaSlide = slide.key.startsWith('media-');
                const mediaId = isMediaSlide ? slide.key.replace('media-', '') : null;
                const mediaData = mediaId ? mediaSlides.find(m => m.id === mediaId) : null;
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
                        onSelect={() => onSlideSelect(index)}
                        onDragStart={onDragStart}
                        onDragEnter={onDragEnter}
                        onDragEnd={onDragEnd}
                        onUpdateTitle={
                            onUpdateMediaSlide
                                ? (id, title) => onUpdateMediaSlide(id, { title })
                                : undefined
                        }
                        onDelete={onDeleteMediaSlide}
                    />
                );
            })}
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
