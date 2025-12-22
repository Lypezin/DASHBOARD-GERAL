import { createBrowserClient } from '@supabase/ssr';
import { useRef } from 'react';

export const useMediaUpload = (onAddImage: (url: string) => void) => {
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

    const triggerUpload = () => fileInputRef.current?.click();

    return {
        fileInputRef,
        handleFileUpload,
        triggerUpload
    };
};
