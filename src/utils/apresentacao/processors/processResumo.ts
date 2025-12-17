import { converterHorasParaDecimal } from '@/utils/formatters';
import { DashboardResumoData } from '@/types';
import { formatSigned, formatHMS } from '../printHelpers';

export function processResumo(
    semana1: DashboardResumoData | null,
    semana2: DashboardResumoData | null,
    numeroSemana1: string,
    numeroSemana2: string
) {
    const aderencia1 = semana1?.aderencia_semanal?.[0]?.aderencia_percentual || 0;
    const aderencia2 = semana2?.aderencia_semanal?.[0]?.aderencia_percentual || 0;
    const horasEntregues1 = converterHorasParaDecimal(semana1?.aderencia_semanal?.[0]?.horas_entregues || '0');
    const horasEntregues2 = converterHorasParaDecimal(semana2?.aderencia_semanal?.[0]?.horas_entregues || '0');
    const horasPlanejadas1 = converterHorasParaDecimal(semana1?.aderencia_semanal?.[0]?.horas_a_entregar || '0');
    const horasPlanejadas2 = converterHorasParaDecimal(semana2?.aderencia_semanal?.[0]?.horas_a_entregar || '0');

    const resumoSemana1 = {
        numeroSemana: numeroSemana1,
        aderencia: aderencia1,
        horasPlanejadas: formatHMS(Math.abs(horasPlanejadas1).toString()),
        horasEntregues: formatHMS(Math.abs(horasEntregues1).toString()),
    };
    const resumoSemana2 = {
        numeroSemana: numeroSemana2,
        aderencia: aderencia2,
        horasPlanejadas: formatHMS(Math.abs(horasPlanejadas2).toString()),
        horasEntregues: formatHMS(Math.abs(horasEntregues2).toString()),
    };
    const variacaoResumo = {
        horasDiferenca: (() => {
            const dif = horasEntregues2 - horasEntregues1;
            const prefix = dif > 0 ? '+' : dif < 0 ? '−' : '';
            return `${prefix}${formatHMS(Math.abs(dif).toString())}`;
        })(),
        horasPercentual: formatSigned(((horasEntregues2 - horasEntregues1) / (horasEntregues1 || 1)) * 100),
        positiva: horasEntregues2 >= horasEntregues1,
    };

    return { resumoSemana1, resumoSemana2, variacaoResumo };
}
