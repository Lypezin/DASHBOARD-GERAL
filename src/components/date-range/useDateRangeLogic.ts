import { useState, useEffect, useCallback } from 'react';
import { safeLog } from '@/lib/errorHandler';

interface UseDateRangeLogicProps {
    dataInicial: string | null;
    dataFinal: string | null;
    onDataInicialChange: (data: string | null) => void;
    onDataFinalChange: (data: string | null) => void;
    onApply?: () => void;
}

export const useDateRangeLogic = ({
    dataInicial,
    dataFinal,
    onDataInicialChange,
    onDataFinalChange,
    onApply,
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

        onDataInicialChange(dataIni);
        onDataFinalChange(dataFim);

        safeLog.info('[FiltroDateRange] Filtro aplicado:', { dataIni, dataFim });

        if (onApply) {
            onApply();
        }
    }, [tempDataInicial, tempDataFinal, onDataInicialChange, onDataFinalChange, onApply]);

    const handleLimpar = useCallback(() => {
        setTempDataInicial('');
        setTempDataFinal('');
        onDataInicialChange(null);
        onDataFinalChange(null);
        safeLog.info('[FiltroDateRange] Filtro limpo');
    }, [onDataInicialChange, onDataFinalChange]);

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
