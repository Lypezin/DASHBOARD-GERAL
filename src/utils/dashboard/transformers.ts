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

export const transformDashboardData = (data: any) => {
    // Handle array response from RPC (RETURNS TABLE) or single object
    const rawData = Array.isArray(data) ? (data[0] || {}) : data;

    if (!rawData) {
        const empty = createEmptyDashboardData();
        return {
            totals: {
                ofertadas: empty.totais.corridas_ofertadas,
                aceitas: empty.totais.corridas_aceitas,
                rejeitadas: empty.totais.corridas_rejeitadas,
                completadas: empty.totais.corridas_completadas,
            },
            aderenciaSemanal: [],
            aderenciaDia: [],
            aderenciaTurno: [],
            aderenciaSubPraca: [],
            aderenciaOrigem: [],
            dimensoes: empty.dimensoes
        };
    }

    // Check if it's the new flat format (from RPC RETURNS TABLE) or the old nested format
    // New format has keys like 'total_ofertadas', 'aderencia_semanal'
    // Old format has keys like 'totais', 'semanal'
    const isFlat = 'total_ofertadas' in rawData || 'aderencia_semanal' in rawData;

    const totals: Totals = {
        ofertadas: safeNumber(isFlat ? rawData.total_ofertadas : rawData.totais?.corridas_ofertadas ?? 0),
        aceitas: safeNumber(isFlat ? rawData.total_aceitas : rawData.totais?.corridas_aceitas ?? 0),
        rejeitadas: safeNumber(isFlat ? rawData.total_rejeitadas : rawData.totais?.corridas_rejeitadas ?? 0),
        completadas: safeNumber(isFlat ? rawData.total_completadas : rawData.totais?.corridas_completadas ?? 0),
    };

    const rawSemanal = (isFlat ? rawData.aderencia_semanal : rawData.semanal) || [];
    const aderenciaSemanal: AderenciaSemanal[] = Array.isArray(rawSemanal)
        ? rawSemanal.map((item: any) => {
            return {
                ...item,
                horas_a_entregar: convertHorasToString(item.horas_a_entregar || item.segundos_planejados || 0),
                horas_entregues: convertHorasToString(item.horas_entregues || item.segundos_realizados || 0)
            };
        })
        : [];

    const rawDia = (isFlat ? rawData.aderencia_dia : rawData.dia) || [];
    const aderenciaDia = Array.isArray(rawDia)
        ? rawDia.map((item: any) => {
            return enrichAderenciaDia({
                ...item,
                horas_a_entregar: convertHorasToString(item.horas_a_entregar || item.segundos_planejados || 0),
                horas_entregues: convertHorasToString(item.horas_entregues || item.segundos_realizados || 0),
                // Support both field names from RPC
                dia_da_semana: item.dia_da_semana || item.dia_semana
            });
        })
        : [];

    const rawTurno = (isFlat ? rawData.aderencia_turno : rawData.turno) || [];
    const aderenciaTurno: AderenciaTurno[] = Array.isArray(rawTurno)
        ? rawTurno.map((item: any) => ({
            ...item,
            horas_a_entregar: convertHorasToString(item.horas_a_entregar),
            horas_entregues: convertHorasToString(item.horas_entregues)
        }))
        : [];

    const rawSubPraca = (isFlat ? rawData.aderencia_sub_praca : rawData.sub_praca) || [];
    const aderenciaSubPraca: AderenciaSubPraca[] = Array.isArray(rawSubPraca)
        ? rawSubPraca.map((item: any) => ({
            ...item,
            horas_a_entregar: convertHorasToString(item.horas_a_entregar),
            horas_entregues: convertHorasToString(item.horas_entregues)
        }))
        : [];

    const rawOrigem = (isFlat ? rawData.aderencia_origem : rawData.origem) || [];
    const aderenciaOrigem: AderenciaOrigem[] = Array.isArray(rawOrigem)
        ? rawOrigem.map((item: any) => ({
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
        dimensoes: rawData.dimensoes || { anos: [], semanas: [], pracas: [], sub_pracas: [], origens: [], turnos: [] }
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
