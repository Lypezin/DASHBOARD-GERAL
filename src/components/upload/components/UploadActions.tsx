
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
    default: 'bg-primary hover:bg-primary/90 focus-visible:ring-ring',
    marketing: 'bg-primary hover:bg-primary/90 focus-visible:ring-ring',
    valores: 'bg-primary hover:bg-primary/90 focus-visible:ring-ring',
};

export const UploadActions: React.FC<UploadActionsProps> = ({
    onUpload, uploading, hasFiles, disabled = false, variant = 'default', fileCount
}) => {
    const isDisabled = disabled || uploading || !hasFiles;
    return (
        <button
            onClick={onUpload}
            disabled={isDisabled}
            className={`flex w-full items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 ${variantButton[variant]}`}
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
