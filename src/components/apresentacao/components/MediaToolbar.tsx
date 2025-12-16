
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    Image as ImageIcon,
    Type,
    Trash2,
    Bold,
    Italic,
    Palette,
    Type as TypeSize,
    Highlighter
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { SlideElement } from '@/types/presentation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `presentation_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('presentation-media')
                .upload(filePath, file);

            if (uploadError) {
                console.error('Error uploading image:', uploadError);
                return;
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('presentation-media')
                .getPublicUrl(filePath);

            onAddImage(publicUrl);

            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleStyleUpdate = (key: keyof NonNullable<SlideElement['style']>, value: string) => {
        if (!onUpdateElement || !selectedElement) return;

        const currentStyle = selectedElement.style || {};
        onUpdateElement({
            style: {
                ...currentStyle,
                [key]: value
            }
        });
    };

    const isTextSelected = selectedElement?.type === 'text';

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg rounded-full p-2 flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-4">
            {/* Main Add Actions - Always Visible if no specific context overrides? 
                Actually, let's keep them visible always for easy access. */}

            <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
            />
            <Button variant="ghost" size="sm" className="rounded-full h-8 px-3" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="w-4 h-4 mr-2 text-blue-600" />
                Add Foto
            </Button>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

            <Button variant="ghost" size="sm" className="rounded-full h-8 px-3" onClick={onAddText}>
                <Type className="w-4 h-4 mr-2 text-emerald-600" />
                Add Texto
            </Button>

            {/* Contextual Options for Text Selection */}
            {hasSelection && isTextSelected && (
                <>
                    <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-2" />

                    {/* Bold */}
                    <Button
                        variant={selectedElement.style?.fontWeight === 'bold' ? "secondary" : "ghost"}
                        size="icon"
                        className="rounded-full h-8 w-8"
                        onClick={() => handleStyleUpdate('fontWeight', selectedElement.style?.fontWeight === 'bold' ? 'normal' : 'bold')}
                    >
                        <Bold className="w-4 h-4" />
                    </Button>

                    {/* Italic */}
                    <Button
                        variant={selectedElement.style?.fontStyle === 'italic' ? "secondary" : "ghost"}
                        size="icon"
                        className="rounded-full h-8 w-8"
                        onClick={() => handleStyleUpdate('fontStyle', selectedElement.style?.fontStyle === 'italic' ? 'normal' : 'italic')}
                    >
                        <Italic className="w-4 h-4" />
                    </Button>

                    {/* Font Size */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                                <TypeSize className="w-4 h-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-40 p-2">
                            <div className="grid grid-cols-1 gap-1">
                                {['1.25rem', '1.5rem', '1.875rem', '2.25rem', '3rem', '4rem'].map(size => (
                                    <Button
                                        key={size}
                                        variant="ghost"
                                        size="sm"
                                        className="justify-start"
                                        onClick={() => handleStyleUpdate('fontSize', size)}
                                    >
                                        <span style={{ fontSize: size }} className="truncate">Aa ({size})</span>
                                    </Button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Text Color */}
                    <div className="relative flex items-center justify-center">
                        <input
                            type="color"
                            className="absolute opacity-0 w-8 h-8 cursor-pointer"
                            value={selectedElement.style?.color || '#000000'}
                            onChange={(e) => handleStyleUpdate('color', e.target.value)}
                        />
                        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 pointer-events-none">
                            <Palette className="w-4 h-4" style={{ color: selectedElement.style?.color }} />
                        </Button>
                    </div>

                    {/* Background Color */}
                    <div className="relative flex items-center justify-center">
                        <input
                            type="color"
                            className="absolute opacity-0 w-8 h-8 cursor-pointer"
                            title="Cor de Fundo"
                            value={selectedElement.style?.bg === 'transparent' ? '#ffffff' : selectedElement.style?.bg || '#ffffff'}
                            onChange={(e) => handleStyleUpdate('bg', e.target.value)}
                        />
                        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 pointer-events-none">
                            <Highlighter className="w-4 h-4" style={{ color: selectedElement.style?.bg && selectedElement.style.bg !== 'transparent' ? selectedElement.style.bg : undefined }} />
                        </Button>
                    </div>
                </>
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
