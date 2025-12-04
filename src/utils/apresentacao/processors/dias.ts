import { converterHorasParaDecimal, formatarHorasParaHMS } from '@/utils/formatters';
import {
    calcularDiferenca,
    calcularDiferencaPercentual,
    formatarDiferenca,
    formatarDiferencaPercentual,
    diasOrdem,
    siglaDia,
} from './common';
import { DadosBasicos } from './basicData';

import { findDayData } from '@/utils/comparacaoHelpers';

export const processarDias = (dadosBasicos: DadosBasicos) => {
    const { semana1, semana2 } = dadosBasicos;
    if (!semana1 || !semana2) return { semana1Dias: [], semana2Dias: [] };

    // Use aderencia_dia (main) with fallback to dia (alias)
    const diasSemana1 = semana1.aderencia_dia || semana1.dia || [];
    const diasSemana2 = semana2.aderencia_dia || semana2.dia || [];

    const semana1Dias = diasOrdem.map((dia) => {
        const info = findDayData(dia, diasSemana1) || ({} as any);
        const horas = info?.segundos_realizados
            ? info.segundos_realizados / 3600
            : converterHorasParaDecimal(info?.horas_entregues || '0');
        return {
            nome: dia,
            sigla: siglaDia(dia),
            aderencia: info?.aderencia_percentual || 0,
            horasEntregues: formatarHorasParaHMS(horas.toString()),
        };
    });

    const semana2Dias = diasOrdem.map((dia) => {
        const info1 = findDayData(dia, diasSemana1) || ({} as any);
        const info2 = findDayData(dia, diasSemana2) || ({} as any);

        const horas1 = info1?.segundos_realizados
            ? info1.segundos_realizados / 3600
            : converterHorasParaDecimal(info1?.horas_entregues || '0');

        const horas2 = info2?.segundos_realizados
            ? info2.segundos_realizados / 3600
            : converterHorasParaDecimal(info2?.horas_entregues || '0');

        const aderencia1Dia = info1?.aderencia_percentual || 0;
        const aderencia2Dia = info2?.aderencia_percentual || 0;
        return {
            nome: dia,
            sigla: siglaDia(dia),
            aderencia: aderencia2Dia,
            horasEntregues: formatarHorasParaHMS(horas2.toString()),
            diferencaHoras: formatarDiferenca(calcularDiferenca(horas1, horas2), true),
            diferencaHorasPositiva: horas2 - horas1 >= 0,
            diferencaPercentualHoras: formatarDiferencaPercentual(calcularDiferencaPercentual(horas1, horas2)),
            diferencaPercentualHorasPositiva: calcularDiferencaPercentual(horas1, horas2) >= 0,
            diferencaAderencia: formatarDiferencaPercentual(calcularDiferencaPercentual(aderencia1Dia || 0.0001, aderencia2Dia || 0)),
            diferencaAderenciaPositiva: calcularDiferencaPercentual(aderencia1Dia || 0.0001, aderencia2Dia || 0) >= 0,
        };
    });

    return { semana1Dias, semana2Dias };
};
