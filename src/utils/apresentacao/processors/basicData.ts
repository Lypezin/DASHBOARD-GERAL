import { DashboardResumoData } from '@/types';
import { converterHorasParaDecimal } from '@/utils/formatters';
import {
    extrairNumeroSemana,
    calcularPeriodoSemana,
} from './common';

export interface DadosBasicos {
    semana1: DashboardResumoData | null;
    semana2: DashboardResumoData | null;
    numeroSemana1: string;
    numeroSemana2: string;
    periodoSemana1: string;
    periodoSemana2: string;
    aderencia1: number;
    aderencia2: number;
    horasEntregues1: number;
    horasEntregues2: number;
    horasPlanejadas1: number;
    horasPlanejadas2: number;
}

export const processarDadosBasicos = (
    dadosComparacao: DashboardResumoData[],
    semanasSelecionadas: string[]
): DadosBasicos => {
    if (!dadosComparacao || dadosComparacao.length < 2) {
        return {
            semana1: null,
            semana2: null,
            numeroSemana1: '—',
            numeroSemana2: '—',
            periodoSemana1: '',
            periodoSemana2: '',
            aderencia1: 0,
            aderencia2: 0,
            horasEntregues1: 0,
            horasEntregues2: 0,
            horasPlanejadas1: 0,
            horasPlanejadas2: 0,
        };
    }

    const sem1 = dadosComparacao[0];
    const sem2 = dadosComparacao[1];
    const semanaSelecionada1 = semanasSelecionadas[0] ?? '';
    const semanaSelecionada2 = semanasSelecionadas[1] ?? '';
    const numSem1 = extrairNumeroSemana(semanaSelecionada1) || semanaSelecionada1 || '—';
    const numSem2 = extrairNumeroSemana(semanaSelecionada2) || semanaSelecionada2 || '—';

    return {
        semana1: sem1,
        semana2: sem2,
        numeroSemana1: numSem1,
        numeroSemana2: numSem2,
        periodoSemana1: calcularPeriodoSemana(numSem1),
        periodoSemana2: calcularPeriodoSemana(numSem2),
        aderencia1: sem1?.aderencia_semanal?.[0]?.aderencia_percentual || 0,
        aderencia2: sem2?.aderencia_semanal?.[0]?.aderencia_percentual || 0,
        horasEntregues1: converterHorasParaDecimal(sem1?.aderencia_semanal?.[0]?.horas_entregues || '0'),
        horasEntregues2: converterHorasParaDecimal(sem2?.aderencia_semanal?.[0]?.horas_entregues || '0'),
        horasPlanejadas1: converterHorasParaDecimal(sem1?.aderencia_semanal?.[0]?.horas_a_entregar || '0'),
        horasPlanejadas2: converterHorasParaDecimal(sem2?.aderencia_semanal?.[0]?.horas_a_entregar || '0'),
    };
};
