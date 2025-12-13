import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Plus } from 'lucide-react';
import { MediaSlideData } from '@/types/presentation';

interface MediaManagerSidebarProps {
    mediaSlides: MediaSlideData[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onUpdateSlides: (slides: MediaSlideData[]) => void;
    onDelete: (id: string) => void;
}

export const MediaManagerSidebar: React.FC<MediaManagerSidebarProps> = ({
    mediaSlides,
    selectedId,
    onSelect,
    onUpdateSlides,
    onDelete
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const processFile = (file: File): Promise<MediaSlideData> => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        resolve({
                            id: crypto.randomUUID(),
                            url: e.target?.result as string,
                            scale: 1,
                            text: '',
                            textPosition: 'bottom'
                        });
                    };
                    reader.readAsDataURL(file);
                });
            };

            Promise.all(Array.from(e.target.files).map(processFile)).then(slides => {
                const newSlides = [...mediaSlides, ...slides];
                onUpdateSlides(newSlides);
                // Auto-select first new slide if none selected
                if (slides.length > 0 && !selectedId) {
                    onSelect(slides[0].id);
                }
            });
        }
    };

    return (
        <div className="w-64 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-900/50">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                />
                <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Fotos
                </Button>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-2">
                    {mediaSlides.map((slide, index) => (
                        <div
                            key={slide.id}
                            onClick={() => onSelect(slide.id)}
                            className={`p-2 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${selectedId === slide.id ? 'bg-blue-100 dark:bg-blue-900/30 ring-1 ring-blue-500' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                        >
                            <div className="w-12 h-12 rounded bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0">
                                <img src={slide.url} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">Mídia #{index + 1}</p>
                                <p className="text-xs text-slate-500 truncate">{slide.text || 'Sem legenda'}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-slate-400 hover:text-red-500"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(slide.id);
                                }}
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                    ))}
                    {mediaSlides.length === 0 && (
                        <div className="text-center p-4 text-slate-500 text-sm">
                            Nenhuma mídia adicionada.
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};
