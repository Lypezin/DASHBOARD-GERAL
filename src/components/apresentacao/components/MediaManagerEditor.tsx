import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Type, Maximize, Trash2, MousePointer2 } from 'lucide-react';
import { MediaSlideData, SlideElement } from '@/types/presentation';
import { motion } from 'framer-motion';

interface MediaManagerEditorProps {
    selectedSlide: MediaSlideData | undefined;
    onUpdate: (updates: Partial<MediaSlideData>) => void;
}

export const MediaManagerEditor: React.FC<MediaManagerEditorProps> = ({
    selectedSlide,
    onUpdate
}) => {
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!selectedSlide) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">Selecione ou adicione um slide para editar</p>
            </div>
        );
    }

    const elements = selectedSlide.elements || [];
    const activeElement = elements.find(el => el.id === selectedElementId);

    const handleUpdateElement = (elId: string, updates: Partial<SlideElement>) => {
        const newElements = elements.map(el =>
            el.id === elId ? { ...el, ...updates } : el
        );
        onUpdate({ elements: newElements });
    };

    const handleAddText = () => {
        const newElement: SlideElement = {
            id: crypto.randomUUID(),
            type: 'text',
            content: 'Novo Texto',
            position: { x: 0, y: 0 }
        };
        onUpdate({ elements: [...elements, newElement] });
        setSelectedElementId(newElement.id);
    };

    const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const newElement: SlideElement = {
                    id: crypto.randomUUID(),
                    type: 'image',
                    content: ev.target?.result as string,
                    position: { x: 0, y: 0 },
                    scale: 1
                };
                onUpdate({ elements: [...elements, newElement] });
                setSelectedElementId(newElement.id);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleDeleteElement = () => {
        if (selectedElementId) {
            onUpdate({ elements: elements.filter(el => el.id !== selectedElementId) });
            setSelectedElementId(null);
        }
    };

    return (
        <div className="flex flex-col h-full gap-6">

            {/* Preview Container */}
            <div className="flex-1 bg-black/90 rounded-lg overflow-hidden relative shadow-2xl border border-slate-700 flex items-center justify-center"
                onClick={() => setSelectedElementId(null)}>

                {/* Fixed Aspect Ratio Container */}
                <div
                    className="relative bg-white shadow-2xl overflow-hidden"
                    style={{
                        aspectRatio: '1680 / 1188',
                        height: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        maxWidth: '100%'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {elements.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 pointer-events-none">
                            <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-lg">Adicione fotos ou textos</p>
                        </div>
                    )}

                    {elements.map(el => {
                        const isSelected = el.id === selectedElementId;

                        if (el.type === 'image') {
                            return (
                                <motion.div
                                    key={el.id}
                                    drag
                                    dragMomentum={false}
                                    onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
                                    onDragEnd={(_, info) => {
                                        handleUpdateElement(el.id, {
                                            position: {
                                                x: (el.position.x || 0) + info.offset.x,
                                                y: (el.position.y || 0) + info.offset.y
                                            }
                                        });
                                    }}
                                    style={{
                                        x: el.position.x || 0,
                                        y: el.position.y || 0,
                                        scale: el.scale || 1,
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        cursor: 'grab',
                                        transformOrigin: 'center center',
                                        zIndex: isSelected ? 50 : 10
                                    }}
                                    whileDrag={{ cursor: 'grabbing', scale: (el.scale || 1) * 1.02 }}
                                    className={`flex items-center justify-center origin-center group ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                                >
                                    {/* 4 Resize Handles - Only when selected */}
                                    {isSelected && (
                                        <>
                                            {[
                                                { pos: 'tl', cursor: 'nwse-resize', sensitivity: -1 },
                                                { pos: 'tr', cursor: 'nesw-resize', sensitivity: 1 },
                                                { pos: 'bl', cursor: 'nesw-resize', sensitivity: -1 },
                                                { pos: 'br', cursor: 'nwse-resize', sensitivity: 1 }
                                            ].map((handle) => (
                                                <motion.div
                                                    key={handle.pos}
                                                    drag="x"
                                                    dragMomentum={false}
                                                    dragPropagation={false}
                                                    onDrag={(_, info) => {
                                                        const currentScale = el.scale || 1;
                                                        const sensitivity = (0.005 / currentScale) * handle.sensitivity;
                                                        const newScale = Math.max(0.1, Math.min(5.0, (el.scale || 1) + info.delta.x * sensitivity));
                                                        handleUpdateElement(el.id, { scale: newScale });
                                                    }}
                                                    onDragEnd={() => { }}
                                                    dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
                                                    style={{
                                                        position: 'absolute',
                                                        width: 40,
                                                        height: 40,
                                                        cursor: handle.cursor,
                                                        zIndex: 60,
                                                        left: handle.pos.includes('l') ? -20 : undefined,
                                                        right: handle.pos.includes('r') ? -20 : undefined,
                                                        top: handle.pos.includes('t') ? -20 : undefined,
                                                        bottom: handle.pos.includes('b') ? -20 : undefined,
                                                    }}
                                                    className="flex items-center justify-center"
                                                >
                                                    <div className="w-4 h-4 bg-white border-2 border-slate-400 rounded-full shadow-lg" />
                                                </motion.div>
                                            ))}
                                        </>
                                    )}

                                    <div className="relative pointer-events-none select-none">
                                        <img
                                            src={el.content}
                                            alt="Preview"
                                            className="max-w-[70vw] max-h-[70vh] object-contain rounded pointer-events-none select-none"
                                            draggable={false}
                                        />
                                    </div>
                                </motion.div>
                            );
                        } else if (el.type === 'text') {
                            return (
                                <motion.div
                                    key={el.id}
                                    drag
                                    dragMomentum={false}
                                    onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
                                    onDragEnd={(_, info) => {
                                        handleUpdateElement(el.id, {
                                            position: {
                                                x: (el.position.x || 0) + info.offset.x,
                                                y: (el.position.y || 0) + info.offset.y
                                            }
                                        });
                                    }}
                                    style={{
                                        x: el.position.x || 0,
                                        y: el.position.y || 0,
                                        position: 'absolute',
                                        cursor: 'grab',
                                        left: '50%',
                                        top: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        zIndex: isSelected ? 50 : 20
                                    }}
                                    whileDrag={{ cursor: 'grabbing' }}
                                    className={`text-center font-semibold pointer-events-auto text-slate-900 drop-shadow-xl p-4 ${isSelected ? 'ring-2 ring-blue-500 rounded border border-blue-200/50' : ''}`}
                                >
                                    <span className="text-xl md:text-3xl select-none whitespace-pre-wrap" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.8)' }}>
                                        {el.content}
                                    </span>
                                </motion.div>
                            );
                        }
                    })}
                </div>
            </div>

            {/* Controls Toolbar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4 shrink-0">

                {/* Top Action Bar */}
                <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleAddImage}
                    />
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Add Foto
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleAddText}>
                        <Type className="w-4 h-4 mr-2" />
                        Add Texto
                    </Button>
                    <div className="flex-1" />
                    {activeElement && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                            <span className="text-xs text-slate-400 font-medium px-2">
                                {activeElement.type === 'image' ? 'Imagem selecionada' : 'Texto selecionado'}
                            </span>
                            <Button variant="destructive" size="sm" onClick={handleDeleteElement}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir Item
                            </Button>
                        </div>
                    )}
                </div>

                {/* Property Editor */}
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
            </div>
        </div>
    );
};
