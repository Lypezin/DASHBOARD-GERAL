import { converterHorasParaDecimal, formatarHorasParaHMS } from '@/utils/formatters';
import {
    calcularDiferenca,
    calcularDiferencaPercentual,
    formatarDiferenca,
    formatarDiferencaPercentual,
} from './common';
import { DadosBasicos } from './basicData';

export const processarSubPracas = (dadosBasicos: DadosBasicos) => {
    const { semana1, semana2 } = dadosBasicos;
    if (!semana1 || !semana2) return [];

    // Use aderencia_sub_praca (main) with fallback to sub_praca (alias)
    const subPracasSemana1 = semana1.aderencia_sub_praca || semana1.sub_praca || [];
    const subPracasSemana2 = semana2.aderencia_sub_praca || semana2.sub_praca || [];
    const subPracasSemana1Map = new Map(
        subPracasSemana1.map((item) => [(item.sub_praca || '').trim(), item])
    );
    const subPracasSemana2Map = new Map(
        subPracasSemana2.map((item) => [(item.sub_praca || '').trim(), item])
    );

    const todasSubPracas = Array.from(
        new Set([...subPracasSemana1Map.keys(), ...subPracasSemana2Map.keys()])
    )
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    return todasSubPracas.map((nome) => {
        const itemSemana1 = subPracasSemana1Map.get(nome) || ({} as any);
        const itemSemana2 = subPracasSemana2Map.get(nome) || ({} as any);
        const horasPlanejadasBase = itemSemana1?.segundos_planejados
            ? itemSemana1.segundos_planejados / 3600
            : itemSemana2?.segundos_planejados
                ? itemSemana2.segundos_planejados / 3600
                : converterHorasParaDecimal(
                    itemSemana1?.horas_a_entregar || itemSemana2?.horas_a_entregar || '0'
                );

        const horasSem1 = itemSemana1?.segundos_realizados
            ? itemSemana1.segundos_realizados / 3600
            : converterHorasParaDecimal(itemSemana1?.horas_entregues || '0');

        const horasSem2 = itemSemana2?.segundos_realizados
            ? itemSemana2.segundos_realizados / 3600
            : converterHorasParaDecimal(itemSemana2?.horas_entregues || '0');
        const aderenciaSem1 = itemSemana1?.aderencia_percentual || 0;
        const aderenciaSem2 = itemSemana2?.aderencia_percentual || 0;

        const diffHoras = calcularDiferenca(horasSem1, horasSem2);
        const diffHorasPercent = calcularDiferencaPercentual(horasSem1, horasSem2);
        const diffAderenciaPercent = calcularDiferencaPercentual(aderenciaSem1, aderenciaSem2);

        return {
            nome: nome.toUpperCase(),
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
