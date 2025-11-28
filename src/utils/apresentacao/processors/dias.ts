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

export const processarDias = (dadosBasicos: DadosBasicos) => {
    const { semana1, semana2 } = dadosBasicos;
    if (!semana1 || !semana2) return { semana1Dias: [], semana2Dias: [] };

    const diasSemana1Map = new Map((semana1.dia || []).map((item) => [item.dia_da_semana, item]));
    const diasSemana2Map = new Map((semana2.dia || []).map((item) => [item.dia_da_semana, item]));

    const semana1Dias = diasOrdem.map((dia) => {
        const info = diasSemana1Map.get(dia) || ({} as any);
        const horas = converterHorasParaDecimal(info?.horas_entregues || '0');
        return {
            nome: dia,
            sigla: siglaDia(dia),
            aderencia: info?.aderencia_percentual || 0,
            horasEntregues: formatarHorasParaHMS(horas.toString()),
        };
    });

    const semana2Dias = diasOrdem.map((dia) => {
        const info1 = diasSemana1Map.get(dia) || ({} as any);
        const info2 = diasSemana2Map.get(dia) || ({} as any);
        const horas1 = converterHorasParaDecimal(info1?.horas_entregues || '0');
        const horas2 = converterHorasParaDecimal(info2?.horas_entregues || '0');
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
