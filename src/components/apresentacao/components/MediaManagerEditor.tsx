import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Image as ImageIcon, Type, Maximize } from 'lucide-react';
import { MediaSlideData } from '@/types/presentation';

interface MediaManagerEditorProps {
    selectedSlide: MediaSlideData | undefined;
    onUpdate: (updates: Partial<MediaSlideData>) => void;
}

export const MediaManagerEditor: React.FC<MediaManagerEditorProps> = ({
    selectedSlide,
    onUpdate
}) => {
    if (!selectedSlide) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">Selecione ou adicione uma imagem para editar</p>
            </div>
        );
    }

    return (
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
                            onValueChange={([val]) => onUpdate({ scale: val })}
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
                                onChange={(e) => onUpdate({ text: e.target.value })}
                                placeholder="Digite um texto para o slide..."
                                className="flex-1"
                            />
                            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-md p-1 border">
                                {(['top', 'center', 'bottom'] as const).map(pos => (
                                    <button
                                        key={pos}
                                        onClick={() => onUpdate({ textPosition: pos })}
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
    );
};
