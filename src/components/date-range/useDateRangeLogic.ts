import { useState, useEffect, useCallback } from 'react';
import { safeLog } from '@/lib/errorHandler';

interface UseDateRangeLogicProps {
    dataInicial: string | null;
    dataFinal: string | null;
    onRangeApply: (dataInicial: string | null, dataFinal: string | null) => void;
    onRangeClear?: () => void;
}

export const useDateRangeLogic = ({
    dataInicial,
    dataFinal,
    onRangeApply,
    onRangeClear,
}: UseDateRangeLogicProps) => {
    const [tempDataInicial, setTempDataInicial] = useState<string>(dataInicial || '');
    const [tempDataFinal, setTempDataFinal] = useState<string>(dataFinal || '');

    useEffect(() => {
        setTempDataInicial(dataInicial || '');
        setTempDataFinal(dataFinal || '');
    }, [dataInicial, dataFinal]);

    const handleDataInicialChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const value = e.target.value || '';
            setTempDataInicial(value);

            if (value && tempDataFinal && value > tempDataFinal) {
                setTempDataFinal(value);
            }
        } catch (error) {
            safeLog.error('[FiltroDateRange] Erro em handleDataInicialChange:', error);
        }
    }, [tempDataFinal]);

    const handleDataFinalChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const value = e.target.value || '';
            setTempDataFinal(value);

            if (value && tempDataInicial && value < tempDataInicial) {
                setTempDataFinal(tempDataInicial);
            }
        } catch (error) {
            safeLog.error('[FiltroDateRange] Erro em handleDataFinalChange:', error);
        }
    }, [tempDataInicial]);

    const handleAplicar = useCallback(() => {
        const dataIni = tempDataInicial || null;
        let dataFim = tempDataFinal || null;

        if (dataIni && dataFim && dataFim < dataIni) {
            dataFim = dataIni;
            setTempDataFinal(dataIni);
        }

        onRangeApply(dataIni, dataFim);

        safeLog.info('[FiltroDateRange] Filtro aplicado:', { dataIni, dataFim });
    }, [tempDataInicial, tempDataFinal, onRangeApply]);

    const handleLimpar = useCallback(() => {
        setTempDataInicial('');
        setTempDataFinal('');
        onRangeApply(null, null);
        onRangeClear?.();
        safeLog.info('[FiltroDateRange] Filtro limpo');
    }, [onRangeApply, onRangeClear]);

    const temAlteracao = tempDataInicial !== (dataInicial || '') || tempDataFinal !== (dataFinal || '');
    const temFiltro = dataInicial || dataFinal;

    return {
        tempDataInicial,
        tempDataFinal,
        handleDataInicialChange,
        handleDataFinalChange,
        handleAplicar,
        handleLimpar,
        temAlteracao,
        temFiltro,
    };
};
