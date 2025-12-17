import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { SlideElement } from '@/types/presentation';
import { Maximize, Type, MousePointer2 } from 'lucide-react';

interface PropertiesPanelProps {
    activeElement?: SlideElement;
    handleUpdateElement: (id: string, updates: Partial<SlideElement>) => void;
}

export function PropertiesPanel({ activeElement, handleUpdateElement }: PropertiesPanelProps) {
    return (
        <div className="h-16 flex items-center">
            {!activeElement ? (
                <div className="flex items-center gap-2 text-slate-400 w-full justify-center">
                    <MousePointer2 className="w-4 h-4" />
                    <span className="text-sm">Clique em um elemento na tela para editar suas propriedades</span>
                </div>
            ) : (
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                    {activeElement.type === 'image' && (
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
                                <Maximize className="w-3 h-3" />
                                Escala ({activeElement.scale?.toFixed(1)}x)
                            </Label>
                            <Slider
                                value={[activeElement.scale || 1]}
                                min={0.1}
                                max={5.0}
                                step={0.1}
                                onValueChange={([val]) => handleUpdateElement(activeElement.id, { scale: val })}
                            />
                        </div>
                    )}

                    {activeElement.type === 'text' && (
                        <div className="space-y-2 w-full">
                            <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
                                <Type className="w-3 h-3" />
                                Conteúdo do Texto
                            </Label>
                            <Input
                                value={activeElement.content}
                                onChange={(e) => handleUpdateElement(activeElement.id, { content: e.target.value })}
                                className="h-9"
                                placeholder="Digite seu texto aqui..."
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
