import React from 'react';
import { AnaliseTable } from '@/components/analise/AnaliseTable';
import { AnaliseTableTabs } from '@/components/analise/AnaliseTableTabs';
import { BarChart3, Download } from 'lucide-react';
import { TableType } from './useAnaliseViewController';
import { AnaliseDiaOrigemTable } from './components/AnaliseDiaOrigemTable';
import { SaasPanel, SaasPanelHeader } from '@/components/views/shared/SaasPrimitives';

interface AnaliseDetailedCardProps {
    activeTable: TableType | any;
    onTableChange: (table: TableType | any) => void;
    tableData: any[];
    labelColumn: string;
    isExporting?: boolean;
    onExport?: () => void;
    aderenciaDiaOrigem: any[];
    loadingDiaOrigem?: boolean;
    dayDateMap?: Record<string, string>;
}

export const AnaliseDetailedCard = React.memo(function AnaliseDetailedCard({
    activeTable,
    onTableChange,
    tableData,
    labelColumn,
    isExporting,
    onExport,
    aderenciaDiaOrigem = [],
    loadingDiaOrigem = false,
    dayDateMap = {},
}: AnaliseDetailedCardProps) {
    return (
        <SaasPanel>
            <SaasPanelHeader
                eyebrow="Analise operacional"
                title="Analise Detalhada"
                description="Comparativo de performance por dimensoes, com leitura compacta e scroll controlado."
                icon={BarChart3}
                actions={(
                    <div className="flex flex-wrap items-center gap-3">
                        <AnaliseTableTabs
                            activeTable={activeTable}
                            onTableChange={onTableChange}
                        />
                        {onExport && (
                            <button
                                onClick={onExport}
                                disabled={isExporting}
                                type="button"
                                className="group inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-[border-color,background-color,color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800/80 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:text-blue-300"
                            >
                                <Download className="h-4 w-4 text-slate-400 transition-colors group-hover:text-blue-500" />
                                {isExporting ? 'Exportando...' : 'Exportar Excel'}
                            </button>
                        )}
                    </div>
                )}
            />

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
        </SaasPanel>
    );
});
