
import { useState, useMemo, useCallback } from 'react';
import { UtrData } from '@/types';
import { exportarUtrParaExcel } from './UtrExcelExport';
import { safeLog } from '@/lib/errorHandler';
import { toast } from 'sonner';
import type { FilterPayload } from '@/types/filters';

export function useUtrView(utrData: UtrData | null, exportDisabled = false, filters?: FilterPayload) {
    const [isExporting, setIsExporting] = useState(false);

    const porPraca = useMemo(() => utrData?.praca || utrData?.por_praca || [], [utrData?.praca, utrData?.por_praca]);
    const porSubPraca = useMemo(() => utrData?.sub_praca || utrData?.por_sub_praca || [], [utrData?.sub_praca, utrData?.por_sub_praca]);
    const porOrigem = useMemo(() => utrData?.origem || utrData?.por_origem || [], [utrData?.origem, utrData?.por_origem]);
    const porTurno = useMemo(() => utrData?.turno || utrData?.por_turno || [], [utrData?.turno, utrData?.por_turno]);

    const handleExport = useCallback(async () => {
        if (!utrData || exportDisabled || isExporting) return;
        try {
            setIsExporting(true);
            await exportarUtrParaExcel(utrData, filters);
        } catch (error) {
            safeLog.error('Erro no export UTR:', error);
            toast.error(error instanceof Error ? error.message : 'Não foi possível gerar o Excel da UTR.');
        } finally {
            setIsExporting(false);
        }
    }, [exportDisabled, filters, isExporting, utrData]);

    return {
        isExporting,
        handleExport,
        porPraca,
        porSubPraca,
        porOrigem,
        porTurno
    };
}
