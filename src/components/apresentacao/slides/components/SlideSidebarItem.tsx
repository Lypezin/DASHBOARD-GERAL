import React, { useState } from 'react';
import { GripVertical, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SlideSidebarItemProps {
    slideKey: string;
    index: number;
    displayName: string;
    isActive: boolean;
    isMediaSlide: boolean;
    mediaId: string | null;
    onSelect: () => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
    onDragEnter: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
    onDragEnd: () => void;
    onUpdateTitle?: (id: string, newTitle: string) => void;
    onDelete?: (id: string) => void;
}

export const SlideSidebarItem: React.FC<SlideSidebarItemProps> = ({
    slideKey,
    index,
    displayName,
    isActive,
    isMediaSlide,
    mediaId,
    onSelect,
    onDragStart,
    onDragEnter,
    onDragEnd,
    onUpdateTitle,
    onDelete
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
        if (mediaId && onUpdateTitle && editTitle.trim()) {
            onUpdateTitle(mediaId, editTitle);
        }
        setIsEditing(false);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (mediaId && onDelete && confirm('Excluir este slide?')) {
            onDelete(mediaId);
        }
    };

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragEnter={(e) => onDragEnter(e, index)}
            onDragOver={(e) => e.preventDefault()}
            onDragEnd={onDragEnd}
            onClick={onSelect}
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
                {isEditing ? (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <Input
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            className="h-6 text-xs px-1"
                            autoFocus
                            onBlur={() => saveTitle()}
                            onKeyDown={e => {
                                if (e.key === 'Enter') saveTitle(e);
                                if (e.key === 'Escape') setIsEditing(false);
                            }}
                        />
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-emerald-600" onClick={saveTitle}>
                            <Check className="w-3 h-3" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between group/title">
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>
                            {displayName}
                        </p>
                        {isMediaSlide && onUpdateTitle && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 opacity-0 group-hover/title:opacity-100 text-slate-400 hover:text-blue-500"
                                onClick={startEditing}
                            >
                                <Edit2 className="w-3 h-3" />
                            </Button>
                        )}
                    </div>
                )}
                <p className="text-[10px] text-slate-400">Slide {index + 1}</p>
            </div>

            {/* Delete Button */}
            {isMediaSlide && onDelete && (
                <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50"
                        onClick={handleDelete}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
};
