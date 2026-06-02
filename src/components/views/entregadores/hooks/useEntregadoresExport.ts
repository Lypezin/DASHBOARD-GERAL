import { useState } from 'react';
import { Entregador } from '@/types';
import { exportarEntregadoresMainParaExcel } from '../EntregadoresMainExcelExport';
import { safeLog } from '@/lib/errorHandler';

export function useEntregadoresExport(sortedEntregadores: Entregador[], organizationId?: string | null) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        try {
            setIsExporting(true);
            await exportarEntregadoresMainParaExcel(sortedEntregadores, { organizationId });
        } catch (error) {
            safeLog.error('Erro export main', error);
        } finally {
            setIsExporting(false);
        }
    };

    return { isExporting, handleExport };
}
