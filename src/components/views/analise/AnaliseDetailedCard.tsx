
import React from 'react';
import { Card } from '@/components/ui/card';
import { AnaliseTable } from '@/components/analise/AnaliseTable';
import { AnaliseTableTabs } from '@/components/analise/AnaliseTableTabs';
import { TableType } from './useAnaliseViewController';

interface AnaliseDetailedCardProps {
    activeTable: TableType | any;
    onTableChange: (table: TableType | any) => void;
    tableData: any[];
    labelColumn: string;
}

export const AnaliseDetailedCard = React.memo(function AnaliseDetailedCard({
    activeTable,
    onTableChange,
    tableData,
    labelColumn
}: AnaliseDetailedCardProps) {
    return (
        <div className="bg-white dark:bg-[#1a2332]/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Análise Detalhada</h3>
                <AnaliseTableTabs
                    activeTable={activeTable}
                    onTableChange={onTableChange}
                />
            </div>

            <AnaliseTable
                data={tableData}
                labelColumn={labelColumn}
            />
        </div>
    );
});
