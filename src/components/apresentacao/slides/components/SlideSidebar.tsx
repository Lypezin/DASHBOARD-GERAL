
import React, { useRef, useState } from 'react';
import { usePresentationEditor } from '../../ApresentacaoPreview';
import { GripVertical, Plus, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { MediaSlideData } from '@/types/presentation';

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

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');

    const startEditing = (id: string, currentTitle: string) => {
        setEditingId(id);
        setEditTitle(currentTitle);
    };

    const saveTitle = (id: string) => {
        if (onUpdateMediaSlide) {
            onUpdateMediaSlide(id, { title: editTitle });
        }
        setEditingId(null);
    };

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
                <div className="p-3 space-y-2">
                    {displaySlides.map((slide, index) => {
                        const isActive = index === currentSlideIndex;
                        const isMediaSlide = slide.key.startsWith('media-');
                        const mediaId = isMediaSlide ? slide.key.replace('media-', '') : null;
                        const mediaData = mediaId ? mediaSlides.find(m => m.id === mediaId) : null;
                        const displayName = mediaData?.title || formatSlideLabel(slide.key);

                        const isEditingThis = isMediaSlide && editingId === mediaId;

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
                                    group flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none relative pr-8
                                    ${isActive
                                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                                        : 'bg-white border-transparent hover:border-slate-200 hover:shadow-sm'}
                                `}
                            >
                                <div className="text-slate-400 cursor-grab active:cursor-grabbing p-1 hover:text-slate-600 rounded">
                                    <GripVertical className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    {isEditingThis ? (
                                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                            <Input
                                                value={editTitle}
                                                onChange={e => setEditTitle(e.target.value)}
                                                className="h-6 text-xs px-1"
                                                autoFocus
                                                onBlur={() => saveTitle(mediaId!)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') saveTitle(mediaId!);
                                                    if (e.key === 'Escape') setEditingId(null);
                                                }}
                                            />
                                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-emerald-600" onClick={() => saveTitle(mediaId!)}><Check className="w-3 h-3" /></Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between group/title">
                                            <p className={`text-sm font-medium truncate ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>
                                                {displayName}
                                            </p>
                                            {isMediaSlide && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-5 w-5 p-0 opacity-0 group-hover/title:opacity-100 text-slate-400 hover:text-blue-500"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        startEditing(mediaId!, displayName);
                                                    }}
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-[10px] text-slate-400">Slide {index + 1}</p>
                                </div>

                                {/* Delete Button for Custom Slides */}
                                {isMediaSlide && onDeleteMediaSlide && (
                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (mediaId && confirm('Excluir este slide?')) {
                                                    onDeleteMediaSlide(mediaId);
                                                }
                                            }}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
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
