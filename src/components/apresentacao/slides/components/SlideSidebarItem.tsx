import React, { useState } from 'react';
import { 
    GripVertical, X, Home, Activity, MapPin, Calendar, Award, Sparkles, Building2, HelpCircle, Image as ImageIcon, SunMoon, Navigation, ShoppingBag, Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MediaSlideData } from '@/types/presentation';
import { SlideSidebarItemEdit } from './item/SlideSidebarItemEdit';
import { SlideSidebarItemDisplay } from './item/SlideSidebarItemDisplay';

interface SlideSidebarItemProps {
    slideKey: string; index: number; displayName: string; isActive: boolean; isMediaSlide: boolean; mediaId: string | null;
    onSelect: (index: number) => void; onDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
    onDragEnter: (e: React.DragEvent<HTMLDivElement>, index: number) => void; onDragEnd: () => void;
    onUpdateMediaSlide?: (id: string, updates: Partial<MediaSlideData>) => void; onDelete?: (id: string) => void;
}

const getSlideIcon = (key: string) => {
    const iconClass = "w-4 h-4";
    if (key === 'capa') return <Home className={iconClass} />;
    if (key === 'aderencia-geral') return <Activity className={iconClass} />;
    if (key.startsWith('sub-pracas') || key === 'sub-pracas') return <MapPin className={iconClass} />;
    if (key === 'aderencia-diaria') return <Calendar className={iconClass} />;
    if (key.startsWith('turnos')) return <SunMoon className={iconClass} />;
    if (key.startsWith('origens') || key === 'origens' || key === 'media-origens') return <Navigation className={iconClass} />;
    if (key === 'demanda' || key.startsWith('demanda')) return <ShoppingBag className={iconClass} />;
    if (key === 'ranking') return <Award className={iconClass} />;
    if (key === 'resumo-ia' || key === 'smart-summary') return <Brain className={iconClass} />;
    if (key === 'utr') return <Building2 className={iconClass} />;
    if (key.startsWith('media-')) return <ImageIcon className={iconClass} />;
    return <HelpCircle className={iconClass} />;
};

export const SlideSidebarItem: React.FC<SlideSidebarItemProps> = React.memo(({
    slideKey, index, displayName, isActive, isMediaSlide, mediaId,
    onSelect, onDragStart, onDragEnter, onDragEnd, onUpdateMediaSlide, onDelete
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');

    const startEditing = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditTitle(displayName);
        setIsEditing(true);
    };

    const saveTitle = (e?: React.MouseEvent | React.KeyboardEvent) => {
        e?.stopPropagation();
        if (mediaId && onUpdateMediaSlide && editTitle.trim()) {
            onUpdateMediaSlide(mediaId, { title: editTitle });
        }
        setIsEditing(false);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (mediaId && onDelete && confirm('Excluir este slide?')) {
            onDelete(mediaId);
        }
    };

    const handleSelect = () => {
        onSelect(index);
    };

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragEnter={(e) => onDragEnter(e, index)}
            onDragOver={(e) => e.preventDefault()}
            onDragEnd={onDragEnd}
            className="w-auto md:w-full"
        >
            <div
                onClick={handleSelect}
                className={`
                    group flex min-w-64 md:min-w-0 items-center gap-3 p-3.5 rounded-xl border cursor-pointer select-none relative pr-8
                    transform transition-all duration-150 ease-in-out motion-safe:md:hover:translate-x-1 hover:shadow-sm
                    ${isActive
                        ? 'bg-blue-50/80 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/60 shadow-sm ring-1 ring-blue-500/20 motion-safe:scale-[1.01]'
                        : 'bg-white border-slate-100 dark:bg-slate-900/50 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 hover:shadow-sm motion-safe:hover:scale-[1.01] motion-safe:active:scale-[0.99]'}
                `}
            >
                {/* Active glowing indicator line */}
                {isActive && (
                    <div 
                        className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-blue-500 dark:bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                    />
                )}

                <div className="text-slate-400 dark:text-slate-500 cursor-grab active:cursor-grabbing p-0.5 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors">
                    <GripVertical className="w-3.5 h-3.5" />
                </div>

                {/* Visual Icon Badge */}
                <div className={`p-1.5 rounded-lg shrink-0 transition-colors duration-200 ${isActive ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400'}`}>
                    {getSlideIcon(slideKey)}
                </div>

                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <SlideSidebarItemEdit
                            editTitle={editTitle}
                            setEditTitle={setEditTitle}
                            saveTitle={saveTitle}
                            cancelEdit={() => setIsEditing(false)}
                        />
                    ) : (
                        <SlideSidebarItemDisplay
                            displayName={displayName}
                            isActive={isActive}
                            isMediaSlide={isMediaSlide}
                            onUpdateTitle={onUpdateMediaSlide ? (id, title) => onUpdateMediaSlide(id, { title }) : undefined}
                            startEditing={startEditing}
                        />
                    )}
                    <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">
                        Slide {index + 1}
                    </p>
                </div>

                {/* Delete Button */}
                {isMediaSlide && onDelete && (
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={handleDelete}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
});

SlideSidebarItem.displayName = 'SlideSidebarItem';
