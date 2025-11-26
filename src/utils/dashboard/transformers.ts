import {
    AderenciaSemanal,
    AderenciaDia,
    AderenciaTurno,
    AderenciaSubPraca,
    AderenciaOrigem,
    DashboardResumoData,
    Totals
} from '@/types';
import { safeNumber } from '@/utils/helpers';

export const convertHorasToString = (value: number | string | undefined | null): string => {
    if (value === undefined || value === null) return '0';
    if (typeof value === 'string') return value;
    return String(value);
};

/**
 * Enriquece os dados de AderenciaDia calculando dia_da_semana e dia_iso a partir da data
 */
export const enrichAderenciaDia = (diaData: AderenciaDia) => {
    const diasDaSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const dataObj = new Date(diaData.data + 'T00:00:00');
    const diaDaSemana = diasDaSemana[dataObj.getDay()];
    const diaIso = dataObj.getDay() === 0 ? 7 : dataObj.getDay(); // ISO: 1=Segunda, 7=Domingo

    return {
        ...diaData,
        aderenciaOrigem,
        dimensoes: data.dimensoes
    };
};

export const createEmptyDashboardData = (): DashboardResumoData => ({
    totais: { corridas_ofertadas: 0, corridas_aceitas: 0, corridas_rejeitadas: 0, corridas_completadas: 0 },
    semanal: [],
    dia: [],
    turno: [],
    sub_praca: [],
    origem: [],
    dimensoes: { anos: [], semanas: [], pracas: [], sub_pracas: [], origens: [], turnos: [] }
});
