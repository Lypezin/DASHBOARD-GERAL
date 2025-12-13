
import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UploadExpectedColumnsProps {
    columns?: string[];
}

export const UploadExpectedColumns: React.FC<UploadExpectedColumnsProps> = ({ columns }) => {
    if (!columns || columns.length === 0) return null;

    return (
        <details className="group">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1">
                <FileSpreadsheet className="h-3 w-3" />
                Ver colunas esperadas
            </summary>
            <div className="mt-2 flex flex-wrap gap-1">
                {columns.map((col) => (
                    <Badge key={col} variant="secondary" className="text-[10px] font-mono">
                        {col}
                    </Badge>
                ))}
            </div>
        </details>
    );
};
