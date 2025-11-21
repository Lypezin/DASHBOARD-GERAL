/**
 * Hook para buscar dados de uma tab específica
 * Separa lógica de fetch por tipo de tab
 * Inclui fallbacks robustos para quando as funções RPC falharem
 */

import { useState, useRef } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { is500Error, isRateLimitError } from '@/lib/rpcErrorHandler';
import { UtrData, EntregadoresData, ValoresEntregador, UtrGeral, UtrPorPraca, UtrPorSubPraca, UtrPorOrigem, UtrPorTurno, Entregador } from '@/types';
import { RPC_TIMEOUTS, DELAYS } from '@/constants/config';
import { supabase } from '@/lib/supabaseClient';

const IS_DEV = process.env.NODE_ENV === 'development';

type TabData = UtrData | EntregadoresData | ValoresEntregador[] | null;

interface FetchOptions {
  tab: string;
  filterPayload: any;
  onRetry?: (attempt: number) => void;
}

/**
 * Fallback: Busca dados de UTR diretamente da tabela dados_corridas
 */
async function fetchUtrFallback(payload: any): Promise<UtrData | null> {
  try {
    let query = supabase
      .from('dados_corridas')
      .select('tempo_disponivel_escalado, numero_de_corridas_aceitas, numero_de_corridas_completadas, praca, sub_praca, origem, periodo');

    // Aplicar filtros
    if (payload.p_semana && payload.p_ano) {
      const dataInicio = new Date(payload.p_ano, 0, 1);
      const diaSemana = dataInicio.getDay();
      const diasParaSegunda = (diaSemana === 0 ? -6 : 1) - diaSemana;
      const primeiraSegunda = new Date(dataInicio);
      primeiraSegunda.setDate(primeiraSegunda.getDate() + diasParaSegunda);
      const semanaInicio = new Date(primeiraSegunda);
      semanaInicio.setDate(semanaInicio.getDate() + (payload.p_semana - 1) * 7);
      const semanaFim = new Date(semanaInicio);
      semanaFim.setDate(semanaFim.getDate() + 6);
      
      query = query.gte('data_do_periodo', semanaInicio.toISOString().split('T')[0])
                   .lte('data_do_periodo', semanaFim.toISOString().split('T')[0]);
    } else if (payload.p_ano) {
      const anoInicio = `${payload.p_ano}-01-01`;
      const anoFim = `${payload.p_ano}-12-31`;
      query = query.gte('data_do_periodo', anoInicio).lte('data_do_periodo', anoFim);
    }

    if (payload.p_data_inicial) {
      query = query.gte('data_do_periodo', payload.p_data_inicial);
    }

    if (payload.p_data_final) {
      query = query.lte('data_do_periodo', payload.p_data_final);
    }

    if (payload.p_praca) {
      const pracas = payload.p_praca.split(',').map((p: string) => p.trim());
      if (pracas.length === 1) {
        query = query.eq('praca', pracas[0]);
      } else {
        query = query.in('praca', pracas);
      }
    }

    if (payload.p_sub_praca) {
      const subPracas = payload.p_sub_praca.split(',').map((p: string) => p.trim());
      if (subPracas.length === 1) {
        query = query.eq('sub_praca', subPracas[0]);
      } else {
        query = query.in('sub_praca', subPracas);
      }
    }

    if (payload.p_origem) {
      const origens = payload.p_origem.split(',').map((o: string) => o.trim());
      if (origens.length === 1) {
        query = query.eq('origem', origens[0]);
      } else {
        query = query.in('origem', origens);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return {
        geral: { tempo_horas: 0, corridas: 0, utr: 0 },
        praca: [],
        sub_praca: [],
        origem: [],
        turno: []
      };
    }

    // Calcular UTR geral
    let totalTempoSegundos = 0;
    let totalCorridas = 0;

    for (const row of data) {
      const tempoStr = row.tempo_disponivel_escalado || '0:00:00';
      const [hours, minutes, seconds] = tempoStr.split(':').map(Number);
      totalTempoSegundos += (hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0);
      totalCorridas += Number(row.numero_de_corridas_aceitas) || 0;
    }

    const tempoHoras = totalTempoSegundos / 3600;
    const utrGeral: UtrGeral = {
      tempo_horas: tempoHoras,
      corridas: totalCorridas,
      utr: tempoHoras > 0 ? totalCorridas / tempoHoras : 0
    };

    // Agregar por praça
    const pracaMap = new Map<string, { tempo: number; corridas: number }>();
    for (const row of data) {
      const praca = row.praca || 'Não especificada';
      const tempoStr = row.tempo_disponivel_escalado || '0:00:00';
      const [hours, minutes, seconds] = tempoStr.split(':').map(Number);
      const tempo = (hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0);
      const corridas = Number(row.numero_de_corridas_aceitas) || 0;

      if (pracaMap.has(praca)) {
        const existing = pracaMap.get(praca)!;
        existing.tempo += tempo;
        existing.corridas += corridas;
      } else {
        pracaMap.set(praca, { tempo, corridas });
      }
    }

    const utrPorPraca: UtrPorPraca[] = Array.from(pracaMap.entries()).map(([praca, data]) => ({
      praca,
      tempo_horas: data.tempo / 3600,
      corridas: data.corridas,
      utr: data.tempo > 0 ? data.corridas / (data.tempo / 3600) : 0
    }));

    return {
      geral: utrGeral,
      praca: utrPorPraca,
      sub_praca: [],
      origem: [],
      turno: []
    };
  } catch (error: any) {
    safeLog.error('Erro no fallback fetchUtrFallback:', error);
    throw error;
  }
}

/**
 * Fallback: Busca dados de entregadores diretamente da tabela dados_corridas
 */
async function fetchEntregadoresFallback(payload: any): Promise<EntregadoresData> {
  try {
    let query = supabase
      .from('dados_corridas')
      .select('id_da_pessoa_entregadora, pessoa_entregadora, numero_de_corridas_ofertadas, numero_de_corridas_aceitas, numero_de_corridas_rejeitadas, numero_de_corridas_completadas, tempo_disponivel_escalado, data_do_periodo, praca, sub_praca, origem');

    // Aplicar filtros (mesma lógica do fetchValoresFallback)
    if (payload.p_semana && payload.p_ano) {
      const dataInicio = new Date(payload.p_ano, 0, 1);
      const diaSemana = dataInicio.getDay();
      const diasParaSegunda = (diaSemana === 0 ? -6 : 1) - diaSemana;
      const primeiraSegunda = new Date(dataInicio);
      primeiraSegunda.setDate(primeiraSegunda.getDate() + diasParaSegunda);
      const semanaInicio = new Date(primeiraSegunda);
      semanaInicio.setDate(semanaInicio.getDate() + (payload.p_semana - 1) * 7);
      const semanaFim = new Date(semanaInicio);
      semanaFim.setDate(semanaFim.getDate() + 6);
      
      query = query.gte('data_do_periodo', semanaInicio.toISOString().split('T')[0])
                   .lte('data_do_periodo', semanaFim.toISOString().split('T')[0]);
    } else if (payload.p_ano) {
      const anoInicio = `${payload.p_ano}-01-01`;
      const anoFim = `${payload.p_ano}-12-31`;
      query = query.gte('data_do_periodo', anoInicio).lte('data_do_periodo', anoFim);
    }

    if (payload.p_data_inicial) {
      query = query.gte('data_do_periodo', payload.p_data_inicial);
    }

    if (payload.p_data_final) {
      query = query.lte('data_do_periodo', payload.p_data_final);
    }

    if (payload.p_praca) {
      const pracas = payload.p_praca.split(',').map((p: string) => p.trim());
      if (pracas.length === 1) {
        query = query.eq('praca', pracas[0]);
      } else {
        query = query.in('praca', pracas);
      }
    }

    if (payload.p_sub_praca) {
      const subPracas = payload.p_sub_praca.split(',').map((p: string) => p.trim());
      if (subPracas.length === 1) {
        query = query.eq('sub_praca', subPracas[0]);
      } else {
        query = query.in('sub_praca', subPracas);
      }
    }

    if (payload.p_origem) {
      const origens = payload.p_origem.split(',').map((o: string) => o.trim());
      if (origens.length === 1) {
        query = query.eq('origem', origens[0]);
      } else {
        query = query.in('origem', origens);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return { entregadores: [], total: 0 };
    }

    // Agregar dados por entregador
    const entregadoresMap = new Map<string, {
      id_entregador: string;
      nome_entregador: string;
      corridas_ofertadas: number;
      corridas_aceitas: number;
      corridas_rejeitadas: number;
      corridas_completadas: number;
      tempo_total: number;
    }>();

    for (const row of data) {
      const id = row.id_da_pessoa_entregadora;
      if (!id) continue;

      const nome = row.pessoa_entregadora || id;
      const ofertadas = Number(row.numero_de_corridas_ofertadas) || 0;
      const aceitas = Number(row.numero_de_corridas_aceitas) || 0;
      const rejeitadas = Number(row.numero_de_corridas_rejeitadas) || 0;
      const completadas = Number(row.numero_de_corridas_completadas) || 0;
      
      const tempoStr = row.tempo_disponivel_escalado || '0:00:00';
      const [hours, minutes, seconds] = tempoStr.split(':').map(Number);
      const tempo = (hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0);

      if (entregadoresMap.has(id)) {
        const existing = entregadoresMap.get(id)!;
        existing.corridas_ofertadas += ofertadas;
        existing.corridas_aceitas += aceitas;
        existing.corridas_rejeitadas += rejeitadas;
        existing.corridas_completadas += completadas;
        existing.tempo_total += tempo;
      } else {
        entregadoresMap.set(id, {
          id_entregador: id,
          nome_entregador: nome,
          corridas_ofertadas: ofertadas,
          corridas_aceitas: aceitas,
          corridas_rejeitadas: rejeitadas,
          corridas_completadas: completadas,
          tempo_total: tempo
        });
      }
    }

    // Converter para array e calcular aderência
    const entregadores: Entregador[] = Array.from(entregadoresMap.values()).map(item => {
      const tempoHoras = item.tempo_total / 3600;
      const horasEsperadas = tempoHoras;
      const horasEntregues = item.corridas_completadas > 0 ? (item.corridas_completadas / (item.corridas_aceitas || 1)) * tempoHoras : 0;
      const aderencia = horasEsperadas > 0 ? (horasEntregues / horasEsperadas) * 100 : 0;
      const rejeicao = item.corridas_ofertadas > 0 ? (item.corridas_rejeitadas / item.corridas_ofertadas) * 100 : 0;

      return {
        id_entregador: item.id_entregador,
        nome_entregador: item.nome_entregador,
        corridas_ofertadas: item.corridas_ofertadas,
        corridas_aceitas: item.corridas_aceitas,
        corridas_rejeitadas: item.corridas_rejeitadas,
        corridas_completadas: item.corridas_completadas,
        aderencia_percentual: Math.round(aderencia * 100) / 100,
        rejeicao_percentual: Math.round(rejeicao * 100) / 100
      };
    });

    return {
      entregadores,
      total: entregadores.length
    };
  } catch (error: any) {
    safeLog.error('Erro no fallback fetchEntregadoresFallback:', error);
    throw error;
  }
}

/**
 * Fallback: Busca dados de valores diretamente da tabela dados_corridas
 */
async function fetchValoresFallback(payload: any): Promise<ValoresEntregador[]> {
  try {
    let query = supabase
      .from('dados_corridas')
      .select('id_da_pessoa_entregadora, pessoa_entregadora, soma_das_taxas_das_corridas_aceitas, numero_de_corridas_aceitas, data_do_periodo, praca, sub_praca, origem');

    // Aplicar filtros
    if (payload.p_semana && payload.p_ano) {
      const dataInicio = new Date(payload.p_ano, 0, 1);
      const diaSemana = dataInicio.getDay();
      const diasParaSegunda = (diaSemana === 0 ? -6 : 1) - diaSemana;
      const primeiraSegunda = new Date(dataInicio);
      primeiraSegunda.setDate(primeiraSegunda.getDate() + diasParaSegunda);
      const semanaInicio = new Date(primeiraSegunda);
      semanaInicio.setDate(semanaInicio.getDate() + (payload.p_semana - 1) * 7);
      const semanaFim = new Date(semanaInicio);
      semanaFim.setDate(semanaFim.getDate() + 6);
      
      query = query.gte('data_do_periodo', semanaInicio.toISOString().split('T')[0])
                   .lte('data_do_periodo', semanaFim.toISOString().split('T')[0]);
    } else if (payload.p_ano) {
      const anoInicio = `${payload.p_ano}-01-01`;
      const anoFim = `${payload.p_ano}-12-31`;
      query = query.gte('data_do_periodo', anoInicio).lte('data_do_periodo', anoFim);
    }

    if (payload.p_data_inicial) {
      query = query.gte('data_do_periodo', payload.p_data_inicial);
    }

    if (payload.p_data_final) {
      query = query.lte('data_do_periodo', payload.p_data_final);
    }

    if (payload.p_praca) {
      const pracas = payload.p_praca.split(',').map((p: string) => p.trim());
      if (pracas.length === 1) {
        query = query.eq('praca', pracas[0]);
      } else {
        query = query.in('praca', pracas);
      }
    }

    if (payload.p_sub_praca) {
      const subPracas = payload.p_sub_praca.split(',').map((p: string) => p.trim());
      if (subPracas.length === 1) {
        query = query.eq('sub_praca', subPracas[0]);
      } else {
        query = query.in('sub_praca', subPracas);
      }
    }

    if (payload.p_origem) {
      const origens = payload.p_origem.split(',').map((o: string) => o.trim());
      if (origens.length === 1) {
        query = query.eq('origem', origens[0]);
      } else {
        query = query.in('origem', origens);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Agregar dados por entregador
    const valoresMap = new Map<string, {
      id_entregador: string;
      nome_entregador: string;
      total_taxas: number;
      numero_corridas_aceitas: number;
    }>();

    for (const row of data) {
      const id = row.id_da_pessoa_entregadora;
      if (!id) continue;

      const nome = row.pessoa_entregadora || id;
      const taxas = Number(row.soma_das_taxas_das_corridas_aceitas) || 0;
      const corridas = Number(row.numero_de_corridas_aceitas) || 0;

      if (valoresMap.has(id)) {
        const existing = valoresMap.get(id)!;
        existing.total_taxas += taxas;
        existing.numero_corridas_aceitas += corridas;
      } else {
        valoresMap.set(id, {
          id_entregador: id,
          nome_entregador: nome,
          total_taxas: taxas,
          numero_corridas_aceitas: corridas,
        });
      }
    }

    // Converter para array e calcular taxa média
    const valores: ValoresEntregador[] = Array.from(valoresMap.values()).map(item => ({
      id_entregador: item.id_entregador,
      nome_entregador: item.nome_entregador,
      total_taxas: item.total_taxas,
      numero_corridas_aceitas: item.numero_corridas_aceitas,
      taxa_media: item.numero_corridas_aceitas > 0 
        ? item.total_taxas / item.numero_corridas_aceitas 
        : 0,
    }));

    return valores;
  } catch (error: any) {
    safeLog.error('Erro no fallback fetchValoresFallback:', error);
    throw error;
  }
}

/**
 * Busca dados de UTR
 */
async function fetchUtrData(options: FetchOptions): Promise<{ data: UtrData | null; error: any }> {
  const { filterPayload } = options;

  const result = await safeRpc<any>('calcular_utr', filterPayload as any, {
    timeout: RPC_TIMEOUTS.DEFAULT,
    validateParams: true
  });

  if (result.error) {
    const is500 = is500Error(result.error);
    const isRateLimit = isRateLimitError(result.error);

    if (is500) {
      // Tentar fallback
      try {
        const fallbackData = await fetchUtrFallback(filterPayload);
        if (fallbackData) {
          return { data: fallbackData, error: null };
        }
      } catch (fallbackError: any) {
        safeLog.error('Erro no fallback ao buscar UTR:', fallbackError);
      }
      throw new Error('RETRY_500');
    }

    if (isRateLimit) {
      throw new Error('RETRY_RATE_LIMIT');
    }

    // Para outros erros, tentar fallback antes de retornar erro
    const errorCode = result.error?.code || '';
    const errorMessage = result.error?.message || '';
    
    if (errorCode === '42883' || errorCode === 'PGRST116' || errorMessage.includes('does not exist')) {
      try {
        const fallbackData = await fetchUtrFallback(filterPayload);
        if (fallbackData) {
          return { data: fallbackData, error: null };
        }
      } catch (fallbackError: any) {
        safeLog.error('Erro no fallback ao buscar UTR:', fallbackError);
      }
    }

    safeLog.error('Erro ao buscar UTR:', result.error);
    return { data: null, error: result.error };
  }

  let utrData: UtrData | null = null;
  
  if (result && result.data) {
    if (typeof result.data === 'object' && !Array.isArray(result.data)) {
      utrData = result.data as UtrData;
    } else {
      safeLog.warn('[fetchUtrData] Estrutura de dados inesperada:', result.data);
      utrData = null;
    }
  }

  return { data: utrData, error: null };
}

/**
 * Busca dados de Entregadores
 */
async function fetchEntregadoresData(options: FetchOptions): Promise<{ data: EntregadoresData | null; error: any }> {
  const { filterPayload } = options;

  // Remover p_turno pois a função não suporta
  const { p_turno, ...restPayload } = filterPayload;
  const listarEntregadoresPayload = {
    ...restPayload,
  };

  const result = await safeRpc<any>('listar_entregadores', listarEntregadoresPayload, {
    timeout: RPC_TIMEOUTS.LONG,
    validateParams: false
  });

  if (result.error) {
    const is500 = is500Error(result.error);
    const isRateLimit = isRateLimitError(result.error);

    if (is500) {
      // Tentar fallback
      try {
        const fallbackData = await fetchEntregadoresFallback(listarEntregadoresPayload);
        if (fallbackData && fallbackData.entregadores.length > 0) {
          return { data: fallbackData, error: null };
        }
      } catch (fallbackError: any) {
        safeLog.error('Erro no fallback ao buscar entregadores:', fallbackError);
      }
      throw new Error('RETRY_500');
    }

    if (isRateLimit) {
      throw new Error('RETRY_RATE_LIMIT');
    }

    // Para outros erros, tentar fallback antes de retornar erro
    const errorCode = result.error?.code || '';
    const errorMessage = result.error?.message || '';
    
    if (errorCode === '42883' || errorCode === 'PGRST116' || errorMessage.includes('does not exist')) {
      try {
        const fallbackData = await fetchEntregadoresFallback(listarEntregadoresPayload);
        if (fallbackData) {
          return { data: fallbackData, error: null };
        }
      } catch (fallbackError: any) {
        safeLog.error('Erro no fallback ao buscar entregadores:', fallbackError);
      }
    }

    safeLog.error('Erro ao buscar entregadores:', result.error);
    return { data: { entregadores: [], total: 0 }, error: result.error };
  }

  let processedData: EntregadoresData = { entregadores: [], total: 0 };

  if (result && result.data) {
    let entregadores: any[] = [];
    let total = 0;

    if (typeof result.data === 'object' && !Array.isArray(result.data)) {
      if ('entregadores' in result.data && Array.isArray(result.data.entregadores)) {
        entregadores = result.data.entregadores;
        total = result.data.total !== undefined ? result.data.total : result.data.entregadores.length;
      } else {
        safeLog.warn('[fetchEntregadoresData] Estrutura de dados inesperada:', result.data);
        entregadores = [];
        total = 0;
      }
    } else if (Array.isArray(result.data)) {
      entregadores = result.data;
      total = result.data.length;
    }

    processedData = { entregadores, total };
  }

  return { data: processedData, error: null };
}

/**
 * Busca dados de Valores
 */
async function fetchValoresData(options: FetchOptions): Promise<{ data: ValoresEntregador[] | null; error: any }> {
  const { filterPayload } = options;

  // Filtrar apenas os parâmetros que a função RPC aceita
  const allowedParams = ['p_ano', 'p_semana', 'p_praca', 'p_sub_praca', 'p_origem', 'p_data_inicial', 'p_data_final'];
  const listarValoresPayload: any = {};
  
  for (const key of allowedParams) {
    if (filterPayload && key in filterPayload && filterPayload[key] !== null && filterPayload[key] !== undefined) {
      listarValoresPayload[key] = filterPayload[key];
    }
  }

  const result = await safeRpc<any>('listar_valores_entregadores', listarValoresPayload, {
    timeout: RPC_TIMEOUTS.LONG,
    validateParams: false
  });

  if (result.error) {
    const is500 = is500Error(result.error);
    const isRateLimit = isRateLimitError(result.error);

    if (is500) {
      // Tentar fallback
      try {
        const fallbackData = await fetchValoresFallback(listarValoresPayload);
        if (fallbackData && fallbackData.length > 0) {
          return { data: fallbackData, error: null };
        }
      } catch (fallbackError: any) {
        safeLog.error('Erro no fallback ao buscar valores:', fallbackError);
      }
      throw new Error('RETRY_500');
    }

    if (isRateLimit) {
      throw new Error('RETRY_RATE_LIMIT');
    }

    // Para outros erros, tentar fallback antes de retornar erro
    const errorCode = result.error?.code || '';
    const errorMessage = result.error?.message || '';
    
    if (errorCode === '42883' || errorCode === 'PGRST116' || errorMessage.includes('does not exist')) {
      try {
        const fallbackData = await fetchValoresFallback(listarValoresPayload);
        if (fallbackData && fallbackData.length > 0) {
          return { data: fallbackData, error: null };
        }
      } catch (fallbackError: any) {
        safeLog.error('Erro no fallback ao buscar valores:', fallbackError);
      }
      
      return { 
        data: [], 
        error: {
          message: 'A função de listar valores não está disponível. Entre em contato com o administrador.',
          code: 'FUNCTION_NOT_FOUND'
        }
      };
    }

    safeLog.error('Erro ao buscar valores:', result.error);
    return { data: [], error: result.error };
  }

  let processedData: ValoresEntregador[] = [];

  if (result && result.data !== null && result.data !== undefined) {
    if (typeof result.data === 'object' && !Array.isArray(result.data)) {
      const dataObj = result.data as any;
      
      if ('entregadores' in dataObj && Array.isArray(dataObj.entregadores)) {
        processedData = dataObj.entregadores;
      } else if ('valores' in dataObj && Array.isArray(dataObj.valores)) {
        processedData = dataObj.valores;
      } else {
        safeLog.warn('[fetchValoresData] Estrutura de dados inesperada:', dataObj);
        processedData = [];
      }
    } else if (Array.isArray(result.data)) {
      processedData = result.data;
    }
  }

  return { data: processedData, error: null };
}

/**
 * Busca dados baseado no tipo de tab
 */
export async function fetchTabData(options: FetchOptions): Promise<{ data: TabData; error: any }> {
  const { tab } = options;

  try {
    switch (tab) {
      case 'dashboard':
        return { data: null, error: null };

      case 'utr':
        return await fetchUtrData(options);

      case 'entregadores':
        return await fetchEntregadoresData(options);

      case 'valores':
        return await fetchValoresData(options);

      case 'prioridade':
        return await fetchEntregadoresData(options);

      default:
        return { data: null, error: new Error(`Tab desconhecida: ${tab}`) };
    }
  } catch (error: any) {
    if (error.message === 'RETRY_500' || error.message === 'RETRY_RATE_LIMIT') {
      throw error;
    }
    return { data: null, error };
  }
}

/**
 * Hook para gerenciar fetch de dados de tab com retry
 */
export function useTabDataFetcher() {
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchWithRetry = async (
    tab: string,
    filterPayload: any,
    onSuccess: (data: TabData) => void,
    onError: (error: any) => void,
    shouldContinue: () => boolean
  ): Promise<void> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    setLoading(true);

    try {
      const result = await fetchTabData({ tab, filterPayload });

      if (!shouldContinue()) {
        return;
      }

      if (result.error) {
        onError(result.error);
        setLoading(false);
        return;
      }

      onSuccess(result.data);
      setLoading(false);
    } catch (error: any) {
      if (!shouldContinue()) {
        return;
      }

      if (error.message === 'RETRY_500') {
        retryTimeoutRef.current = setTimeout(() => {
          if (shouldContinue()) {
            fetchWithRetry(tab, filterPayload, onSuccess, onError, shouldContinue);
          }
        }, DELAYS.RETRY_500);
        return;
      }

      if (error.message === 'RETRY_RATE_LIMIT') {
        retryTimeoutRef.current = setTimeout(() => {
          if (shouldContinue()) {
            fetchWithRetry(tab, filterPayload, onSuccess, onError, shouldContinue);
          }
        }, DELAYS.RETRY_RATE_LIMIT);
        return;
      }

      onError(error);
      setLoading(false);
    }
  };

  const cancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    setLoading(false);
  };

  return {
    fetchWithRetry,
    cancel,
    loading,
  };
}
