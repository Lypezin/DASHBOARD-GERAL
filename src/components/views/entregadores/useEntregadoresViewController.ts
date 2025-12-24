
import { useCallback } from 'react';
import { useEntregadoresData } from './useEntregadoresData';
import { exportarEntregadoresParaExcel } from './EntregadoresExcelExport';
import { safeLog } from '@/lib/errorHandler';

export function useEntregadoresViewController() {
    const {
        entregadores,
        entregadoresFiltrados,
        loading,
        error,
        searchTerm,
        sortField,
        sortDirection,
        filtroRodouDia,
        filtroDataInicio,
        cidadeSelecionada,
        totais,
        setSearchTerm,
        setFiltroRodouDia,
        setFiltroDataInicio,
        setCidadeSelecionada,
        handleSort,
        fetchEntregadoresFn,
        formatarSegundosParaHoras,
        setLoading,
        setError
    } = useEntregadoresData();

    const exportarParaExcel = useCallback(async () => {
        try {
            await exportarEntregadoresParaExcel(entregadoresFiltrados, formatarSegundosParaHoras);
        } catch (err: any) {
            safeLog.error('Erro ao exportar para Excel:', err);
            alert('Erro ao exportar dados para Excel. Por favor, tente novamente.');
        }
    }, [entregadoresFiltrados, formatarSegundosParaHoras]);

    return {
        state: {
            entregadores,
            entregadoresFiltrados,
            loading,
            error,
            searchTerm,
            sortField,
            sortDirection,
            filtroRodouDia,
            filtroDataInicio,
            cidadeSelecionada,
            totais,
        },
        actions: {
            setSearchTerm,
            setFiltroRodouDia,
            setFiltroDataInicio,
            setCidadeSelecionada,
            handleSort,
            fetchEntregadoresFn,
            setLoading,
            setError,
            exportarParaExcel
        },
        utils: {
            formatarSegundosParaHoras
        }
    };
}
