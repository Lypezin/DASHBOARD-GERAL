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
        }), {
            entradas_total: 0, entradas_marketing: 0, entradas_operacional: 0,
            saidas_total: 0, saidas_marketing: 0, saidas_operacional: 0,
            saidas_novos: 0
        });

        const saldo_total = totals.entradas_total - totals.saidas_total;
        const saldo_marketing = totals.entradas_marketing - totals.saidas_marketing;
        const saldo_operacional = totals.entradas_operacional - totals.saidas_operacional;

        const formatPercent = (part: number, total: number) => {
            if (!total) return '0%';
            return `${Math.round((part / total) * 100)}%`;
        };

        return {
            totals,
            saldo_total,
            saldo_marketing,
            saldo_operacional,
            formatPercent
        };
    }, [data]);
};
