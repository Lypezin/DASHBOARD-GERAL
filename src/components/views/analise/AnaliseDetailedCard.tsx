
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

const glassStyle: React.CSSProperties = {
    background: 'rgba(22, 31, 48, 0.6)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
};

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
            {/* Section 2: Analysis Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 pt-2">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                        Análise Detalhada
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Comparativo de performance por dimensões</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <AnaliseTableTabs
                        activeTable={activeTable}
                        onTableChange={onTableChange}
                    />
                    {onExport && (
                        <button
                            onClick={onExport}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 hover:border-slate-500 hover:bg-white/5 text-slate-300 text-xs font-medium transition-all group disabled:opacity-50"
                        >
                            <Download className="w-4 h-4 group-hover:text-blue-400 transition-colors" />
                            {isExporting ? 'Exportando...' : 'Exportar Excel'}
                        </button>
                    )}
                </div>
            </div>

            {/* Section 3: Premium Table */}
            <div
                className="rounded-xl overflow-hidden shadow-2xl"
                style={glassStyle}
            >
                <AnaliseTable
                    data={tableData}
                    labelColumn={labelColumn}
                />
            </div>
        </div>
    );
});
