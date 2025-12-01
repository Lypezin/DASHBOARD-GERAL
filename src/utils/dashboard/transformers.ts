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
import { formatarHorasParaHMS } from '@/utils/formatters';

export const convertHorasToString = (value: number | string | undefined | null): string => {
    if (value === undefined || value === null) return '0';
    if (typeof value === 'string') return value;
    return String(value);
};

const processSeconds = (val: number | string | undefined | null): string => {
    if (val === undefined || val === null) return '00:00:00';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '00:00:00';
    // If it's already formatted as HH:MM:SS (unlikely for seconds field but possible if field reused)
    if (typeof val === 'string' && val.includes(':')) return val;

    return formatarHorasParaHMS(num / 3600);
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
                ofertadas: empty.total_ofertadas,
                aceitas: empty.total_aceitas,
                rejeitadas: empty.total_rejeitadas,
                completadas: empty.total_completadas,
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
            // Convert seconds to HH:MM:SS if needed
            const horasAEntregar = item.horas_a_entregar || item.segundos_planejados || 0;
            const horasEntregues = item.horas_entregues || item.segundos_realizados || 0;

            return {
                ...item,
                horas_a_entregar: processSeconds(item.horas_a_entregar || item.segundos_planejados),
                horas_entregues: processSeconds(item.horas_entregues || item.segundos_realizados)
            };
        })
        : [];

    const rawDia = (isFlat ? rawData.aderencia_dia : rawData.dia) || [];
    const aderenciaDia = Array.isArray(rawDia)
        ? rawDia.map((item: any) => {
            // Convert seconds to HH:MM:SS if needed
            const horasAEntregar = item.horas_a_entregar || item.segundos_planejados || 0;
            const horasEntregues = item.horas_entregues || item.segundos_realizados || 0;

            return enrichAderenciaDia({
                ...item,
                horas_a_entregar: processSeconds(item.horas_a_entregar || item.segundos_planejados),
                horas_entregues: processSeconds(item.horas_entregues || item.segundos_realizados),
                // Support both field names from RPC
                dia_da_semana: item.dia_da_semana || item.dia_semana
            });
        })
        : [];

    const rawTurno = (isFlat ? rawData.aderencia_turno : rawData.turno) || [];
    const aderenciaTurno: AderenciaTurno[] = Array.isArray(rawTurno)
        ? rawTurno.map((item: any) => {
            const horasAEntregar = item.horas_a_entregar || item.segundos_planejados || 0;
            const horasEntregues = item.horas_entregues || item.segundos_realizados || 0;

            return {
                ...item,
                horas_a_entregar: processSeconds(item.horas_a_entregar || item.segundos_planejados),
                horas_entregues: processSeconds(item.horas_entregues || item.segundos_realizados)
            };
        })
        : [];

    const rawSubPraca = (isFlat ? rawData.aderencia_sub_praca : rawData.sub_praca) || [];
    const aderenciaSubPraca: AderenciaSubPraca[] = Array.isArray(rawSubPraca)
        ? rawSubPraca.map((item: any) => {
            const horasAEntregar = item.horas_a_entregar || item.segundos_planejados || 0;
            const horasEntregues = item.horas_entregues || item.segundos_realizados || 0;

            return {
                ...item,
                horas_a_entregar: processSeconds(item.horas_a_entregar || item.segundos_planejados),
                horas_entregues: processSeconds(item.horas_entregues || item.segundos_realizados)
            };
        })
        : [];

    const rawOrigem = (isFlat ? rawData.aderencia_origem : rawData.origem) || [];
    const aderenciaOrigem: AderenciaOrigem[] = Array.isArray(rawOrigem)
        ? rawOrigem.map((item: any) => {
            const horasAEntregar = item.horas_a_entregar || item.segundos_planejados || 0;
            const horasEntregues = item.horas_entregues || item.segundos_realizados || 0;

            return {
                ...item,
                horas_a_entregar: processSeconds(item.horas_a_entregar || item.segundos_planejados),
                horas_entregues: processSeconds(item.horas_entregues || item.segundos_realizados)
            };
        })
        : [];

    return {
        totals,
        aderencia_semanal: aderenciaSemanal,
        aderencia_dia: aderenciaDia,
        aderencia_turno: aderenciaTurno,
        aderencia_sub_praca: aderenciaSubPraca,
        aderencia_origem: aderenciaOrigem,
        dimensoes: rawData.dimensoes || { anos: [], semanas: [], pracas: [], sub_pracas: [], origens: [], turnos: [] }
    };
};

export const createEmptyDashboardData = (): DashboardResumoData => ({
    total_ofertadas: 0,
    total_aceitas: 0,
    total_completadas: 0,
    total_rejeitadas: 0,
    aderencia_semanal: [],
    aderencia_dia: [],
    aderencia_turno: [],
    aderencia_sub_praca: [],
    aderencia_origem: [],
    dimensoes: { anos: [], semanas: [], pracas: [], sub_pracas: [], origens: [], turnos: [] }
});
