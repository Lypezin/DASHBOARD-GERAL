import { SlideElement } from '@/types/presentation';
import { Image as ImageIcon } from 'lucide-react';
import { ImageElement } from './ImageElement';
import { TextElement } from './TextElement';

interface EditorCanvasProps {
    elements: SlideElement[];
    selectedElementId: string | null;
    setSelectedElementId: (id: string | null) => void;
    handleUpdateElement: (id: string, updates: Partial<SlideElement>) => void;
}

export function EditorCanvas({ elements, selectedElementId, setSelectedElementId, handleUpdateElement }: EditorCanvasProps) {
    return (
        /* eslint-disable @next/next/no-img-element */
        <div className="flex-1 bg-black/90 rounded-lg overflow-hidden relative shadow-2xl border border-slate-700 flex items-center justify-center"
            onClick={() => setSelectedElementId(null)}>

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
                    const commonProps = {
                        drag: true,
                        dragMomentum: false,
                        onClick: (e: React.MouseEvent) => { e.stopPropagation(); setSelectedElementId(el.id); },
                        onDragEnd: (_: any, info: any) => {
                            handleUpdateElement(el.id, {
                                position: {
                                    x: (el.position.x || 0) + info.offset.x,
                                    y: (el.position.y || 0) + info.offset.y
                                }
                            });
                        },
                        style: {
                            x: el.position.x || 0,
                            y: el.position.y || 0,
                            position: 'absolute' as 'absolute',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            cursor: 'grab',
                            zIndex: isSelected ? 50 : (el.type === 'text' ? 20 : 10),
                            ...(el.type === 'image' ? { scale: el.scale || 1, transformOrigin: 'center center' } : {})
                        },
                        whileDrag: { cursor: 'grabbing', ...(el.type === 'image' ? { scale: (el.scale || 1) * 1.02 } : {}) }
                    };

                    if (el.type === 'image') {
                        return (
                            <ImageElement
                                key={el.id}
                                element={el}
                                isSelected={isSelected}
                                onSelect={setSelectedElementId}
                                onUpdate={handleUpdateElement}
                                commonProps={commonProps}
                            />
                        );
                    } else if (el.type === 'text') {
                        return (
                            <TextElement
                                key={el.id}
                                element={el}
                                isSelected={isSelected}
                                commonProps={commonProps}
                            />
                        );
                    }
                })}
            </div>
        </div>
    );
}
