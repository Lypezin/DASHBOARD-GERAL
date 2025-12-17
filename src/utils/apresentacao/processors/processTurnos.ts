import { converterHorasParaDecimal } from '@/utils/formatters';
import { DashboardResumoData, AderenciaTurno } from '@/types';
import { formatSigned, formatHMS, chunkArray, TURNOS_PER_PAGE } from '../printHelpers';

export function processTurnos(
    semana1: DashboardResumoData | null,
    semana2: DashboardResumoData | null
) {
    const turnosSemana1 = semana1?.aderencia_turno || [];
    const turnosSemana2 = semana2?.aderencia_turno || [];
    const turnosSemana1Map = new Map(turnosSemana1.map((t: AderenciaTurno) => [String(t.turno || '').trim(), t]));
    const turnosSemana2Map = new Map(turnosSemana2.map((t: AderenciaTurno) => [String(t.turno || '').trim(), t]));
    const todosTurnos = Array.from(new Set([...turnosSemana1Map.keys(), ...turnosSemana2Map.keys()])) as string[];
    todosTurnos.sort((a, b) => a.localeCompare(b, 'pt-BR'));

    const turnosComparativo = todosTurnos.map((nomeTurno) => {
        const t1 = turnosSemana1Map.get(nomeTurno) || ({} as any);
        const t2 = turnosSemana2Map.get(nomeTurno) || ({} as any);
        const h1 = converterHorasParaDecimal(t1?.horas_entregues || '0');
        const h2 = converterHorasParaDecimal(t2?.horas_entregues || '0');
        const a1 = t1?.aderencia_percentual || 0;
        const a2 = t2?.aderencia_percentual || 0;

        const difHoras = h2 - h1;
        const difPercentHoras = ((h2 - h1) / (h1 || 1)) * 100;
        const difAderencia = ((a2 - a1) / (a1 || 1)) * 100;

        return {
            nome: nomeTurno.toUpperCase(),
            semana1: { aderencia: a1, horasEntregues: formatHMS(Math.abs(h1).toString()) },
            semana2: { aderencia: a2, horasEntregues: formatHMS(Math.abs(h2).toString()) },
            variacoes: [
                { label: 'Δ Horas', valor: `${difHoras > 0 ? '+' : difHoras < 0 ? '−' : ''}${formatHMS(Math.abs(difHoras).toString())}`, positivo: difHoras >= 0 },
                { label: '% Horas', valor: formatSigned(difPercentHoras), positivo: difPercentHoras >= 0 },
                { label: '% Aderência', valor: formatSigned(difAderencia), positivo: difAderencia >= 0 },
            ],
        };
    });

    return chunkArray(turnosComparativo, TURNOS_PER_PAGE);
}
