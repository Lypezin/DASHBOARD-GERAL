import { transformDashboardData } from '@/utils/dashboard/transformers';
import type {
    Totals, AderenciaSemanal, AderenciaDia, AderenciaTurno,
    AderenciaSubPraca, AderenciaOrigem, DimensoesDashboard
} from '@/types';

interface DashboardSetters {
    setTotals: (data: Totals | null) => void;
    setAderenciaSemanal: (data: AderenciaSemanal[]) => void;
    setAderenciaDia: (data: AderenciaDia[]) => void;
    setAderenciaTurno: (data: AderenciaTurno[]) => void;
    setAderenciaSubPraca: (data: AderenciaSubPraca[]) => void;
    setAderenciaOrigem: (data: AderenciaOrigem[]) => void;
    setDimensoes: (data: DimensoesDashboard | null) => void;
}

export const updateDashboardState = (rawOrProcessedData: any, setters: DashboardSetters, isProcessed: boolean = false) => {
    const processedData = isProcessed ? rawOrProcessedData : transformDashboardData(rawOrProcessedData);

    setters.setTotals(processedData.totals);
    setters.setAderenciaSemanal(processedData.aderencia_semanal);
    setters.setAderenciaDia(processedData.aderencia_dia);
    setters.setAderenciaTurno(processedData.aderencia_turno);
    setters.setAderenciaSubPraca(processedData.aderencia_sub_praca);
    setters.setAderenciaOrigem(processedData.aderencia_origem);

    if (processedData.dimensoes) setters.setDimensoes(processedData.dimensoes);
};

export const clearDashboardState = (setters: DashboardSetters, emptyData: any) => {
    setters.setTotals({ ofertadas: 0, aceitas: 0, rejeitadas: 0, completadas: 0 });
    setters.setAderenciaSemanal([]);
    setters.setAderenciaDia([]);
    setters.setAderenciaTurno([]);
    setters.setAderenciaSubPraca([]);
    setters.setAderenciaOrigem([]);
    setters.setDimensoes(emptyData.dimensoes);
};
