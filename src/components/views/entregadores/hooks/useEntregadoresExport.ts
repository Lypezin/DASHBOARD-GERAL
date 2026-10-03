import { useState } from 'react';
import { Entregador } from '@/types';
import { exportarEntregadoresMainParaExcel } from '../EntregadoresMainExcelExport';
import { safeLog } from '@/lib/errorHandler';
import { toast } from 'sonner';

export function useEntregadoresExport(
    sortedEntregadores: Entregador[],
    organizationId?: string | null,
    filters?: Record<string, unknown>,
    options: { loadCompleteRows?: () => Promise<Entregador[]> } = {}
) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        if (isExporting) return;
        try {
            setIsExporting(true);
            const exportRows = options.loadCompleteRows
                ? await options.loadCompleteRows()
                : sortedEntregadores;
            await exportarEntregadoresMainParaExcel(exportRows, { organizationId, filters });
        } catch (error) {
            safeLog.error('Erro export main', error);
            toast.error(error instanceof Error ? error.message : 'Falha ao gerar arquivo Excel.');
        } finally {
            setIsExporting(false);
        }
    };

    return { isExporting, handleExport };
}
