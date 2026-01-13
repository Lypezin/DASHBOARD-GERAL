
import { useMemo } from 'react';
import { useMarketingComparacao } from './useMarketingComparacao';
import { useAuth } from '@/hooks/useAuth';
import { DashboardFilters } from '@/types';
import { getDateRangeFromWeek } from '@/utils/timeHelpers';

export function useMarketingComparacaoViewController(filters: DashboardFilters) {
    const { user } = useAuth();

    // Determine the date range
    let dataInicial = filters.dataInicial;
    let dataFinal = filters.dataFinal;

    // Force calculation from week/year if they are present, to ensure full ISO week range
    if (filters.ano && filters.semana) {
        const range = getDateRangeFromWeek(filters.ano, filters.semana);
        dataInicial = range.start;
        dataFinal = range.end;
    } else if (!dataInicial || !dataFinal) {
        // Fallback logic for when dates are missing and no specific week is selected
        if (filters.ano) {
            // Use ISO Week 1 start of the selected year (may be in December of previous year)
            const isoWeek1Start = getDateRangeFromWeek(filters.ano, 1);
            dataInicial = isoWeek1Start.start;
            // For end date, use current date if same year, otherwise Dec 31
            const currentYear = new Date().getFullYear();
            if (filters.ano >= currentYear) {
                dataFinal = new Date().toISOString().split('T')[0];
            } else {
                dataFinal = `${filters.ano}-12-31`;
            }
        } else {
            const year = new Date().getFullYear();
            const isoWeek1Start = getDateRangeFromWeek(year, 1);
            dataInicial = isoWeek1Start.start;
            dataFinal = new Date().toISOString().split('T')[0];
        }
    }

    // Handle "Todas" or null praca
    const praca = (filters.praca && filters.praca !== 'Todas') ? filters.praca : null;

    const { data, loading, error } = useMarketingComparacao(
        dataInicial,
        dataFinal,
        user?.organization_id || undefined,
        praca
    );

    // Calculate totals
    const totals = useMemo(() => {
        return data.reduce((acc, row) => ({
            segundos_ops: acc.segundos_ops + row.segundos_ops,
            segundos_mkt: acc.segundos_mkt + row.segundos_mkt,
            ofertadas_ops: acc.ofertadas_ops + row.ofertadas_ops,
            ofertadas_mkt: acc.ofertadas_mkt + row.ofertadas_mkt,
            aceitas_ops: acc.aceitas_ops + row.aceitas_ops,
            aceitas_mkt: acc.aceitas_mkt + row.aceitas_mkt,
            concluidas_ops: acc.concluidas_ops + row.concluidas_ops,
            concluidas_mkt: acc.concluidas_mkt + row.concluidas_mkt,
            rejeitadas_ops: acc.rejeitadas_ops + row.rejeitadas_ops,
            rejeitadas_mkt: acc.rejeitadas_mkt + row.rejeitadas_mkt,
            valor_ops: acc.valor_ops + (row.valor_ops || 0),
            valor_mkt: acc.valor_mkt + (row.valor_mkt || 0),
        }), {
            segundos_ops: 0, segundos_mkt: 0,
            ofertadas_ops: 0, ofertadas_mkt: 0,
            aceitas_ops: 0, aceitas_mkt: 0,
            concluidas_ops: 0, concluidas_mkt: 0,
            rejeitadas_ops: 0, rejeitadas_mkt: 0,
            valor_ops: 0, valor_mkt: 0
        });
    }, [data]);

    return {
        data,
        loading,
        error,
        totals,
        praca
    };
}
