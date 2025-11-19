import { Filters } from '@/types';
import { safeLog } from '@/lib/errorHandler';

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
  // Log para debug
  try {
    safeLog.info('[buildFilterPayload] Iniciando com filters:', {
      hasFilters: !!filters,
      filtroModo: filters?.filtroModo,
      dataInicial: filters?.dataInicial,
      dataFinal: filters?.dataFinal,
      ano: filters?.ano,
      semana: filters?.semana,
      filtersType: typeof filters,
      filtersKeys: filters ? Object.keys(filters) : 'filters is null/undefined',
    });
  } catch (error) {
    safeLog.error('[buildFilterPayload] Erro ao logar filters:', error);
  }

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
  // Normalizar string vazia para null
  if (praca === '' || (praca && praca.trim() === '')) {
    praca = null;
  }
  if (praca && praca.length > 100) {
    praca = praca.substring(0, 100);
  }

  // Aplicar permissões: se não for admin, forçar as praças atribuídas
  if (currentUser && !currentUser.is_admin && currentUser.assigned_pracas.length > 0) {
    // Se tiver apenas uma praça, SEMPRE usar ela (ignorar qualquer seleção)
    if (currentUser.assigned_pracas.length === 1) {
      praca = currentUser.assigned_pracas[0];
    } 
    // Se tiver múltiplas praças
    else {
      // Se nenhuma praça foi selecionada (null ou vazia), passar todas as praças permitidas
      if (!praca || praca.trim() === '') {
        const limited = currentUser.assigned_pracas.slice(0, MAX_ARRAY_SIZE);
        praca = limited.length === 1 ? limited[0] : limited.join(',');
      }
      // Se tiver praça selecionada, validar se está nas praças permitidas
      else if (!currentUser.assigned_pracas.includes(praca.trim())) {
        // Se a praça selecionada não está permitida, usar todas as praças permitidas
        const limited = currentUser.assigned_pracas.slice(0, MAX_ARRAY_SIZE);
        praca = limited.length === 1 ? limited[0] : limited.join(',');
      }
      // Se a praça selecionada está permitida, manter ela (pode ser uma única praça ou múltiplas)
      else {
        praca = praca.trim();
      }
    }
  }

  // Processar intervalo de datas
  let dataInicial: string | null = null;
  let dataFinal: string | null = null;
  
  // Se modo for intervalo, processar datas
  if (filters?.filtroModo === 'intervalo') {
    safeLog.info('[buildFilterPayload] Modo intervalo detectado, processando datas');
    // Validar e normalizar data inicial
    if (filters.dataInicial && filters.dataInicial.trim() !== '') {
      const dataIni = new Date(filters.dataInicial);
      if (!isNaN(dataIni.getTime())) {
        // Garantir formato YYYY-MM-DD
        dataInicial = dataIni.toISOString().split('T')[0];
      }
    }
    
    // Validar e normalizar data final
    if (filters.dataFinal && filters.dataFinal.trim() !== '') {
      const dataFim = new Date(filters.dataFinal);
      if (!isNaN(dataFim.getTime())) {
        // Garantir formato YYYY-MM-DD
        dataFinal = dataFim.toISOString().split('T')[0];
      }
    }
    
    // Validar que data final >= data inicial
    if (dataInicial && dataFinal && dataFinal < dataInicial) {
      // Se data final for menor que inicial, usar data inicial como final também
      dataFinal = dataInicial;
    }
    
    // Se modo intervalo estiver ativo, anular ano e semana
    ano = null;
    semana = null;
  } else {
    // Se modo ano_semana estiver ativo, anular datas
    dataInicial = null;
    dataFinal = null;
    
    // Se não houver ano e não estiver em modo intervalo, usar ano atual como padrão
    // Isso evita que a função seja chamada sem filtros e cause timeout
    if (ano === null && !dataInicial && !dataFinal) {
      ano = new Date().getFullYear();
    }
  }

  const payload = {
    p_ano: ano,
    p_semana: semana,
    p_praca: praca,
    p_sub_praca: subPraca,
    p_origem: origem,
    p_turno: turno,
    p_data_inicial: dataInicial,
    p_data_final: dataFinal,
  } as const;

  // Log para debug
  safeLog.info('[buildFilterPayload] Payload gerado:', payload);

  return payload;
};
