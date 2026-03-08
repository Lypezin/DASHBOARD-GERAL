import { converterHorasParaDecimal, formatarHorasParaHMS } from '@/utils/formatters';
import {
    calcularDiferenca,
    calcularDiferencaPercentual,
    formatarDiferenca,
    formatarDiferencaPercentual,
} from './common';

export interface OrigemProcessada {
    nome: string;
    horasPlanejadas: string;
    semana1: { aderencia: number; horasEntregues: string };
    semana2: { aderencia: number; horasEntregues: string };
    variacoes: Array<{ label: string; valor: string; positivo: boolean }>;
}

export function processarOrigemIndividual(origemNome: string, origemSemana1: any, origemSemana2: any): OrigemProcessada {
    const horasPlanejadasBase = origemSemana1?.segundos_planejados
        ? origemSemana1.segundos_planejados / 3600
        : origemSemana2?.segundos_planejados
            ? origemSemana2.segundos_planejados / 3600
            : converterHorasParaDecimal(
                origemSemana1?.horas_a_entregar || origemSemana2?.horas_a_entregar || '0'
            );

    const horasSem1 = origemSemana1?.segundos_realizados
        ? origemSemana1.segundos_realizados / 3600
        : converterHorasParaDecimal(origemSemana1?.horas_entregues || '0');

    const horasSem2 = origemSemana2?.segundos_realizados
        ? origemSemana2.segundos_realizados / 3600
        : converterHorasParaDecimal(origemSemana2?.horas_entregues || '0');
    const aderenciaSem1 = origemSemana1?.aderencia_percentual || 0;
    const aderenciaSem2 = origemSemana2?.aderencia_percentual || 0;

    const diffHoras = calcularDiferenca(horasSem1, horasSem2);
    const diffHorasPercent = calcularDiferencaPercentual(horasSem1, horasSem2);
    const diffAderenciaPercent = calcularDiferencaPercentual(aderenciaSem1, aderenciaSem2);

    return {
        nome: origemNome.toUpperCase(),
        horasPlanejadas: formatarHorasParaHMS(Math.abs(horasPlanejadasBase).toString()),
        semana1: {
            aderencia: aderenciaSem1,
            horasEntregues: formatarHorasParaHMS(Math.abs(horasSem1).toString()),
        },
        semana2: {
            aderencia: aderenciaSem2,
            horasEntregues: formatarHorasParaHMS(Math.abs(horasSem2).toString()),
        },
        variacoes: [
            {
                label: 'Δ Horas',
                valor: formatarDiferenca(diffHoras, true),
                positivo: diffHoras >= 0,
            },
            {
                label: '% Horas',
                valor: formatarDiferencaPercentual(diffHorasPercent),
                positivo: diffHorasPercent >= 0,
            },
            {
                label: '% Aderência',
                valor: formatarDiferencaPercentual(diffAderenciaPercent),
                positivo: diffAderenciaPercent >= 0,
            },
        ],
    };
}
