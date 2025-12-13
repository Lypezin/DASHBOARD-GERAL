import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Plus, Image as ImageIcon, Type, Maximize } from 'lucide-react';
import { MediaSlideData } from '@/types/presentation';

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
    const fileInputRef = useRef<HTMLInputElement>(null);

    const selectedSlide = mediaSlides.find(s => s.id === selectedId);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newSlides: MediaSlideData[] = Array.from(e.target.files).map(file => ({
                id: crypto.randomUUID(),
                url: URL.createObjectURL(file), // Using ObjectURL for preview, but might need DataURL for persistence if needed. DataURL is safer for this scope.
                scale: 1,
                text: '',
                textPosition: 'bottom'
            }));

            // Convert to DataURL to avoid blob revocation issues if we want simple persistence in memory
            // Actually for this session ObjectURL is fine, but let's stick to DataURL for consistency with previous implementation
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
                onUpdateSlides([...mediaSlides, ...slides]);
                if (slides.length > 0 && !selectedId) {
                    setSelectedId(slides[0].id);
                }
            });
        }
    };

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
                    {/* Sidebar List */}
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
                                        onClick={() => setSelectedId(slide.id)}
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
                                                handleDelete(slide.id);
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

                    {/* Editor Area */}
                    <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-950 p-6 overflow-hidden">
                        {selectedSlide ? (
                            <div className="flex flex-col h-full gap-6">
                                {/* Preview Container */}
                                <div className="flex-1 bg-black/90 rounded-lg overflow-hidden relative shadow-2xl border border-slate-700 flex items-center justify-center">
                                    <div
                                        className="relative transition-transform duration-200 ease-out"
                                        style={{
                                            transform: `scale(${selectedSlide.scale})`,
                                            maxWidth: '90%',
                                            maxHeight: '90%'
                                        }}
                                    >
                                        <img
                                            src={selectedSlide.url}
                                            alt="Preview"
                                            className="max-w-full max-h-full object-contain rounded"
                                        />
                                        {/* Text Overlay Preview */}
                                        {selectedSlide.text && (
                                            <div
                                                className={`absolute left-0 right-0 p-4 text-white text-center font-semibold text-shadow-sm pointer-events-none
                                                    ${selectedSlide.textPosition === 'top' ? 'top-0 pt-8 bg-gradient-to-b from-black/80 to-transparent' :
                                                        selectedSlide.textPosition === 'center' ? 'top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm py-8' :
                                                            'bottom-0 pb-8 bg-gradient-to-t from-black/80 to-transparent'
                                                    }
                                                `}
                                            >
                                                <span className="text-xl md:text-2xl drop-shadow-md">{selectedSlide.text}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-6 shrink-0">
                                    <div className="flex-1 space-y-4">
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <Maximize className="w-4 h-4" />
                                                Tamanho (Scale: {selectedSlide.scale.toFixed(1)}x)
                                            </Label>
                                            <Slider
                                                value={[selectedSlide.scale]}
                                                min={0.5}
                                                max={3.0}
                                                step={0.1}
                                                onValueChange={([val]) => handleUpdateSelected({ scale: val })}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-[2] space-y-4">
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <Type className="w-4 h-4" />
                                                Legenda / Texto
                                            </Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={selectedSlide.text}
                                                    onChange={(e) => handleUpdateSelected({ text: e.target.value })}
                                                    placeholder="Digite um texto para o slide..."
                                                    className="flex-1"
                                                />
                                                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-md p-1 border">
                                                    {(['top', 'center', 'bottom'] as const).map(pos => (
                                                        <button
                                                            key={pos}
                                                            onClick={() => handleUpdateSelected({ textPosition: pos })}
                                                            className={`px-3 py-1 text-xs rounded-sm capitalize transition-colors ${selectedSlide.textPosition === pos ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white font-medium' : 'text-slate-500 hover:text-slate-800'}`}
                                                        >
                                                            {pos === 'top' ? 'Topo' : pos === 'center' ? 'Meio' : 'Base'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                                <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                                <p className="text-lg font-medium">Selecione ou adicione uma imagem para editar</p>
                            </div>
                        )}
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
