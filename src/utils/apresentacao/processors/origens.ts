import { converterHorasParaDecimal, formatarHorasParaHMS } from '@/utils/formatters';
import {
    calcularDiferenca,
    calcularDiferencaPercentual,
    formatarDiferenca,
    formatarDiferencaPercentual,
} from './common';
import { DadosBasicos } from './basicData';

export interface OrigemProcessada {
    nome: string;
    horasPlanejadas: string;
    semana1: { aderencia: number; horasEntregues: string };
    semana2: { aderencia: number; horasEntregues: string };
    variacoes: Array<{ label: string; valor: string; positivo: boolean }>;
}

export interface OrigensProcessadasResult {
    origens: OrigemProcessada[];
    media: OrigemProcessada | null;
}

export const processarOrigens = (dadosBasicos: DadosBasicos): OrigensProcessadasResult => {
    const { semana1, semana2 } = dadosBasicos;
    if (!semana1 || !semana2) return { origens: [], media: null };

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

    const ativasSem1 = origensSemana1.filter(x => x && x.origem && x.aderencia_percentual > 0);
    const mediaAderenciaSem1 = ativasSem1.length > 0
        ? ativasSem1.reduce((acc, curr) => acc + curr.aderencia_percentual, 0) / ativasSem1.length
        : 0;

    const ativasSem2 = origensSemana2.filter(x => x && x.origem && x.aderencia_percentual > 0);
    const mediaAderenciaSem2 = ativasSem2.length > 0
        ? ativasSem2.reduce((acc, curr) => acc + curr.aderencia_percentual, 0) / ativasSem2.length
        : 0;

    const totalHorasPlanejadasSem1 = origensSemana1.reduce((acc, curr) => acc + (curr.segundos_planejados ? curr.segundos_planejados / 3600 : converterHorasParaDecimal(curr.horas_a_entregar || '0')), 0);
    const totalHorasPlanejadasSem2 = origensSemana2.reduce((acc, curr) => acc + (curr.segundos_planejados ? curr.segundos_planejados / 3600 : converterHorasParaDecimal(curr.horas_a_entregar || '0')), 0);

    const mediaHorasPlanejadas = ((totalHorasPlanejadasSem1 / (origensSemana1.length || 1)) + (totalHorasPlanejadasSem2 / (origensSemana2.length || 1))) / 2;

    const origensProcessadas = todasOrigens.map((origemNome) => {
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

    const diffAderenciaMediaPercent = calcularDiferencaPercentual(mediaAderenciaSem1, mediaAderenciaSem2);

    const mediaGeralObj: OrigemProcessada = {
        nome: 'MÉDIA DAS ORIGENS',
        horasPlanejadas: formatarHorasParaHMS(Math.abs(mediaHorasPlanejadas).toString()),
        semana1: {
            aderencia: mediaAderenciaSem1,
            horasEntregues: '-',
        },
        semana2: {
            aderencia: mediaAderenciaSem2,
            horasEntregues: '-',
        },
        variacoes: [
            {
                label: '% Aderência',
                valor: formatarDiferencaPercentual(diffAderenciaMediaPercent),
                positivo: diffAderenciaMediaPercent >= 0,
            },
        ],
    };

    return {
        origens: origensProcessadas,
        media: origensProcessadas.length > 0 ? mediaGeralObj : null
    };
};
