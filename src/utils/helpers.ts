import { Filters } from '@/types';

export const safeNumber = (value: any): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

export const arraysEqual = <T>(a: T[], b: T[]): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

export const buildFilterPayload = (filters: Filters, currentUser?: { is_admin: boolean; assigned_pracas: string[] } | null) => {
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

  let semana: number | null = null;
  if (filters.semanas && filters.semanas.length > 0) {
    // Se houver múltiplas semanas, usar apenas a primeira (a função espera integer, não array)
    semana = Number(filters.semanas[0]);
    if (isNaN(semana)) semana = null;
  } else if (filters.semana !== null && filters.semana !== undefined) {
    semana = Number(filters.semana);
    if (isNaN(semana)) semana = null;
  }

  let ano: number | null = filters.ano;
  if (ano !== null && (Number.isNaN(ano) || ano < 2000 || ano > 2100)) {
    ano = null;
  }

  let praca: string | null = filters.praca;
  if (praca && praca.length > 100) {
    praca = praca.substring(0, 100);
  }

  // Aplicar permissões: se não for admin, forçar as praças atribuídas
  if (currentUser && !currentUser.is_admin && currentUser.assigned_pracas.length > 0) {
    // Se tiver apenas uma praça, usar ela
    if (currentUser.assigned_pracas.length === 1) {
      praca = currentUser.assigned_pracas[0];
    } 
    // Se tiver múltiplas praças e nenhuma selecionada, usar a primeira
    else if (!praca) {
      praca = currentUser.assigned_pracas[0];
    }
    // Se tiver praça selecionada, validar se está nas praças permitidas
    else if (!currentUser.assigned_pracas.includes(praca)) {
      praca = currentUser.assigned_pracas[0];
    }
  }

  return {
    p_ano: ano,
    p_semana: semana,
    p_praca: praca,
    p_sub_praca: subPraca,
    p_origem: origem,
    p_turno: turno,
  } as const;
};
