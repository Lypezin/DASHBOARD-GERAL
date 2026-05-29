import { converterHorasParaDecimal } from '@/utils/formatters';
import { DashboardResumoData, AderenciaSubPraca } from '@/types';
import { formatSigned, formatHMS, chunkArray, SUB_PRACAS_PER_PAGE } from '../printHelpers';

export function processSubPracas(
    semana1: DashboardResumoData | null,
    semana2: DashboardResumoData | null
) {
    const subPracasSemana1 = semana1?.aderencia_sub_praca || [];
    const subPracasSemana2 = semana2?.aderencia_sub_praca || [];
    const subPracasSemana1Map = new Map(subPracasSemana1.map((i: AderenciaSubPraca) => [String(i.sub_praca || '').trim(), i]));
    const subPracasSemana2Map = new Map(subPracasSemana2.map((i: AderenciaSubPraca) => [String(i.sub_praca || '').trim(), i]));
    const todasSubPracas = Array.from(new Set([...subPracasSemana1Map.keys(), ...subPracasSemana2Map.keys()])) as string[];
    todasSubPracas.sort((a, b) => a.localeCompare(b, 'pt-BR'));

    const subPracasComparativo = todasSubPracas.map((nome) => {
        const itemSemana1 = subPracasSemana1Map.get(nome) || ({} as any);
        const itemSemana2 = subPracasSemana2Map.get(nome) || ({} as any);
        const horasPlanejadasBase = converterHorasParaDecimal(itemSemana1?.horas_a_entregar || itemSemana2?.horas_a_entregar || '0');
        const horasSem1 = converterHorasParaDecimal(itemSemana1?.horas_entregues || '0');
        const horasSem2 = converterHorasParaDecimal(itemSemana2?.horas_entregues || '0');
        const aderenciaSem1 = itemSemana1?.aderencia_percentual || 0;
        const aderenciaSem2 = itemSemana2?.aderencia_percentual || 0;

        return {
            nome: nome.toUpperCase(),
            horasPlanejadas: formatHMS(Math.abs(horasPlanejadasBase).toString()),
            semana1: { aderencia: aderenciaSem1, horasEntregues: formatHMS(Math.abs(horasSem1).toString()) },
            semana2: { aderencia: aderenciaSem2, horasEntregues: formatHMS(Math.abs(horasSem2).toString()) },
            variacoes: [
                {
                    label: 'Δ Horas', valor: (() => {
                        const dif = horasSem2 - horasSem1;
                        const prefix = dif > 0 ? '+' : dif < 0 ? '−' : '';
                        return `${prefix}${formatHMS(Math.abs(dif).toString())}`;
                    })(), positivo: horasSem2 - horasSem1 >= 0
                },
                { label: '% Horas', valor: formatSigned(((horasSem2 - horasSem1) / (horasSem1 || 1)) * 100), positivo: ((horasSem2 - horasSem1) / (horasSem1 || 1)) * 100 >= 0 },
                { label: '% Aderência', valor: formatSigned(((aderenciaSem2 - aderenciaSem1) / (aderenciaSem1 || 1)) * 100), positivo: ((aderenciaSem2 - aderenciaSem1) / (aderenciaSem1 || 1)) * 100 >= 0 },
            ],
        };
    });

    return chunkArray(subPracasComparativo, SUB_PRACAS_PER_PAGE);
}
