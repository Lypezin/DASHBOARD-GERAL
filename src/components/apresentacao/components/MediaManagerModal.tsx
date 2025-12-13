import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon } from 'lucide-react';
import { MediaSlideData } from '@/types/presentation';
import { MediaManagerSidebar } from './MediaManagerSidebar';
import { MediaManagerEditor } from './MediaManagerEditor';

interface MediaManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    mediaSlides: MediaSlideData[];
    onUpdateSlides: (slides: MediaSlideData[]) => void;
}

export const MediaManagerModal: React.FC<MediaManagerModalProps> = ({
    isOpen,
    onClose,
    mediaSlides,
    onUpdateSlides,
}) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const selectedSlide = mediaSlides.find(s => s.id === selectedId);

    const handleUpdateSelected = (updates: Partial<MediaSlideData>) => {
        if (!selectedId) return;
        const newSlides = mediaSlides.map(slide =>
            slide.id === selectedId ? { ...slide, ...updates } : slide
        );
        onUpdateSlides(newSlides);
    };

    const handleDelete = (id: string) => {
        const newSlides = mediaSlides.filter(s => s.id !== id);
        onUpdateSlides(newSlides);
        if (selectedId === id) {
            setSelectedId(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-slate-950">
                <DialogHeader className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        Gerenciar Mídias e Fotos
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-1 overflow-hidden">
                    <MediaManagerSidebar
                        mediaSlides={mediaSlides}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onUpdateSlides={onUpdateSlides}
                        onDelete={handleDelete}
                    />

                    <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-950 p-6 overflow-hidden">
                        <MediaManagerEditor
                            selectedSlide={selectedSlide}
                            onUpdate={handleUpdateSelected}
                        />
                    </div>
                </div>

                <DialogFooter className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <Button onClick={onClose} size="lg" className="w-full md:w-auto min-w-[120px]">
                        Concluir
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
