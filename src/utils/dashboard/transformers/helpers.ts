import { AderenciaDia, DashboardResumoData } from '@/types';
import { formatarHorasParaHMS } from '@/utils/formatters';

export const convertHorasToString = (value: number | string | undefined | null): string => {
    if (value === undefined || value === null) return '0';
    if (typeof value === 'string') return value;
    return String(value);
};

export const processSeconds = (val: number | string | undefined | null): string => {
    if (val === undefined || val === null) return '00:00:00';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '00:00:00';
    if (typeof val === 'string' && val.includes(':')) return val;

    return formatarHorasParaHMS(num / 3600);
};

export const enrichAderenciaDia = (diaData: AderenciaDia) => {
    if (diaData.dia_da_semana) {
        return diaData;
    }

    if (diaData.data) {
        const diasDaSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const dataObj = new Date(diaData.data + 'T00:00:00');

        if (isNaN(dataObj.getTime())) {
            return diaData;
        }

        const diaDaSemana = diasDaSemana[dataObj.getDay()];
        const diaIso = dataObj.getDay() === 0 ? 7 : dataObj.getDay();

        return {
            ...diaData,
            dia_da_semana: diaDaSemana,
            dia_iso: diaIso
        };
    }

    return diaData;
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
