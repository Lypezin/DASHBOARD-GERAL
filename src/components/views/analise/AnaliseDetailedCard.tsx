import React from 'react';
import { AnaliseTable } from '@/components/analise/AnaliseTable';
import { AnaliseTableTabs } from '@/components/analise/AnaliseTableTabs';
import { Download } from 'lucide-react';
import { TableType } from './useAnaliseViewController';
import { AnaliseDiaOrigemTable } from './components/AnaliseDiaOrigemTable';

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
        <div className="space-y-6">
            {/* Header Bar - Stripe inspired */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground font-outfit">
                        Análise Detalhada
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5 font-medium">
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
                            type="button"
                            className="
                                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
                                bg-card hover:bg-muted/80
                                border border-border hover:border-primary/40
                                text-foreground
                                disabled:opacity-50 disabled:cursor-not-allowed
                                group shadow-sm
                            "
                        >
                            <Download className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                            {isExporting ? 'Exportando...' : 'Exportar Excel'}
                        </button>
                    )}
                </div>
            </div>

            {/* Table Container */}
            <div className="
                rounded-xl overflow-hidden
                bg-card
                border border-border
                shadow-[0_1px_3px_rgba(0,0,0,0.01)]
            ">
                {activeTable === 'dia_origem' ? (
                    loadingDiaOrigem ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm text-muted-foreground/60 font-semibold">Carregando matriz...</p>
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
        </div>
    );
});
