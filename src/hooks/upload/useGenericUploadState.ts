import { useState } from 'react';
import { validateFile } from '@/utils/fileValidation';

interface UseGenericUploadStateProps {
    files: File[];
    setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export function useGenericUploadState() {
    const [files, setFiles] = useState<File[]>([]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        const validFiles: File[] = [];

        for (const file of selectedFiles) {
            const validation = await validateFile(file, files.length);
            if (validation.valid) {
                validFiles.push(file);
            }
        }

        if (validFiles.length > 0) {
            setFiles(prev => [...prev, ...validFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const clearFiles = (inputDataAttribute: string) => {
        setFiles([]);
        const fileInput = document.querySelector(
            `input[type="file"][data-${inputDataAttribute}="true"]`
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    return {
        files,
        setFiles,
        handleFileChange,
        removeFile,
        clearFiles
    };
}
