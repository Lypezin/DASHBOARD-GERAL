
import React from 'react';
import { AnaliseTable } from '@/components/analise/AnaliseTable';
import { AnaliseTableTabs } from '@/components/analise/AnaliseTableTabs';
import { Download } from 'lucide-react';
import { TableType } from './useAnaliseViewController';

interface AnaliseDetailedCardProps {
    activeTable: TableType | any;
    onTableChange: (table: TableType | any) => void;
    tableData: any[];
    labelColumn: string;
    isExporting?: boolean;
    onExport?: () => void;
}

export const AnaliseDetailedCard = React.memo(function AnaliseDetailedCard({
    activeTable,
    onTableChange,
    tableData,
    labelColumn,
    isExporting,
    onExport,
}: AnaliseDetailedCardProps) {
    return (
        <div className="flex flex-col gap-6">
            {/* Header with controls */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex flex-col gap-1 w-full md:w-auto">
                    <h2 className="text-white text-2xl font-bold tracking-tight">Análise Detalhada</h2>
                    <p className="text-slate-400 text-sm">Desempenho granular por segmento</p>
                </div>
                <div className="flex flex-wrap gap-3 items-center w-full md:w-auto justify-end">
                    <AnaliseTableTabs
                        activeTable={activeTable}
                        onTableChange={onTableChange}
                    />
                    {onExport && (
                        <button
                            onClick={onExport}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-200 text-sm font-medium transition-all group"
                            style={{
                                background: 'rgba(30, 41, 59, 0.6)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                            }}
                        >
                            <Download className="w-[18px] h-[18px] group-hover:text-emerald-400 transition-colors" />
                            {isExporting ? 'Exportando...' : 'Exportar Excel'}
                        </button>
                    )}
                </div>
            </div>

            {/* Table Container */}
            <div
                className="rounded-xl overflow-hidden"
                style={{
                    background: 'rgba(30, 41, 59, 0.2)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
            >
                <AnaliseTable
                    data={tableData}
                    labelColumn={labelColumn}
                />
            </div>
        </div>
    );
});
