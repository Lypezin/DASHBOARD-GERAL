
import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface UploadActionsProps {
    onUpload: () => void;
    uploading: boolean;
    hasFiles: boolean;
    variant?: 'default' | 'marketing' | 'valores';
    fileCount: number;
}

export const UploadActions: React.FC<UploadActionsProps> = ({
    onUpload,
    uploading,
    hasFiles,
    variant = 'default',
    fileCount
}) => {
    return (
        <Button
            onClick={onUpload}
            disabled={uploading || !hasFiles}
            className="w-full"
            variant={variant === 'marketing' ? 'default' : variant === 'valores' ? 'default' : 'default'}
        >
            {uploading ? (
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    <span>Processando...</span>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <span>Enviar {fileCount > 0 ? `${fileCount} Arquivo(s)` : 'Arquivo'}</span>
                </div>
            )}
        </Button>
    );
};
