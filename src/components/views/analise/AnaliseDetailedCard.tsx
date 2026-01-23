
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AnaliseTable } from '@/components/analise/AnaliseTable';
import { AnaliseTableTabs } from '@/components/analise/AnaliseTableTabs';
import { ListChecks } from 'lucide-react';
import { TableType } from './useAnaliseViewController';

// If TableType is not imported, define it locally or import from wherever it is.
// Looking at original file, it was defined locally.
// Let's rely on standard types or any for now to avoid errors if I can't find it easily.
// Ideally should be in types.ts.

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
        <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-6 py-5 border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <ListChecks className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                            Análise Detalhada
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Métricas completas de performance por segmento
                        </p>
                    </div>
                </div>
                <AnaliseTableTabs
                    activeTable={activeTable}
                    onTableChange={onTableChange}
                />
            </div>

            <CardContent className="p-0">
                <AnaliseTable
                    data={tableData}
                    labelColumn={labelColumn}
                />
            </CardContent>
        </Card>
    );
});
