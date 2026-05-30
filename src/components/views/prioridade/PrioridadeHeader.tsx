import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Entregador } from '@/types';
import { exportarPrioridadeParaExcel } from './PrioridadeExcelExport';
import { safeLog } from '@/lib/errorHandler';

interface PrioridadeHeaderProps {
    sortedEntregadores: Entregador[];
}

export const PrioridadeHeader: React.FC<PrioridadeHeaderProps> = ({ sortedEntregadores }) => {
    const exportarParaExcel = async () => {
        try {
            await exportarPrioridadeParaExcel(sortedEntregadores);
        } catch (err: unknown) {
            safeLog.error('Erro ao exportar para Excel:', err);
            alert('Erro ao exportar dados para Excel. Por favor, tente novamente.');
        }
    };

    return (
        <Card className="overflow-hidden rounded-[2rem] border border-slate-200/75 bg-white/90 shadow-[0_18px_46px_-38px_rgba(15,23,42,0.45)] dark:border-slate-800/75 dark:bg-slate-950/78">
            <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <div className="mb-3 h-1.5 w-16 rounded-full bg-gradient-to-r from-sky-500 to-blue-600" />
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Prioridade / Promo
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Análise detalhada de aderência e performance dos entregadores
                        </p>
                    </div>
                    <Button
                        onClick={exportarParaExcel}
                        disabled={sortedEntregadores.length === 0}
                        variant="outline"
                        className="h-11 shrink-0 gap-2 rounded-2xl border-slate-200/80 bg-white/90 px-4 shadow-[0_12px_24px_-22px_rgba(15,23,42,0.35)] transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-white dark:border-slate-800/80 dark:bg-slate-900/85 dark:hover:border-sky-500/40 dark:hover:bg-slate-900"
                    >
                        <Download className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                        Exportar Excel
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
