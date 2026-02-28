
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
        <div className="space-y-6">
            {/* Header Bar - Stripe inspired */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Análise Detalhada
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Comparativo de performance por dimensões
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <AnaliseTableTabs
                        activeTable={activeTable}
                        onTableChange={onTableChange}
                    />
                    {onExport && (
                        <button
                            onClick={onExport}
                            disabled={isExporting}
                            className="
                                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                                bg-white dark:bg-slate-800
                                border border-slate-200 dark:border-slate-700
                                text-slate-600 dark:text-slate-300
                                hover:bg-slate-50 dark:hover:bg-slate-700
                                hover:border-slate-300 dark:hover:border-slate-600
                                disabled:opacity-50 disabled:cursor-not-allowed
                                group
                            "
                        >
                            <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                            {isExporting ? 'Exportando...' : 'Exportar Excel'}
                        </button>
                    )}
                </div>
            </div>

            {/* Table Container */}
            <div className="
                rounded-xl overflow-hidden
                bg-white dark:bg-slate-800/30
                border border-slate-200 dark:border-slate-700/50
                shadow-sm dark:shadow-none
            ">
                <AnaliseTable
                    data={tableData}
                    labelColumn={labelColumn}
                />
            </div>
        </div>
    );
});
