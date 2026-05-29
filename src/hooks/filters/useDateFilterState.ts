
import { useState, useEffect } from 'react';
import { MarketingDateFilter as MarketingDateFilterType } from '@/types';

export function useDateFilterState(
    filter: MarketingDateFilterType,
    onFilterChange: (filter: MarketingDateFilterType) => void
) {
    // Estado local para valores temporários (não aplicados ainda)
    const [tempDataInicial, setTempDataInicial] = useState<string>(filter.dataInicial || '');
    const [tempDataFinal, setTempDataFinal] = useState<string>(filter.dataFinal || '');

    // Sincronizar estado local quando filtro externo mudar
    useEffect(() => {
        if (filter) {
            setTempDataInicial(filter.dataInicial || '');
            setTempDataFinal(filter.dataFinal || '');
        }
    }, [filter]);

    const handleDataInicialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTempDataInicial(e.target.value);
    };

    const handleDataFinalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTempDataFinal(e.target.value);
    };

    const handleAplicar = () => {
        const dataInicial = tempDataInicial || null;
        let dataFinal = tempDataFinal || null;

        if (dataInicial && dataFinal && dataFinal < dataInicial) {
            dataFinal = dataInicial;
            setTempDataFinal(dataInicial);
        }

        onFilterChange({
            dataInicial,
            dataFinal,
        });
    };

    const handleLimpar = () => {
        setTempDataInicial('');
        setTempDataFinal('');
        onFilterChange({
            dataInicial: null,
            dataFinal: null,
        });
    };

    const hoje = new Date().toISOString().split('T')[0];
    const dataMinima = '2020-01-01';
    const temFiltro = filter.dataInicial || filter.dataFinal;
    const temAlteracao = tempDataInicial !== (filter.dataInicial || '') || tempDataFinal !== (filter.dataFinal || '');

    return {
        tempDataInicial,
        tempDataFinal,
        handleDataInicialChange,
        handleDataFinalChange,
        handleAplicar,
        handleLimpar,
        hoje,
        dataMinima,
        temFiltro,
        temAlteracao
    };
}
