import { useMemo } from 'react';

export const useEntradaSaidaTotals = (data: any[]) => {
    return useMemo(() => {
        const totals = data.reduce((acc, curr) => ({
            entradas_total: acc.entradas_total + (Number(curr.entradas_total) || 0),
            entradas_marketing: acc.entradas_marketing + (Number(curr.entradas_marketing) || 0),
            entradas_operacional: acc.entradas_operacional + (Number(curr.entradas_operacional) || 0),

            saidas_total: acc.saidas_total + (Number(curr.saidas_total) || 0),
            saidas_marketing: acc.saidas_marketing + (Number(curr.saidas_marketing) || 0),
            saidas_operacional: acc.saidas_operacional + (Number(curr.saidas_operacional) || 0),

            saidas_novos: acc.saidas_novos + (Number(curr.saidas_novos) || 0),

            retomada_total: (acc.retomada_total || 0) + (Number(curr.retomada_total) || 0),
            retomada_marketing: (acc.retomada_marketing || 0) + (Number(curr.retomada_marketing) || 0),
            retomada_operacional: (acc.retomada_operacional || 0) + (Number(curr.retomada_operacional) || 0),
        }), {
            entradas_total: 0, entradas_marketing: 0, entradas_operacional: 0,
            saidas_total: 0, saidas_marketing: 0, saidas_operacional: 0,
            saidas_novos: 0,
            retomada_total: 0, retomada_marketing: 0, retomada_operacional: 0
        });

        // SALDO: Entradas - Saídas (SEM Retomada)
        const saldo_total = totals.entradas_total - totals.saidas_total;
        const saldo_marketing = totals.entradas_marketing - totals.saidas_marketing;
        const saldo_operacional = totals.entradas_operacional - totals.saidas_operacional;

        // BASE ATIVA: último valor disponível (semana mais recente com dados)
        const lastWeekWithData = [...data].reverse().find(w => Number(w.base_ativa || 0) > 0);
        const base_ativa = lastWeekWithData ? Number(lastWeekWithData.base_ativa) : 0;

        // VARIAÇÃO TOTAL: soma de todas as variações no período
        const variacao_total = data.reduce((sum: number, curr: any) => sum + (Number(curr.variacao_base) || 0), 0);

        const formatPercent = (part: number, total: number) => {
            if (!total) return '0%';
            return `${Math.round((part / total) * 100)}%`;
        };

        return {
            totals,
            saldo_total,
            saldo_marketing,
            saldo_operacional,
            base_ativa,
            variacao_total,
            formatPercent
        };
    }, [data]);
};
