
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Type, Trash2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface MediaToolbarProps {
    onAddText: () => void;
    onAddImage: (url: string) => void;
    hasSelection: boolean;
    onDeleteSelection: () => void;
}

export const MediaToolbar: React.FC<MediaToolbarProps> = ({
    onAddText,
    onAddImage,
    hasSelection,
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

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg rounded-full p-2 flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-4">
            <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
            />
            <Button variant="ghost" size="sm" className="rounded-full" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="w-4 h-4 mr-2 text-blue-600" />
                Add Foto
            </Button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
            <Button variant="ghost" size="sm" className="rounded-full" onClick={onAddText}>
                <Type className="w-4 h-4 mr-2 text-emerald-600" />
                Add Texto
            </Button>

            {hasSelection && (
                <>
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                    <Button variant="ghost" size="sm" className="rounded-full text-red-500 hover:text-red-700 hover:bg-red-50" onClick={onDeleteSelection}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir Item
                    </Button>
                </>
            )}
        </div>
    );
};
