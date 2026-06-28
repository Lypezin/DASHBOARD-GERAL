import React from 'react';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Type, Trash2, Paintbrush } from 'lucide-react';
import { SlideElement } from '@/types/presentation';
import { useMediaUpload } from '@/hooks/apresentacao/useMediaUpload';
import { MediaToolbarControls } from './toolbar/MediaToolbarControls';

interface MediaToolbarProps {
    onAddText: () => void;
    onAddImage: (url: string) => void;
    hasSelection: boolean;
    selectedElement?: SlideElement;
    onUpdateElement?: (updates: Partial<SlideElement>) => void;
    onDeleteSelection: () => void;
    slideBackground?: string;
    onUpdateSlideBackground?: (color: string) => void;
}

export const MediaToolbar: React.FC<MediaToolbarProps> = ({
    onAddText,
    onAddImage,
    hasSelection,
    selectedElement,
    onUpdateElement,
    onDeleteSelection,
    slideBackground,
    onUpdateSlideBackground
}) => {
    const { fileInputRef, handleFileUpload, triggerUpload, isUploading } = useMediaUpload(onAddImage);
    const isTextSelected = selectedElement?.type === 'text';

    return (
        <div className="absolute left-3 right-3 top-3 z-50 flex justify-center pointer-events-none sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
            <div className="pointer-events-auto max-w-full overflow-x-auto rounded-lg border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 animate-in fade-in slide-in-from-top-4">
                <div className="flex min-w-max items-center gap-2">
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                    />
                    <Button variant="ghost" size="sm" className="h-8 px-3" onClick={triggerUpload} disabled={isUploading} title="Adicionar foto">
                        <ImageIcon className="w-4 h-4 mr-2 text-blue-600" />
                        {isUploading ? 'Enviando...' : 'Foto'}
                    </Button>

                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

                    <Button variant="ghost" size="sm" className="h-8 px-3" onClick={onAddText} title="Adicionar texto">
                        <Type className="w-4 h-4 mr-2 text-emerald-600" />
                        Texto
                    </Button>

                    {onUpdateSlideBackground && (
                        <>
                            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                            <div className="relative flex items-center justify-center">
                                <input
                                    type="color"
                                    className="absolute opacity-0 w-8 h-8 cursor-pointer"
                                    title="Cor de fundo do slide"
                                    value={slideBackground || '#ffffff'}
                                    onChange={(e) => onUpdateSlideBackground(e.target.value)}
                                />
                                <Button variant="ghost" size="sm" className="h-8 px-3" title="Cor de fundo do slide">
                                    <Paintbrush className="w-4 h-4 mr-2 text-indigo-600" />
                                    Fundo
                                </Button>
                            </div>
                        </>
                    )}

                    {hasSelection && isTextSelected && selectedElement && (
                        <MediaToolbarControls
                            selectedElement={selectedElement}
                            onUpdateElement={onUpdateElement}
                        />
                    )}

                    {hasSelection && (
                        <>
                            <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-2" />
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-3" onClick={onDeleteSelection} title="Excluir seleção">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
