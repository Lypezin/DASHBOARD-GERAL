
import React from 'react';
import { ChevronDown, FileSpreadsheet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UploadExpectedColumnsProps {
    columns?: string[];
}

export const UploadExpectedColumns: React.FC<UploadExpectedColumnsProps> = ({ columns }) => {
    if (!columns || columns.length === 0) return null;

    return (
        <details className="group rounded-xl border border-slate-100 dark:border-slate-800/50 bg-slate-50/60 dark:bg-slate-800/20 overflow-hidden">
            <summary className="cursor-pointer list-none text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1.5 px-3.5 py-2.5 transition-colors [&::-webkit-details-marker]:hidden">
                <FileSpreadsheet className="h-3 w-3 shrink-0" />
                <span>Colunas esperadas</span>
                <span className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                    <span>{columns.length}</span>
                    <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
                </span>
            </summary>
            <div className="px-3.5 pb-3 flex flex-wrap gap-1 border-t border-slate-100 dark:border-slate-800/50 pt-2.5 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                {columns.map((col) => (
                    <Badge key={col} variant="secondary" className="text-[10px] font-mono px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {col}
                    </Badge>
                ))}
            </div>
        </details>
    );
};
