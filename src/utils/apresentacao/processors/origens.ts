import { converterHorasParaDecimal, formatarHorasParaHMS } from '@/utils/formatters';
import {
    calcularDiferenca,
    calcularDiferencaPercentual,
    formatarDiferenca,
    formatarDiferencaPercentual,
} from './common';
import { DadosBasicos } from './basicData';

export const processarOrigens = (dadosBasicos: DadosBasicos) => {
    const { semana1, semana2 } = dadosBasicos;
    if (!semana1 || !semana2) return [];

    // Use aderencia_origem (main) with fallback to origem (alias)
    const origensSemana1 = semana1.aderencia_origem || semana1.origem || [];
    const origensSemana2 = semana2.aderencia_origem || semana2.origem || [];
    const origensSemana1Map = new Map(
        origensSemana1.map((item) => [(item.origem || '').trim(), item])
    );
    const origensSemana2Map = new Map(
        origensSemana2.map((item) => [(item.origem || '').trim(), item])
    );

    const todasOrigens = Array.from(
        new Set([...origensSemana1Map.keys(), ...origensSemana2Map.keys()])
    )
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    return todasOrigens.map((origemNome) => {
        const origemSemana1 = origensSemana1Map.get(origemNome) || ({} as any);
        const origemSemana2 = origensSemana2Map.get(origemNome) || ({} as any);
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
    });
};
