
import { useMemo } from 'react';
import { AderenciaSemanal } from '@/types';
import { formatarHorasParaHMS, converterHorasParaDecimal } from '@/utils/formatters';

export function useGeneralStats(aderenciaGeral?: AderenciaSemanal) {
    return useMemo(() => {
        if (!aderenciaGeral) return null;
        const planejadoStr = aderenciaGeral.horas_a_entregar || '0';
        const entregueStr = aderenciaGeral.horas_entregues || '0';

        const planejado = converterHorasParaDecimal(planejadoStr);
        const entregue = converterHorasParaDecimal(entregueStr);
        const gap = Math.max(0, planejado - entregue);
        const percentual = aderenciaGeral.aderencia_percentual ?? 0;

        return {
            planejado: formatarHorasParaHMS(planejadoStr),
            entregue: formatarHorasParaHMS(entregueStr),
            gap: gap > 0 ? formatarHorasParaHMS(gap) : null,
            percentual,
            statusColor: percentual >= 90 ? 'text-emerald-700 dark:text-emerald-300' : percentual >= 70 ? 'text-[#236b91] dark:text-sky-300' : 'text-rose-700 dark:text-rose-300',
            progressColor: percentual >= 90 ? '#10b981' : percentual >= 70 ? '#3b82f6' : '#ef4444'
        };
    }, [aderenciaGeral]);
}
