import { SlideElement } from '@/types/presentation';
import { motion } from 'framer-motion';
import { Image as ImageIcon } from 'lucide-react';

interface EditorCanvasProps {
    elements: SlideElement[];
    selectedElementId: string | null;
    setSelectedElementId: (id: string | null) => void;
    handleUpdateElement: (id: string, updates: Partial<SlideElement>) => void;
}

export function EditorCanvas({ elements, selectedElementId, setSelectedElementId, handleUpdateElement }: EditorCanvasProps) {
    return (
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
                        key: el.id,
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
                            <motion.div {...commonProps} className={`flex items-center justify-center origin-center group ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
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
                                                style={{
                                                    position: 'absolute', width: 40, height: 40, cursor: handle.cursor, zIndex: 60,
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
                                    <img src={el.content} alt="Preview" className="max-w-[70vw] max-h-[70vh] object-contain rounded pointer-events-none select-none" draggable={false} />
                                </div>
                            </motion.div>
                        );
                    } else if (el.type === 'text') {
                        return (
                            <motion.div {...commonProps} className={`text-center font-semibold pointer-events-auto text-slate-900 drop-shadow-xl p-4 ${isSelected ? 'ring-2 ring-blue-500 rounded border border-blue-200/50' : ''}`}>
                                <span className="text-xl md:text-3xl select-none whitespace-pre-wrap" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.8)' }}>
                                    {el.content}
                                </span>
                            </motion.div>
                        );
                    }
                })}
            </div>
        </div>
    );
}
