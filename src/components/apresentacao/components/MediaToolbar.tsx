import React from 'react';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Type, Trash2 } from 'lucide-react';
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
}

export const MediaToolbar: React.FC<MediaToolbarProps> = ({
    onAddText,
    onAddImage,
    hasSelection,
    selectedElement,
    onUpdateElement,
    onDeleteSelection
}) => {
    const { fileInputRef, handleFileUpload, triggerUpload } = useMediaUpload(onAddImage);
    const isTextSelected = selectedElement?.type === 'text';

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg rounded-full p-2 flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-4">
            <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
            />
            <Button variant="ghost" size="sm" className="rounded-full h-8 px-3" onClick={triggerUpload}>
                <ImageIcon className="w-4 h-4 mr-2 text-blue-600" />
                Add Foto
            </Button>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

            <Button variant="ghost" size="sm" className="rounded-full h-8 px-3" onClick={onAddText}>
                <Type className="w-4 h-4 mr-2 text-emerald-600" />
                Add Texto
            </Button>

            {/* Contextual Options for Text Selection */}
            {hasSelection && isTextSelected && selectedElement && (
                <MediaToolbarControls
                    selectedElement={selectedElement}
                    onUpdateElement={onUpdateElement}
                />
            )}

            {hasSelection && (
                <>
                    <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-2" />
                    <Button variant="ghost" size="sm" className="rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-3" onClick={onDeleteSelection}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                    </Button>
                </>
            )}
        </div>
    );
};
