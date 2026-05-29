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
        <Card className="border-l-4 border-l-indigo-500 border-none bg-gradient-to-br from-indigo-50 to-white shadow-lg dark:from-indigo-950/30 dark:to-slate-900">
            <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Prioridade / Promo
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Analise detalhada de aderencia e performance dos entregadores
                        </p>
                    </div>
                    <Button
                        onClick={exportarParaExcel}
                        disabled={sortedEntregadores.length === 0}
                        variant="outline"
                        className="shrink-0 border-slate-200 bg-white shadow-sm hover:bg-slate-50"
                    >
                        <Download className="mr-2 h-4 w-4 text-indigo-600" />
                        Exportar Excel
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
