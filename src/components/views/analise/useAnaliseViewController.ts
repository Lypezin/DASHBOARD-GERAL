
import { useState, useMemo, useCallback } from 'react';
import { Totals, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import { useAnaliseTaxas } from '@/hooks/analise/useAnaliseTaxas';
import { useAnaliseTableData } from '@/hooks/analise/useAnaliseTableData';
import { exportarAnaliseParaExcel } from './AnaliseExcelExport';
import { safeLog } from '@/lib/errorHandler';

export type TableType = 'dia' | 'turno' | 'sub_praca' | 'origem';

export function useAnaliseViewController(
    totals: Totals,
    aderenciaDia: AderenciaDia[],
    aderenciaTurno: AderenciaTurno[],
    aderenciaSubPraca: AderenciaSubPraca[],
    aderenciaOrigem: AderenciaOrigem[]
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
        try {
            setIsExporting(true);
            await exportarAnaliseParaExcel(
                totals,
                aderenciaDia,
                aderenciaTurno,
                aderenciaSubPraca,
                aderenciaOrigem
            );
        } catch (error) {
            safeLog.error('Erro no export:', error);
        } finally {
            setIsExporting(false);
        }
    }, [totals, aderenciaDia, aderenciaTurno, aderenciaSubPraca, aderenciaOrigem]);

    // Calcular total de horas
    const totalHoras = useMemo(() => {
        return aderenciaDia.reduce((acc, curr) => acc + (curr.segundos_realizados || 0), 0) / 3600;
    }, [aderenciaDia]);

    return {
        activeTable,
        isExporting,
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
