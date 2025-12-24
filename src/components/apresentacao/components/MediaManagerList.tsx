
import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Image as ImageIcon } from 'lucide-react';
import { MediaSlideData } from '@/types/presentation';

interface MediaManagerListProps {
    mediaSlides: MediaSlideData[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
}

export const MediaManagerList: React.FC<MediaManagerListProps> = ({
    mediaSlides,
    selectedId,
    onSelect,
    onDelete
}) => {
    return (
        <div className="p-2 space-y-2">
            {mediaSlides.map((slide, index) => {
                // Find first image for thumbnail
                const firstImage = slide.elements?.find(el => el.type === 'image');
                const previewUrl = firstImage ? firstImage.content : slide.url; // Fallback to legacy

                return (
                    <div
                        key={slide.id}
                        onClick={() => onSelect(slide.id)}
                        className={`p-2 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${selectedId === slide.id ? 'bg-blue-100 dark:bg-blue-900/30 ring-1 ring-blue-500' : 'hover:bg-slate-200 dark:hover:bg-slate-800 group'}`}
                    >
                        <div className="w-12 h-12 rounded bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                            {previewUrl ? (
                                <img src={previewUrl} className="w-full h-full object-cover" alt="" />
                            ) : (
                                <ImageIcon className="w-6 h-6 text-slate-400" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">Slide #{index + 1}</p>
                            <p className="text-xs text-slate-500 truncate">
                                {slide.elements?.length || 0} elementos
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(slide.id);
                            }}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                );
            })}
            {mediaSlides.length === 0 && (
                <div className="text-center p-4 text-slate-500 text-sm">
                    Nenhuma mídia adicionada.
                </div>
            )}
        </div>
    );
};
