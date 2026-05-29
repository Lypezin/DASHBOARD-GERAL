import { converterHorasParaDecimal } from '@/utils/formatters';

export function calculateAderenciaGeral(aderenciaSemanal: any[]) {
    if (!aderenciaSemanal || aderenciaSemanal.length === 0) return undefined;
    if (aderenciaSemanal.length === 1) return aderenciaSemanal[0];

    const { totalHorasAEntregar, totalHorasEntregues } = aderenciaSemanal.reduce(
        (acc, semana) => ({
            totalHorasAEntregar: acc.totalHorasAEntregar + converterHorasParaDecimal(semana.horas_a_entregar || '0'),
            totalHorasEntregues: acc.totalHorasEntregues + converterHorasParaDecimal(semana.horas_entregues || '0')
        }),
        { totalHorasAEntregar: 0, totalHorasEntregues: 0 }
    );

    const aderenciaPercentual = totalHorasAEntregar > 0
        ? (totalHorasEntregues / totalHorasAEntregar) * 100
        : 0;

    return {
        semana_ano: 'Geral',
        horas_a_entregar: totalHorasAEntregar.toFixed(2),
        horas_entregues: totalHorasEntregues.toFixed(2),
        aderencia_percentual: aderenciaPercentual
    };
}
