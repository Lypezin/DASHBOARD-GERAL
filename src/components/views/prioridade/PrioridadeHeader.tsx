
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

    // Função para exportar dados para Excel
    const exportarParaExcel = async () => {
        try {
            await exportarPrioridadeParaExcel(sortedEntregadores);
        } catch (err: any) {
            safeLog.error('Erro ao exportar para Excel:', err);
            alert('Erro ao exportar dados para Excel. Por favor, tente novamente.');
        }
    };

    return (
        <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/30 dark:to-slate-900 border-l-4 border-l-indigo-500">
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
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
                        className="shrink-0 bg-white hover:bg-slate-50 shadow-sm border-slate-200"
                    >
                        <Download className="mr-2 h-4 w-4 text-indigo-600" />
                        Exportar Excel
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
