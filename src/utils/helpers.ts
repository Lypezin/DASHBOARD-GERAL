import { Filters } from '@/types';

export const safeNumber = (value: any): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

export const buildFilterPayload = (filters: Filters) => {
  const MAX_ARRAY_SIZE = 50;
  
  let subPraca: string | null = null;
  if (filters.subPracas && filters.subPracas.length > 0) {
    const limited = filters.subPracas.slice(0, MAX_ARRAY_SIZE);
    subPraca = limited.length === 1 ? limited[0] : limited.join(',');
  } else if (filters.subPraca) {
    subPraca = filters.subPraca.length > 100 ? filters.subPraca.substring(0, 100) : filters.subPraca;
  }
    
  let origem: string | null = null;
  if (filters.origens && filters.origens.length > 0) {
    const limited = filters.origens.slice(0, MAX_ARRAY_SIZE);
    origem = limited.length === 1 ? limited[0] : limited.join(',');
  } else if (filters.origem) {
    origem = filters.origem.length > 100 ? filters.origem.substring(0, 100) : filters.origem;
  }

  let turno: string | null = null;
  if (filters.turnos && filters.turnos.length > 0) {
    const limited = filters.turnos.slice(0, MAX_ARRAY_SIZE);
    turno = limited.length === 1 ? limited[0] : limited.join(',');
  } else if (filters.turno) {
    turno = filters.turno.length > 100 ? filters.turno.substring(0, 100) : filters.turno;
  }

  let semana: string | null = null;
  if (filters.semanas && filters.semanas.length > 0) {
    const limited = filters.semanas.slice(0, MAX_ARRAY_SIZE);
    semana = limited.length === 1 ? String(limited[0]) : limited.map(s => String(s)).join(',');
  } else if (filters.semana !== null) {
    semana = String(filters.semana);
  }

  let ano: number | null = filters.ano;
  if (ano !== null && (isNaN(ano) || ano < 2000 || ano > 2100)) {
    ano = null;
  }

  let praca: string | null = filters.praca;
  if (praca && praca.length > 100) {
    praca = praca.substring(0, 100);
  }

  return {
    p_ano: ano,
    p_semana: semana,
    p_praca: praca,
    p_sub_praca: subPraca,
    p_origem: origem,
    p_turno: turno,
  };
};
