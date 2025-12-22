import {
    Totals
} from '@/types';
import { safeNumber } from '@/utils/helpers';
import {
    processSeconds,
    enrichAderenciaDia,
    createEmptyDashboardData,
    convertHorasToString
} from './transformers/helpers';

export { convertHorasToString, enrichAderenciaDia, createEmptyDashboardData };

const mapAdherenceData = (data: any[], isDia: boolean = false) => {
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => {
        const mapped = {
            ...item,
            horas_a_entregar: processSeconds(item.horas_a_entregar || item.segundos_planejados),
            horas_entregues: processSeconds(item.horas_entregues || item.segundos_realizados)
        };

        if (isDia) {
            mapped.dia_da_semana = item.dia_da_semana || item.dia_semana;
            return enrichAderenciaDia(mapped);
        }

        return mapped;
    });
};

export const transformDashboardData = (data: any) => {
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
            aderencia_semanal: [],
            aderencia_dia: [],
            aderencia_turno: [],
            aderencia_sub_praca: [],
            aderencia_origem: [],
            dimensoes: empty.dimensoes
        };
    }

    const isFlat = 'total_ofertadas' in rawData || 'aderencia_semanal' in rawData;

    const totals: Totals = {
        ofertadas: safeNumber(isFlat ? rawData.total_ofertadas : rawData.totais?.corridas_ofertadas ?? 0),
        aceitas: safeNumber(isFlat ? rawData.total_aceitas : rawData.totais?.corridas_aceitas ?? 0),
        rejeitadas: safeNumber(isFlat ? rawData.total_rejeitadas : rawData.totais?.corridas_rejeitadas ?? 0),
        completadas: safeNumber(isFlat ? rawData.total_completadas : rawData.totais?.corridas_completadas ?? 0),
    };

    return {
        totals,
        aderencia_semanal: mapAdherenceData((isFlat ? rawData.aderencia_semanal : rawData.semanal) || []),
        aderencia_dia: mapAdherenceData((isFlat ? rawData.aderencia_dia : rawData.dia) || [], true),
        aderencia_turno: mapAdherenceData((isFlat ? rawData.aderencia_turno : rawData.turno) || []),
        aderencia_sub_praca: mapAdherenceData((isFlat ? rawData.aderencia_sub_praca : rawData.sub_praca) || []),
        aderencia_origem: mapAdherenceData((isFlat ? rawData.aderencia_origem : rawData.origem) || []),
        dimensoes: rawData.dimensoes || { anos: [], semanas: [], pracas: [], sub_pracas: [], origens: [], turnos: [] }
    };
};
