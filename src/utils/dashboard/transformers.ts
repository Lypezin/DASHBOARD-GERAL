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
    // Se já tem dia_da_semana (vindo do RPC), retorna como está
    if (diaData.dia_da_semana) {
        return diaData;
    }

    // Se tem data, calcula o dia da semana
    if (diaData.data) {
        const diasDaSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const dataObj = new Date(diaData.data + 'T00:00:00');

        // Validação básica de data
        if (isNaN(dataObj.getTime())) {
            return diaData;
        }

        const diaDaSemana = diasDaSemana[dataObj.getDay()];
        const diaIso = dataObj.getDay() === 0 ? 7 : dataObj.getDay(); // ISO: 1=Segunda, 7=Domingo

        return {
            ...diaData,
            dia_da_semana: diaDaSemana,
            dia_iso: diaIso
        };
    }

    return diaData;
};

export const transformDashboardData = (data: DashboardResumoData) => {
    const totals: Totals = {
        ofertadas: safeNumber(data.totais?.corridas_ofertadas ?? 0),
        aceitas: safeNumber(data.totais?.corridas_aceitas ?? 0),
        rejeitadas: safeNumber(data.totais?.corridas_rejeitadas ?? 0),
        completadas: safeNumber(data.totais?.corridas_completadas ?? 0),
    };

    const aderenciaSemanal: AderenciaSemanal[] = Array.isArray(data.semanal)
        ? data.semanal.map(item => ({
            ...item,
            horas_a_entregar: convertHorasToString(item.horas_a_entregar),
            horas_entregues: convertHorasToString(item.horas_entregues)
        }))
        : [];

    const aderenciaDia = Array.isArray(data.dia)
        ? data.dia.map(item => enrichAderenciaDia({
            ...item,
            horas_a_entregar: convertHorasToString(item.horas_a_entregar),
            horas_entregues: convertHorasToString(item.horas_entregues)
        }))
        : [];

    const aderenciaTurno: AderenciaTurno[] = Array.isArray(data.turno)
        ? data.turno.map(item => ({
            ...item,
            horas_a_entregar: convertHorasToString(item.horas_a_entregar),
            horas_entregues: convertHorasToString(item.horas_entregues)
        }))
        : [];

    const aderenciaSubPraca: AderenciaSubPraca[] = Array.isArray(data.sub_praca)
        ? data.sub_praca.map(item => ({
            ...item,
            horas_a_entregar: convertHorasToString(item.horas_a_entregar),
            horas_entregues: convertHorasToString(item.horas_entregues)
        }))
        : [];

    const aderenciaOrigem: AderenciaOrigem[] = Array.isArray(data.origem)
        ? data.origem.map(item => ({
            ...item,
            horas_a_entregar: convertHorasToString(item.horas_a_entregar),
            horas_entregues: convertHorasToString(item.horas_entregues)
        }))
        : [];

    return {
        totals,
        aderenciaSemanal,
        aderenciaDia,
        aderenciaTurno,
        aderenciaSubPraca,
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
