import React from 'react';
import { AnaliseTable } from '@/components/analise/AnaliseTable';
import { AnaliseTableTabs } from '@/components/analise/AnaliseTableTabs';
import { BarChart3 } from 'lucide-react';
import { TableType } from './useAnaliseViewController';
import { AnaliseDiaOrigemTable } from './components/AnaliseDiaOrigemTable';

interface AnaliseDetailedCardProps {
    activeTable: TableType | any;
    onTableChange: (table: TableType | any) => void;
    tableData: any[];
    labelColumn: string;
    aderenciaDiaOrigem: any[];
    loadingDiaOrigem?: boolean;
    dayDateMap?: Record<string, string>;
}

export const AnaliseDetailedCard = React.memo(function AnaliseDetailedCard({
    activeTable,
    onTableChange,
    tableData,
    labelColumn,
    aderenciaDiaOrigem = [],
    loadingDiaOrigem = false,
    dayDateMap = {},
}: AnaliseDetailedCardProps) {
    return (
        <section aria-labelledby="analise-detail-title" className="min-w-0 overflow-hidden rounded-xl border border-[#d8e4eb] bg-white shadow-[0_8px_28px_-24px_rgba(15,57,82,0.5)] dark:border-slate-800 dark:bg-slate-900">
            <div className="flex min-w-0 flex-col gap-3 border-b border-[#e2ebf0] px-4 py-4 dark:border-slate-800 sm:px-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                    <h2 id="analise-detail-title" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-[#183f58] dark:text-slate-100">
                        <BarChart3 className="h-4 w-4 shrink-0 text-[#347ca3] dark:text-sky-300" aria-hidden="true" />
                        Análise detalhada
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Compare os resultados por dia, turno, sub-praça, origem ou dia e origem.</p>
                </div>
                <AnaliseTableTabs activeTable={activeTable} onTableChange={onTableChange} />
            </div>

            <div className="min-w-0 p-3 sm:p-4">
                {activeTable === 'dia_origem' ? (
                    loadingDiaOrigem ? (
                        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-12 text-center dark:border-slate-800/80 dark:bg-slate-900/50">
                            <div className="inline-flex flex-col items-center gap-3">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Carregando matriz...</p>
                            </div>
                        </div>
                    ) : (
                        <AnaliseDiaOrigemTable data={aderenciaDiaOrigem} dayDateMap={dayDateMap} />
                    )
                ) : (
                    <AnaliseTable
                        data={tableData}
                        labelColumn={labelColumn}
                    />
                )}
            </div>
        </section>
    );
});
