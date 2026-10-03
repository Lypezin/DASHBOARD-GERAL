
import { useState, useMemo, useCallback } from 'react';
import { Totals, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import { useAnaliseTaxas } from '@/hooks/analise/useAnaliseTaxas';
import { useAnaliseTableData } from '@/hooks/analise/useAnaliseTableData';
import { exportarAnaliseParaExcel } from './AnaliseExcelExport';
import { safeLog } from '@/lib/errorHandler';
import { toast } from 'sonner';
import type { FilterPayload } from '@/types/filters';

export type TableType = 'dia' | 'turno' | 'sub_praca' | 'origem' | 'dia_origem';

export function useAnaliseViewController(
    totals: Totals,
    aderenciaDia: AderenciaDia[] = [],
    aderenciaTurno: AderenciaTurno[] = [],
    aderenciaSubPraca: AderenciaSubPraca[] = [],
    aderenciaOrigem: AderenciaOrigem[] = [],
    aderenciaDiaOrigem: any[] = [],
    exportDisabled = false,
    filterPayload?: FilterPayload
) {
    const [activeTable, setActiveTable] = useState<TableType>('dia');
    const [isExporting, setIsExporting] = useState(false);

    // Memoizar cálculos de taxas
    const { taxaAceitacao, taxaCompletude, taxaRejeicao } = useAnaliseTaxas(totals);

    // Hook para dados da tabela (refatorado)
    const { tableData, labelColumn } = useAnaliseTableData(
        activeTable,
        aderenciaDia,
        aderenciaTurno,
        aderenciaSubPraca,
        aderenciaOrigem
    );

    const handleTableChange = useCallback((table: TableType) => setActiveTable(table), []);

    const handleExport = useCallback(async () => {
        if (isExporting || exportDisabled) return;
        try {
            setIsExporting(true);
            await exportarAnaliseParaExcel(
                totals,
                aderenciaDia,
                aderenciaTurno,
                aderenciaSubPraca,
                aderenciaOrigem,
                aderenciaDiaOrigem,
                filterPayload
            );
        } catch (error) {
            safeLog.error('Erro no export:', error);
            toast.error(error instanceof Error ? error.message : 'Não foi possível gerar o Excel da análise.');
        } finally {
            setIsExporting(false);
        }
    }, [totals, aderenciaDia, aderenciaTurno, aderenciaSubPraca, aderenciaOrigem, aderenciaDiaOrigem, exportDisabled, filterPayload, isExporting]);

    // Calcular total de horas
    const totalHoras = useMemo(() => {
        if (!Array.isArray(aderenciaDia)) return 0;
        return aderenciaDia.reduce((acc, curr) => acc + (curr.segundos_realizados || 0), 0) / 3600;
    }, [aderenciaDia]);

    return {
        activeTable,
        isExporting,
        exportDisabled,
        handleExport,
        handleTableChange,
        taxaAceitacao,
        taxaCompletude,
        taxaRejeicao,
        tableData,
        labelColumn,
        totalHoras
    };
}
