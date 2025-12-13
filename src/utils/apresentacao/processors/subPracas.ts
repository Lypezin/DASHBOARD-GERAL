import { converterHorasParaDecimal, formatarHorasParaHMS } from '@/utils/formatters';
import {
    calcularDiferenca,
    calcularDiferencaPercentual,
    formatarDiferenca,
    formatarDiferencaPercentual,
} from './common';
import { DadosBasicos } from './basicData';

// Normalize key for robust matching (strips accents, spaces, punctuation)
const normalizeKey = (key: string) => {
    return (key || '')
        .trim()
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^A-Z0-9]/g, ''); // Remove all non-alphanumeric chars
};

// Clean display name (just trim and uppercase, preserve spacing)
const cleanDisplayName = (name: string) => {
    return (name || '').trim().toUpperCase();
};

export const processarSubPracas = (dadosBasicos: DadosBasicos) => {
    const { semana1, semana2 } = dadosBasicos;
    if (!semana1 || !semana2) return [];

    const subPracasSemana1 = semana1.aderencia_sub_praca || semana1.sub_praca || [];
    const subPracasSemana2 = semana2.aderencia_sub_praca || semana2.sub_praca || [];

    // Build maps: normalizedKey -> { item, originalName }
    const subPracasSemana1Map = new Map<string, { item: any; originalName: string }>();
    subPracasSemana1.forEach((item) => {
        const key = normalizeKey(item.sub_praca);
        subPracasSemana1Map.set(key, { item, originalName: cleanDisplayName(item.sub_praca) });
    });

    const subPracasSemana2Map = new Map<string, { item: any; originalName: string }>();
    subPracasSemana2.forEach((item) => {
        const key = normalizeKey(item.sub_praca);
        subPracasSemana2Map.set(key, { item, originalName: cleanDisplayName(item.sub_praca) });
    });

    // Get all unique normalized keys
    const todasSubPracasKeys = Array.from(
        new Set([...subPracasSemana1Map.keys(), ...subPracasSemana2Map.keys()])
    )
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    return todasSubPracasKeys.map((normalizedKey) => {
        const entry1 = subPracasSemana1Map.get(normalizedKey);
        const entry2 = subPracasSemana2Map.get(normalizedKey);

        const itemSemana1 = entry1?.item || ({} as any);
        const itemSemana2 = entry2?.item || ({} as any);

        // Use original name from either week (prefer week 2 if available)
        const displayName = entry2?.originalName || entry1?.originalName || normalizedKey;

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
            nome: displayName,
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
