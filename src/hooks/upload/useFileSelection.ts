import { useState, useCallback } from 'react';
import { validateFile } from '@/utils/fileValidation';
import { MAX_FILES } from '@/constants/upload';

export interface UseFileSelectionResult {
    files: File[];
    setFiles: React.Dispatch<React.SetStateAction<File[]>>;
    handleFileChange: (event: React.ChangeEvent<HTMLInputElement>, onError: (msg: string) => void) => Promise<void>;
    removeFile: (index: number) => void;
    clearFiles: () => void;
}

export function useFileSelection(): UseFileSelectionResult {
    const [files, setFiles] = useState<File[]>([]);

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>, onError: (msg: string) => void) => {
        const selectedFiles = event.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;

        if (files.length + selectedFiles.length > MAX_FILES) {
            onError(`⚠️ Máximo de ${MAX_FILES} arquivos permitidos.`);
            return;
        }

        const validFiles: File[] = [];
        const errors: string[] = [];

        for (const file of Array.from(selectedFiles)) {
            const validation = await validateFile(file, files.length);
            if (validation.valid) {
                validFiles.push(file);
            } else {
                errors.push(validation.error || `Arquivo "${file.name}" inválido.`);
            }
        }

        if (errors.length > 0) {
            onError(`⚠️ ${errors.length} arquivo(s) rejeitado(s):\n${errors.join('\n')}`);
        }

        if (validFiles.length > 0) {
            setFiles(prev => [...prev, ...validFiles]);
            // Callers should clear error message on success if needed
        }
    }, [files.length]);

    const removeFile = useCallback((index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    }, []);

    const clearFiles = useCallback(() => {
        setFiles([]);
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    }, []);

    return { files, setFiles, handleFileChange, removeFile, clearFiles };
}
