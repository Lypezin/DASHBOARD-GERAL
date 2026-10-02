
import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UploadExpectedColumnsProps {
    columns?: string[];
}

export const UploadExpectedColumns: React.FC<UploadExpectedColumnsProps> = ({ columns }) => {
    if (!columns || columns.length === 0) return null;

    return (
        <details open className="group overflow-hidden rounded-lg border border-border bg-background">
            <summary className="flex cursor-pointer items-center gap-1.5 px-3 py-2.5 text-[11px] font-medium text-foreground transition-colors hover:text-primary">
                <FileSpreadsheet className="h-3 w-3" />
                <span>Colunas esperadas</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{columns.length}</span>
            </summary>
            <div className="flex flex-wrap gap-1.5 border-t border-border px-3 py-3">
                {columns.map((col) => (
                    <Badge key={col} variant="secondary" className="border border-border bg-accent px-2 py-1 font-mono text-[10px] font-medium text-foreground">
                        {col}
                    </Badge>
                ))}
            </div>
        </details>
    );
};
