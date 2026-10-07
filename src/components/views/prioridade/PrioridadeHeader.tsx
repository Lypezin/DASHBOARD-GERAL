import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Entregador } from '@/types';
import { exportarPrioridadeParaExcel } from './PrioridadeExcelExport';
import { safeLog } from '@/lib/errorHandler';
import { toast } from 'sonner';

interface PrioridadeHeaderProps {
    sortedEntregadores: Entregador[];
    exportDisabled?: boolean;
    exportDisabledReason?: string;
    exportFilters?: Record<string, unknown>;
}

export const PrioridadeHeader: React.FC<PrioridadeHeaderProps> = ({ sortedEntregadores, exportDisabled = false, exportDisabledReason, exportFilters }) => {
    const [isExporting, setIsExporting] = useState(false);
    const exportarParaExcel = async () => {
        if (isExporting) return;
        try {
            setIsExporting(true);
            await exportarPrioridadeParaExcel(sortedEntregadores, exportFilters);
        } catch (err: unknown) {
            safeLog.error('Erro ao exportar para Excel:', err);
            toast.error(err instanceof Error ? err.message : 'Erro ao exportar dados para Excel. Tente novamente.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <header className="flex min-w-0 flex-col gap-4 rounded-xl border border-[#164d70] bg-[#174d70] px-4 py-4 shadow-[0_8px_28px_-22px_rgba(12,54,81,0.6)] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
            <div className="min-w-0">
                <h1 className="text-[21px] font-semibold leading-tight tracking-[-0.025em] text-white sm:text-[24px]">
                    Prioridade | Promo
                </h1>
                <p className="mt-1.5 text-[12px] leading-5 text-sky-100/90 sm:text-[13px]">
                    Compare os indicadores e encontre entregadores que precisam de atenção.
                </p>
            </div>
            <Button
                type="button"
                onClick={exportarParaExcel}
                disabled={isExporting || exportDisabled || sortedEntregadores.length === 0}
                title={exportDisabledReason || (exportDisabled ? 'Aguarde a atualização dos dados antes de exportar.' : undefined)}
                variant="outline"
                className="h-10 shrink-0 gap-2 rounded-lg border-white bg-white px-3.5 text-sm font-semibold text-[#174d70] shadow-none transition-colors duration-150 hover:border-white hover:bg-sky-50 hover:text-[#103c59] focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#174d70] dark:border-white dark:bg-white dark:text-[#174d70] dark:hover:bg-sky-50"
            >
                <Download className="h-4 w-4" />
                {isExporting ? 'Preparando Excel...' : 'Exportar Excel'}
            </Button>
        </header>
    );
};
