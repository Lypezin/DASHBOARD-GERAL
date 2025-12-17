import { converterHorasParaDecimal } from '@/utils/formatters';
import { DashboardResumoData, AderenciaOrigem } from '@/types';
import { formatSigned, formatHMS, chunkArray, ORIGENS_PER_PAGE } from '../printHelpers';

export function processOrigens(
    semana1: DashboardResumoData | null,
    semana2: DashboardResumoData | null
) {
    const origensSemana1 = semana1?.aderencia_origem || [];
    const origensSemana2 = semana2?.aderencia_origem || [];
    const origensSemana1Map = new Map(origensSemana1.map((o: AderenciaOrigem) => [String(o.origem || '').trim(), o]));
    const origensSemana2Map = new Map(origensSemana2.map((o: AderenciaOrigem) => [String(o.origem || '').trim(), o]));
    const todasOrigens = Array.from(new Set([...origensSemana1Map.keys(), ...origensSemana2Map.keys()])) as string[];
    todasOrigens.sort((a, b) => a.localeCompare(b, 'pt-BR'));

    const origensComparativo = todasOrigens.map((nome) => {
        const o1 = origensSemana1Map.get(nome) || ({} as any);
        const o2 = origensSemana2Map.get(nome) || ({} as any);
        const horasPlanejadasBase = converterHorasParaDecimal(o1?.horas_a_entregar || o2?.horas_a_entregar || '0');
        const h1 = converterHorasParaDecimal(o1?.horas_entregues || '0');
        const h2 = converterHorasParaDecimal(o2?.horas_entregues || '0');
        const a1 = o1?.aderencia_percentual || 0;
        const a2 = o2?.aderencia_percentual || 0;

        const difHoras = h2 - h1;
        const difPercentHoras = ((h2 - h1) / (h1 || 1)) * 100;
        const difAderencia = ((a2 - a1) / (a1 || 1)) * 100;

        return {
            nome: nome.toUpperCase(),
            horasPlanejadas: formatHMS(Math.abs(horasPlanejadasBase).toString()),
            semana1: { aderencia: a1, horasEntregues: formatHMS(Math.abs(h1).toString()) },
            semana2: { aderencia: a2, horasEntregues: formatHMS(Math.abs(h2).toString()) },
            variacoes: [
                { label: 'Δ Horas', valor: `${difHoras > 0 ? '+' : difHoras < 0 ? '−' : ''}${formatHMS(Math.abs(difHoras).toString())}`, positivo: difHoras >= 0 },
                { label: '% Horas', valor: formatSigned(difPercentHoras), positivo: difPercentHoras >= 0 },
                { label: '% Aderência', valor: formatSigned(difAderencia), positivo: difAderencia >= 0 },
            ],
        };
    });

    return chunkArray(origensComparativo, ORIGENS_PER_PAGE);
}
