
import { useState, useMemo, useCallback } from 'react';
import { UtrData } from '@/types';
import { exportarUtrParaExcel } from './UtrExcelExport';
import { safeLog } from '@/lib/errorHandler';

export function useUtrView(utrData: UtrData | null) {
    const [isExporting, setIsExporting] = useState(false);

    const porPraca = useMemo(() => utrData?.praca || utrData?.por_praca || [], [utrData?.praca, utrData?.por_praca]);
    const porSubPraca = useMemo(() => utrData?.sub_praca || utrData?.por_sub_praca || [], [utrData?.sub_praca, utrData?.por_sub_praca]);
    const porOrigem = useMemo(() => utrData?.origem || utrData?.por_origem || [], [utrData?.origem, utrData?.por_origem]);
    const porTurno = useMemo(() => utrData?.turno || utrData?.por_turno || [], [utrData?.turno, utrData?.por_turno]);

    const handleExport = useCallback(async () => {
        if (!utrData) return;
        try {
            setIsExporting(true);
            await exportarUtrParaExcel(utrData);
        } catch (error) {
            safeLog.error('Erro no export UTR:', error);
        } finally {
            setIsExporting(false);
        }
    }, [utrData]);

    return {
        isExporting,
        handleExport,
        porPraca,
        porSubPraca,
        porOrigem,
        porTurno
    };
}
