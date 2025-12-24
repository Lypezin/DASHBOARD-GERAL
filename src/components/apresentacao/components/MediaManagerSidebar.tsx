import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus } from 'lucide-react';
import { MediaSlideData } from '@/types/presentation';
import { MediaManagerList } from './MediaManagerList';

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
                            elements: [
                                {
                                    id: crypto.randomUUID(),
                                    type: 'image',
                                    content: e.target?.result as string,
                                    position: { x: 0, y: 0 },
                                    scale: 1
                                }
                            ]
                        });
                    };
                    reader.readAsDataURL(file);
                });
            };

            Promise.all(Array.from(e.target.files).map(processFile)).then(slides => {
                const newSlides = [...mediaSlides, ...slides];
                onUpdateSlides(newSlides);
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
                <MediaManagerList
                    mediaSlides={mediaSlides}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    onDelete={onDelete}
                />
            </ScrollArea>
        </div>
    );
};
