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

  const aderenciaDia: AderenciaDia[] = Array.isArray(data.dia)
    ? data.dia.map(item => ({
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
