
import React from 'react';
import { Upload, Loader2 } from 'lucide-react';

interface UploadActionsProps {
    onUpload: () => void | Promise<void>;
    uploading: boolean;
    hasFiles: boolean;
    disabled?: boolean;
    variant?: 'default' | 'marketing' | 'valores';
    fileCount: number;
}

const variantButton = {
    default: 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-500',
    marketing: 'bg-purple-600 hover:bg-purple-700 focus-visible:ring-purple-300 dark:bg-purple-600 dark:hover:bg-purple-500',
    valores: 'bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-300 dark:bg-emerald-600 dark:hover:bg-emerald-500',
};

export const UploadActions: React.FC<UploadActionsProps> = ({
    onUpload, uploading, hasFiles, disabled = false, variant = 'default', fileCount
}) => {
    const isDisabled = disabled || uploading || !hasFiles;
    return (
        <button
            onClick={onUpload}
            disabled={isDisabled}
            className={`w-full flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none ${variantButton[variant]}`}
        >
            {uploading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processando...</span>
                </>
            ) : (
                <>
                    <Upload className="h-4 w-4" />
                    <span>Enviar {fileCount > 0 ? `${fileCount} Arquivo${fileCount > 1 ? 's' : ''}` : ''}</span>
                </>
            )}
        </button>
    );
};
