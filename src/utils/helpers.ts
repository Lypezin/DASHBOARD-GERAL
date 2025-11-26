import { Filters, CurrentUser, hasFullCityAccess } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { LIMITS, VALIDATION } from '@/constants/config';

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Converte um valor para número de forma segura
 * 
 * Retorna 0 se o valor não puder ser convertido para número.
 * Útil para evitar NaN em cálculos.
 * 
 * @param {any} value - Valor a ser convertido
 * @returns {number} Número convertido ou 0 se inválido
 * 
 * @example
 * ```typescript
 * safeNumber('123') // 123
 * safeNumber('abc') // 0
 * safeNumber(null) // 0
 * safeNumber(undefined) // 0
 * ```
 */
export const safeNumber = (value: any): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

/**
 * Verifica se dois arrays são iguais (comparação profunda)
 * 
 * Compara arrays elemento por elemento usando comparação estrita (===).
 * Retorna false se os arrays tiverem tamanhos diferentes.
 * 
 * @template T - Tipo dos elementos do array
 * @param {T[]} a - Primeiro array
 * @param {T[]} b - Segundo array
 * @returns {boolean} True se os arrays forem iguais, false caso contrário
 * 
 * @example
 * ```typescript
 * arraysEqual([1, 2, 3], [1, 2, 3]) // true
 * arraysEqual([1, 2], [1, 2, 3]) // false
 * arraysEqual(['a', 'b'], ['a', 'b']) // true
 * ```
 */
export const arraysEqual = <T>(a: T[], b: T[]): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

/**
 * Constrói o payload de filtros para chamadas RPC
 * 
 * Processa e normaliza os filtros do dashboard, aplicando:
 * - Limites de tamanho em arrays (máximo 50 itens)
 * - Validação de datas (formato YYYY-MM-DD)
 * - Aplicação de permissões do usuário (praças permitidas)
 * - Normalização de strings vazias para null
 * - Conversão de arrays para strings separadas por vírgula quando necessário
 * 
 * @param {Filters} filters - Objeto de filtros do dashboard
 * @param {CurrentUser | null} [currentUser] - Usuário atual (para aplicar permissões)
 * @returns {Object} Payload normalizado para RPC com chaves p_* (p_ano, p_semana, etc.)
 * 
 * @example
 * ```typescript
 * const payload = buildFilterPayload({
 *   ano: 2024,
 *   semana: 10,
 *   praca: 'São Paulo',
 *   subPracas: ['Sub1', 'Sub2']
 * }, currentUser);
 * // Retorna: { p_ano: 2024, p_semana: 10, p_praca: 'São Paulo', p_sub_praca: 'Sub1,Sub2', ... }
 * ```
 */
export const buildFilterPayload = (filters: Filters, currentUser?: CurrentUser | null) => {
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

  const MAX_ARRAY_SIZE = LIMITS.MAX_ARRAY_SIZE;

  let subPraca: string | null = null;
  if (filters.subPracas && filters.subPracas.length > 0) {
    const limited = filters.subPracas.slice(0, MAX_ARRAY_SIZE);
    subPraca = limited.length === 1 ? limited[0] : limited.join(',');
    console.log('🔵 [buildFilterPayload] SUB PRAÇA filtrada:', { subPracas: filters.subPracas, subPraca });
  } else if (filters.subPraca) {
    subPraca = filters.subPraca.length > 100 ? filters.subPraca.substring(0, 100) : filters.subPraca;
  }

  let origem: string | null = null;
  if (filters.origens && filters.origens.length > 0) {
    const limited = filters.origens.slice(0, MAX_ARRAY_SIZE);
    origem = limited.length === 1 ? limited[0] : limited.join(',');
    console.log('🔵 [buildFilterPayload] ORIGEM filtrada:', { origens: filters.origens, origem });
  } else if (filters.origem) {
    origem = filters.origem.length > 100 ? filters.origem.substring(0, 100) : filters.origem;
  }

  let turno: string | null = null;
  if (filters.turnos && filters.turnos.length > 0) {
    const limited = filters.turnos.slice(0, MAX_ARRAY_SIZE);
    turno = limited.length === 1 ? limited[0] : limited.join(',');
    console.log('🔵 [buildFilterPayload] TURNO filtrado:', { turnos: filters.turnos, turno });
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
  if (ano !== null && (Number.isNaN(ano) || ano < VALIDATION.MIN_YEAR || ano > VALIDATION.MAX_YEAR)) {
    ano = null;
  }

  let praca: string | null = filters.praca;
  // Normalizar string vazia para null
  if (praca === '' || (praca && praca.trim() === '')) {
    praca = null;
  }
  if (praca && praca.length > LIMITS.MAX_PRACA_LENGTH) {
    praca = praca.substring(0, LIMITS.MAX_PRACA_LENGTH);
  }

  // Aplicar permissões: se não for admin nem marketing, forçar as praças atribuídas
  // Marketing tem acesso a todas as cidades, então não precisa restringir
  if (currentUser && !hasFullCityAccess(currentUser) && currentUser.assigned_pracas.length > 0) {
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

    // Se apenas uma data foi fornecida, usar a mesma para ambas
    if (dataInicial && !dataFinal) {
      dataFinal = dataInicial;
    }
    if (dataFinal && !dataInicial) {
      dataInicial = dataFinal;
    }

    // Se modo intervalo estiver ativo, anular ano e semana
    ano = null;
    semana = null;
  } else {
    // Se modo ano_semana estiver ativo, anular datas
    dataInicial = null;
    dataFinal = null;
    // Não forçar ano - deixar null se não foi especificado
  }

  // Obter organization_id do usuário atual
  let organizationId = currentUser?.organization_id || null;

  const isAdminOrMaster = currentUser?.is_admin === true;

  // Se for admin ou master, permitir ver tudo (enviar null)
  // Isso permite que a função RPC decida (geralmente mostra tudo para admin)
  if (isAdminOrMaster) {
    organizationId = null;
  }

  // Se organizationId ainda for null após fallback, pode causar retorno vazio das funções RPC
  // Isso é esperado para isolamento de dados, mas pode ser um problema se o usuário deveria ter acesso
  if (!organizationId && IS_DEV) {
    safeLog.warn('[buildFilterPayload] organization_id é NULL - funções RPC retornarão dados vazios', {
      hasCurrentUser: !!currentUser,
      isAdmin: currentUser?.is_admin,
      role: currentUser?.role,
    });
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
    p_organization_id: organizationId,
  } as const;

  // Log temporário para debug dos filtros
  console.log('✅ [buildFilterPayload] Payload final:', {
    p_sub_praca: payload.p_sub_praca,
    p_origem: payload.p_origem,
    p_turno: payload.p_turno,
    p_ano: payload.p_ano,
    p_semana: payload.p_semana,
  });

  if (IS_DEV) {
    safeLog.info('[buildFilterPayload] Payload gerado:', payload);
  }

  return payload;
};
