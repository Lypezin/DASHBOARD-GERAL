import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Type, Trash2 } from 'lucide-react';
import { SlideElement } from '@/types/presentation';

interface EditorToolbarProps {
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleAddImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleAddText: () => void;
    activeElement?: SlideElement;
    handleDeleteElement: () => void;
    isUploading: boolean;
}

export function EditorToolbar({
    fileInputRef, handleAddImage, handleAddText, activeElement, handleDeleteElement, isUploading
}: EditorToolbarProps) {
    return (
        <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleAddImage}
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                <ImageIcon className="w-4 h-4 mr-2" />
                {isUploading ? 'Enviando...' : 'Foto'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleAddText}>
                <Type className="w-4 h-4 mr-2" />
                Texto
            </Button>
            <div className="flex-1" />
            {activeElement && (
                <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-right-4">
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
    );
}
