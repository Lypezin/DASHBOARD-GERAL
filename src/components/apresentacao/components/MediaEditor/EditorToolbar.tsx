import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Type, Trash2 } from 'lucide-react';
import { SlideElement } from '@/types/presentation';

interface EditorToolbarProps {
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleAddImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleAddText: () => void;
    activeElement?: SlideElement;
    handleDeleteElement: () => void;
}

export function EditorToolbar({
    fileInputRef, handleAddImage, handleAddText, activeElement, handleDeleteElement
}: EditorToolbarProps) {
    return (
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
    );
}
