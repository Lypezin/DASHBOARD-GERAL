import { safeLog } from '@/lib/errorHandler';
import { supabase } from '@/lib/supabaseClient';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;

export const useMediaUpload = (onAddImage: (url: string) => void) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!e.target.files?.[0]) return;

            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                toast.error('Selecione um arquivo de imagem.');
                return;
            }

            if (file.size > MAX_IMAGE_SIZE_BYTES) {
                toast.error('A imagem precisa ter no máximo 8 MB.');
                return;
            }

            setIsUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `presentation_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('presentation-media')
                .upload(filePath, file);

            if (uploadError) {
                safeLog.error('Error uploading image:', uploadError);
                toast.error('Falha ao enviar a imagem.');
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('presentation-media')
                .getPublicUrl(filePath);

            onAddImage(publicUrl);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const triggerUpload = () => fileInputRef.current?.click();

    return {
        fileInputRef,
        handleFileUpload,
        triggerUpload,
        isUploading
    };
};
