import { useMemo } from 'react';
import { DashboardResumoData } from '@/types';
import { formatarHorasParaHMS, converterHorasParaDecimal } from '@/utils/formatters';
import { getWeeklyHours } from '@/utils/comparacaoHelpers';

export function useComparacaoAggregations(dadosComparacao: DashboardResumoData[]) {
    return useMemo(() => {
        const aderencias = dadosComparacao.map(d => d?.aderencia_semanal?.[0]?.aderencia_percentual ?? 0);
        const aderenciaMedia = Number((aderencias.reduce((a, b) => a + b, 0) / (aderencias.length || 1)).toFixed(1));

        const corridasPorSemana = dadosComparacao.map(d => d?.total_completadas ?? 0);
        const totalCorridas = corridasPorSemana.reduce((a, b) => a + b, 0);

        const horasDecimais = dadosComparacao.map(d => converterHorasParaDecimal(getWeeklyHours(d, 'horas_entregues')));
        const horasTotalDecimal = horasDecimais.reduce((a, b) => a + b, 0);
        const horasEntregues = formatarHorasParaHMS(horasTotalDecimal.toString());

        const ofertadas = dadosComparacao.reduce((sum, d) => sum + (d?.total_ofertadas ?? 0), 0);
        const aceitas = dadosComparacao.reduce((sum, d) => sum + (d?.total_aceitas ?? 0), 0);
        const taxaAceitacao = ofertadas > 0 ? ((aceitas / ofertadas) * 100).toFixed(1) : '0.0';

        const getVariation = (values: number[]) => {
            if (values.length < 2) return null;
            const first = values[0];
            const last = values[values.length - 1];
            if (first === 0 && last === 0) return 0;
            if (first === 0) return 100;
            return ((last - first) / first) * 100;
        };

        const aderenciaVar = getVariation(aderencias);
        const corridasVar = getVariation(corridasPorSemana);

        return {
            aderenciaMedia,
            totalCorridas,
            horasEntregues,
            taxaAceitacao,
            corridasPorSemana,
            aderenciaVar,
            corridasVar,
            ofertadas,
            aceitas
        };
    }, [dadosComparacao]);
}
