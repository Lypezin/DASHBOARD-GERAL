import { converterHorasParaDecimal, formatarHorasParaHMS } from '@/utils/formatters';
import {
    calcularDiferenca,
    calcularDiferencaPercentual,
    formatarDiferenca,
    formatarDiferencaPercentual,
} from './common';
import { DadosBasicos } from './basicData';

export const processarTurnos = (dadosBasicos: DadosBasicos) => {
    const { semana1, semana2 } = dadosBasicos;
    if (!semana1 || !semana2) return [];

    const turnosSemana1 = semana1.turno || [];
    const turnosSemana2 = semana2.turno || [];
    const turnosSemana1Map = new Map(
        turnosSemana1.map((turno) => [(turno.turno || '').trim(), turno])
    );
    const turnosSemana2Map = new Map(
        turnosSemana2.map((turno) => [(turno.turno || '').trim(), turno])
    );

    const todosTurnos = Array.from(
        new Set([...turnosSemana1Map.keys(), ...turnosSemana2Map.keys()])
    )
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    return todosTurnos.map((nomeTurno) => {
        const turnoSemana1 = turnosSemana1Map.get(nomeTurno) || ({} as any);
        const turnoSemana2 = turnosSemana2Map.get(nomeTurno) || ({} as any);
        const horasSem1 = converterHorasParaDecimal(turnoSemana1?.horas_entregues || '0');
        const horasSem2 = converterHorasParaDecimal(turnoSemana2?.horas_entregues || '0');
        const aderenciaSem1 = turnoSemana1?.aderencia_percentual || 0;
        const aderenciaSem2 = turnoSemana2?.aderencia_percentual || 0;

        const diffHoras = calcularDiferenca(horasSem1, horasSem2);
        const diffHorasPercent = calcularDiferencaPercentual(horasSem1, horasSem2);
        const diffAderenciaPercent = calcularDiferencaPercentual(aderenciaSem1, aderenciaSem2);

        return {
            nome: nomeTurno.toUpperCase(),
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
