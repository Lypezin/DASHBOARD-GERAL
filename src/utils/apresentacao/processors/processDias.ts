import { converterHorasParaDecimal } from '@/utils/formatters';
import { DashboardResumoData, AderenciaDia } from '@/types';
import { formatSigned, formatHMS, diasOrdem, siglaDia } from '../printHelpers';

export function processDias(
    semana1: DashboardResumoData | null,
    semana2: DashboardResumoData | null
) {
    const diasSemana1Map = new Map((semana1?.aderencia_dia || []).map((d: AderenciaDia) => [d.dia_da_semana, d]));
    const diasSemana2Map = new Map((semana2?.aderencia_dia || []).map((d: AderenciaDia) => [d.dia_da_semana, d]));

    const semana1Dias = diasOrdem.map((dia) => {
        const info = diasSemana1Map.get(dia) || ({} as Partial<AderenciaDia>);
        const horas = converterHorasParaDecimal(info?.horas_entregues || '0');
        return { nome: dia, sigla: siglaDia(dia), aderencia: info?.aderencia_percentual || 0, horasEntregues: formatHMS(horas.toString()) };
    });

    const semana2Dias = diasOrdem.map((dia) => {
        const info1 = diasSemana1Map.get(dia) || ({} as Partial<AderenciaDia>);
        const info2 = diasSemana2Map.get(dia) || ({} as Partial<AderenciaDia>);
        const horas1 = converterHorasParaDecimal(info1?.horas_entregues || '0');
        const horas2 = converterHorasParaDecimal(info2?.horas_entregues || '0');
        const aderencia1Dia = info1?.aderencia_percentual || 0;
        const aderencia2Dia = info2?.aderencia_percentual || 0;
        const difHoras = horas2 - horas1;
        const difPercentHoras = ((horas2 - horas1) / (horas1 || 1)) * 100;
        const difAderencia = ((aderencia2Dia - aderencia1Dia) / (aderencia1Dia || 1)) * 100;

        return {
            nome: dia, sigla: siglaDia(dia), aderencia: aderencia2Dia, horasEntregues: formatHMS(horas2.toString()),
            diferencaHoras: `${difHoras > 0 ? '+' : difHoras < 0 ? '−' : ''}${formatHMS(Math.abs(difHoras).toString())}`,
            diferencaHorasPositiva: difHoras >= 0,
            diferencaPercentualHoras: formatSigned(difPercentHoras),
            diferencaPercentualHorasPositiva: difPercentHoras >= 0,
            diferencaAderencia: formatSigned(difAderencia),
            diferencaAderenciaPositiva: difAderencia >= 0,
        };
    });

    return { semana1Dias, semana2Dias };
}
