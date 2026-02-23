import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Copy, Check, Download } from 'lucide-react';

interface ResumoFiltersProps {
    selectedPracas: string[];
    pracasDisponiveis: string[];
    onFilterToggle: (praca: string) => void;
    onClearFilter: () => void;
    onCopyTable: () => void;
    onExportTable: () => void;
    hasData: boolean;
}

export const ResumoFilters = ({
    selectedPracas,
    pracasDisponiveis,
    onFilterToggle,
    onClearFilter,
    onCopyTable,
    onExportTable,
    hasData
}: ResumoFiltersProps) => {
    const [filterOpen, setFilterOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        onCopyTable();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={onExportTable}
                disabled={!hasData}
                className="flex items-center gap-2 text-slate-700 dark:text-slate-300"
            >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar Excel</span>
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!hasData}
                className="flex items-center gap-2"
            >
                {copied ? (
                    <>
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Copiado!</span>
                    </>
                ) : (
                    <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar</span>
                    </>
                )}
            </Button>
            <div className="relative">
                <button
                    onClick={() => setFilterOpen(!filterOpen)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    {selectedPracas.length === 0
                        ? "Filtrar por Praça"
                        : `${selectedPracas.length} praça(s)`}
                    <svg className={cn("w-4 h-4 transition-transform", filterOpen && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {filterOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
                        <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Selecione as Praças</span>
                            {selectedPracas.length > 0 && (
                                <button
                                    onClick={() => { onClearFilter(); setFilterOpen(false); }}
                                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                >
                                    Limpar
                                </button>
                            )}
                        </div>
                        <div className="max-h-64 overflow-y-auto p-2">
                            {pracasDisponiveis.map((praca) => (
                                <label
                                    key={praca}
                                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedPracas.includes(praca)}
                                        onChange={() => onFilterToggle(praca)}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-slate-700 dark:text-slate-300">{praca}</span>
                                </label>
                            ))}
                        </div>
                        <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => setFilterOpen(false)}
                                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Aplicar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
