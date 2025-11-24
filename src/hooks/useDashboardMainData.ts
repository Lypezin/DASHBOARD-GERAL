/**
 * Hook para buscar dados principais do dashboard
 * Separa lógica de busca de dados principais (totais, aderências)
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import {
  Totals,
  AderenciaSemanal,
  AderenciaDia,
  AderenciaTurno,
  AderenciaSubPraca,
  AderenciaOrigem,
  DashboardResumoData,
  DimensoesDashboard,
} from '@/types';
import { safeNumber } from '@/utils/helpers';
import { RPC_TIMEOUTS, DELAYS } from '@/constants/config';

const IS_DEV = process.env.NODE_ENV === 'development';

function getSafeErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  if (typeof error === 'string') return error;
  return 'Erro ao carregar dados do dashboard';
}

import type { FilterPayload } from '@/types/filters';
import type { RpcError } from '@/types/rpc';

interface UseDashboardMainDataOptions {
  filterPayload: FilterPayload;
  onError?: (error: Error | RpcError) => void;
}

/**
 * Hook para buscar dados principais do dashboard
 */
export function useDashboardMainData(options: UseDashboardMainDataOptions) {
  const { filterPayload, onError } = options;

  const [totals, setTotals] = useState<Totals | null>(null);
  const [aderenciaSemanal, setAderenciaSemanal] = useState<AderenciaSemanal[]>([]);
  const [aderenciaDia, setAderenciaDia] = useState<AderenciaDia[]>([]);
  const [aderenciaTurno, setAderenciaTurno] = useState<AderenciaTurno[]>([]);
  const [aderenciaSubPraca, setAderenciaSubPraca] = useState<AderenciaSubPraca[]>([]);
  const [aderenciaOrigem, setAderenciaOrigem] = useState<AderenciaOrigem[]>([]);
  const [dimensoes, setDimensoes] = useState<DimensoesDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheKeyRef = useRef<string>('');
  const cachedDataRef = useRef<DashboardResumoData | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const previousPayloadRef = useRef<string>('');
  const isFirstExecutionRef = useRef<boolean>(true);
  const pendingPayloadKeyRef = useRef<string>('');

  // Criar uma string estável do payload para usar como dependência
  const payloadKey = useMemo(() => JSON.stringify(filterPayload), [
    filterPayload.p_ano,
    filterPayload.p_semana,
    filterPayload.p_praca,
    filterPayload.p_sub_praca,
    filterPayload.p_origem,
    filterPayload.p_turno,
    filterPayload.p_data_inicial,
    filterPayload.p_data_final,
  ]);

  useEffect(() => {
    // Evitar processamento se o payload não mudou realmente
    // IMPORTANTE: Também verificar se há um fetch pendente com o mesmo payload
    if (previousPayloadRef.current === payloadKey) {
      if (IS_DEV) {
        safeLog.info('[useDashboardMainData] Payload não mudou, ignorando');
      }
      return;
    }

    // Se o payload pendente é o mesmo, não criar novo timeout
    if (pendingPayloadKeyRef.current === payloadKey && debounceRef.current) {
      return;
    }

    // Limpar timeout anterior apenas se o payload mudou E não for o mesmo payload pendente
    // Mas só limpar se realmente mudou (não limpar se for a primeira vez)
    if (debounceRef.current && previousPayloadRef.current !== '' && pendingPayloadKeyRef.current !== payloadKey) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (IS_DEV) {
      safeLog.info('[useDashboardMainData] useEffect acionado com payload:', {
        payload: filterPayload,
        payloadKey,
        previousPayload: previousPayloadRef.current,
        cacheKey: cacheKeyRef.current,
        hasCachedData: !!cachedDataRef.current,
      });
    }

    // IMPORTANTE: A função dashboard_resumo sempre retorna dimensões, mesmo sem filtros
    // Ela usa valores padrão (últimos 30 dias) quando não há filtros
    // Sempre fazer fetch para carregar dimensões e dados
    const isFirstExecutionCheck = isFirstExecutionRef.current;
    const hasValidFilters = (filterPayload.p_ano !== null && filterPayload.p_ano !== undefined) ||
      (filterPayload.p_data_inicial !== null && filterPayload.p_data_inicial !== undefined);

    // Sempre fazer fetch - a função RPC retorna dimensões mesmo sem filtros válidos
    const shouldFetch = true;

    if (IS_DEV) {
      safeLog.info('[useDashboardMainData] Validação de filtros:', {
        hasValidFilters,
        p_ano: filterPayload.p_ano,
        p_semana: filterPayload.p_semana,
        p_data_inicial: filterPayload.p_data_inicial,
      });
    }

    // Se o payload anterior era inválido e agora é válido, limpar cache
    // Payload é inválido se não tiver p_ano nem p_data_inicial
    const previousPayloadWasInvalid = previousPayloadRef.current &&
      (!previousPayloadRef.current.includes('"p_ano":') || previousPayloadRef.current.includes('"p_ano":null')) &&
      (!previousPayloadRef.current.includes('"p_data_inicial":') || previousPayloadRef.current.includes('"p_data_inicial":null'));

    if (previousPayloadWasInvalid && hasValidFilters) {
      if (IS_DEV) {
        safeLog.info('[useDashboardMainData] Limpando cache - payload mudou de inválido para válido');
      }
      cacheKeyRef.current = '';
      cachedDataRef.current = null;
    }

    // NÃO atualizar previousPayloadRef aqui - será atualizado DEPOIS do fetch executar
    // Isso garante que o fetch seja executado mesmo na primeira vez
    // Armazenar o payloadKey pendente para verificação posterior
    pendingPayloadKeyRef.current = payloadKey;

    // Verificar cache apenas se tiver filtros válidos ou for primeira execução
    if (shouldFetch && cacheKeyRef.current === payloadKey && cachedDataRef.current) {
      if (IS_DEV) {
        safeLog.info('[useDashboardMainData] Usando dados do cache');
      }
      const cached = cachedDataRef.current;

      // Função auxiliar para converter horas
      const convertHorasToString = (value: number | string | undefined | null): string => {
        if (value === undefined || value === null) return '0';
        if (typeof value === 'string') return value;
        return String(value);
      };

      setTotals({
        ofertadas: safeNumber(cached.totais?.corridas_ofertadas ?? 0),
        aceitas: safeNumber(cached.totais?.corridas_aceitas ?? 0),
        rejeitadas: safeNumber(cached.totais?.corridas_rejeitadas ?? 0),
        completadas: safeNumber(cached.totais?.corridas_completadas ?? 0),
      });

      setAderenciaSemanal(Array.isArray(cached.semanal)
        ? cached.semanal.map(item => ({
          ...item,
          horas_a_entregar: convertHorasToString(item.horas_a_entregar),
          horas_entregues: convertHorasToString(item.horas_entregues)
        }))
        : []);
      setAderenciaDia(Array.isArray(cached.dia)
        ? cached.dia.map(item => ({
          ...item,
          horas_a_entregar: convertHorasToString(item.horas_a_entregar),
          horas_entregues: convertHorasToString(item.horas_entregues)
        }))
        : []);
      setAderenciaTurno(Array.isArray(cached.turno)
        ? cached.turno.map(item => ({
          ...item,
          horas_a_entregar: convertHorasToString(item.horas_a_entregar),
          horas_entregues: convertHorasToString(item.horas_entregues)
        }))
        : []);
      setAderenciaSubPraca(Array.isArray(cached.sub_praca)
        ? cached.sub_praca.map(item => ({
          ...item,
          horas_a_entregar: convertHorasToString(item.horas_a_entregar),
          horas_entregues: convertHorasToString(item.horas_entregues)
        }))
        : []);
      setAderenciaOrigem(Array.isArray(cached.origem)
        ? cached.origem.map(item => ({
          ...item,
          horas_a_entregar: convertHorasToString(item.horas_a_entregar),
          horas_entregues: convertHorasToString(item.horas_entregues)
        }))
        : []);

      // Atualizar dimensões se disponíveis no cache
      if (cached.dimensoes) {
        setDimensoes(cached.dimensoes);
      }

      setError(null);
      setLoading(false);

      // Atualizar previousPayloadRef após usar cache com sucesso
      previousPayloadRef.current = payloadKey;
      isFirstExecutionRef.current = false;
      return;
    }

    // Capturar o payload atual para usar dentro do timeout
    const currentPayload = filterPayload;
    const currentPayloadKey = payloadKey;

    const timeoutId = setTimeout(async () => {
      // Verificar se este timeout ainda é o atual (pode ter sido cancelado)
      if (debounceRef.current !== timeoutId) {
        return;
      }

      // Verificar se o payload ainda é o mesmo (pode ter mudado durante o debounce)
      const currentPayloadKeyCheck = JSON.stringify(currentPayload);
      if (currentPayloadKeyCheck !== currentPayloadKey) {
        return;
      }

      // Verificar se o payload pendente ainda é o mesmo (pode ter mudado durante o debounce)
      if (pendingPayloadKeyRef.current !== currentPayloadKey) {
        return;
      }

      // IMPORTANTE: A função dashboard_resumo sempre retorna dimensões, mesmo sem filtros
      // Ela usa valores padrão (últimos 30 dias) quando não há filtros
      // Sempre fazer fetch
      const isFirstExecutionInTimeout = isFirstExecutionRef.current;
      const hasValidFiltersInTimeout = (currentPayload.p_ano !== null && currentPayload.p_ano !== undefined) ||
        (currentPayload.p_data_inicial !== null && currentPayload.p_data_inicial !== undefined);
      const shouldFetchInTimeout = true; // Sempre fazer fetch

      if (IS_DEV) {
        safeLog.info('[useDashboardMainData] Verificando se deve fazer fetch:', {
          hasValidFilters: hasValidFiltersInTimeout,
          payload: currentPayload,
          debounceDelay: DELAYS.DEBOUNCE,
        });
      }

      if (!shouldFetchInTimeout) {
        if (IS_DEV) {
          safeLog.warn('[useDashboardMainData] Payload inválido, aguardando filtros válidos:', {
            payload: currentPayload,
            p_ano: currentPayload.p_ano,
            p_semana: currentPayload.p_semana,
            p_data_inicial: currentPayload.p_data_inicial,
            isFirstExecution: isFirstExecutionInTimeout,
          });
        }
        setLoading(false);
        // Atualizar previousPayloadRef mesmo quando inválido para evitar loop
        previousPayloadRef.current = currentPayloadKey;
        isFirstExecutionRef.current = false;
        return;
      }

      if (IS_DEV) {
        safeLog.info('[useDashboardMainData] Iniciando fetch com payload válido:', currentPayload);
      }

      setLoading(true);
      setError(null);

      try {
        if (IS_DEV) {
          safeLog.info('[useDashboardMainData] Chamando safeRpc dashboard_resumo com:', {
            functionName: 'dashboard_resumo',
            payload: currentPayload,
            timeout: RPC_TIMEOUTS.DEFAULT,
          });
        }

        // Verificar se o Supabase está disponível antes de fazer a chamada
        try {
          const { supabase } = await import('@/lib/supabaseClient');
          if (!supabase || !supabase.rpc) {
            throw new Error('Cliente Supabase não está disponível');
          }
        } catch (supabaseError) {
          console.error('❌ [useDashboardMainData] Erro ao verificar cliente Supabase:', supabaseError);
          const errorMsg = 'Cliente Supabase não está disponível. Aguarde o carregamento completo da página.';
          setError(errorMsg);
          if (onError) onError(new Error(errorMsg));
          setLoading(false);
          return;
        }

        // IMPORTANTE: A função dashboard_resumo sempre retorna dimensões
        // Ela usa valores padrão (últimos 2 semanas) quando não há filtros válidos
        // Sempre passar o payload atual - a função RPC trata null como "usar padrão"
        // O safeRpc normaliza undefined para null, então podemos passar o payload diretamente
        const payloadForRpc = currentPayload;

        const { data, error: rpcError } = await safeRpc<DashboardResumoData>('dashboard_resumo', payloadForRpc, {
          timeout: RPC_TIMEOUTS.DEFAULT,
          validateParams: false // Não validar para permitir null (função RPC usa valores padrão)
        });

        if (IS_DEV) {
          safeLog.info('[useDashboardMainData] Resposta do safeRpc:', {
            hasData: !!data,
            hasError: !!rpcError,
            dataKeys: data ? Object.keys(data) : null,
            errorMessage: rpcError ? String(rpcError.message || rpcError) : null,
          });
        }

        if (rpcError) {
          const errorCode = rpcError?.code || '';
          const errorMessage = String(rpcError?.message || '');

          // Verificar se é erro de cliente mock
          if (errorMessage.includes('placeholder.supabase.co') ||
            errorMessage.includes('ERR_NAME_NOT_RESOLVED') ||
            errorCode === 'ENOTFOUND') {
            const errorMsg = 'Variáveis de ambiente do Supabase não estão configuradas. Após configurar no Vercel, faça um novo build.';
            safeLog.error('[useDashboardMainData] ⚠️ Cliente Supabase está usando mock!');
            setError(errorMsg);
            if (onError) onError(new Error(errorMsg));
            return;
          }

          safeLog.error('Erro ao carregar dashboard_resumo:', rpcError);
          setError(getSafeErrorMessage(rpcError));
          if (onError) onError(rpcError);
          return;
        }

        if (!data) {
          if (IS_DEV) {
            safeLog.warn('[useDashboardMainData] dashboard_resumo retornou null ou undefined, usando dados vazios');
          }
          // Em vez de erro, usar estrutura vazia para evitar loop
          const emptyData: DashboardResumoData = {
            totais: { corridas_ofertadas: 0, corridas_aceitas: 0, corridas_rejeitadas: 0, corridas_completadas: 0 },
            semanal: [],
            dia: [],
            turno: [],
            sub_praca: [],
            origem: [],
            dimensoes: { anos: [], semanas: [], pracas: [], sub_pracas: [], origens: [], turnos: [] }
          };

          // Atualizar cache com dados vazios
          cachedDataRef.current = emptyData;
          cacheKeyRef.current = currentPayloadKey;

          setTotals({ ofertadas: 0, aceitas: 0, rejeitadas: 0, completadas: 0 });
          setAderenciaSemanal([]);
          setAderenciaDia([]);
          setAderenciaTurno([]);
          setAderenciaSubPraca([]);
          setAderenciaOrigem([]);
          setDimensoes(emptyData.dimensoes);

          setLoading(false);
          previousPayloadRef.current = currentPayloadKey;
          isFirstExecutionRef.current = false;
          return;
        }

        if (IS_DEV) {
          safeLog.info('[useDashboardMainData] Dados recebidos com sucesso:', {
            hasTotais: !!data.totais,
            hasSemanal: Array.isArray(data.semanal),
            semanalLength: Array.isArray(data.semanal) ? data.semanal.length : 0,
            hasDia: Array.isArray(data.dia),
            diaLength: Array.isArray(data.dia) ? data.dia.length : 0,
            hasDimensoes: !!data.dimensoes,
          });
        }

        // Atualizar cache
        // IMPORTANTE: Na primeira execução sem filtros, usar uma chave especial para cache
        const cacheKeyToUse = isFirstExecutionInTimeout && !hasValidFiltersInTimeout
          ? '__first_execution_dimensions__'
          : currentPayloadKey;
        cachedDataRef.current = data;
        cacheKeyRef.current = cacheKeyToUse;

        // Atualizar estados
        const newTotals = {
          ofertadas: safeNumber(data.totais?.corridas_ofertadas ?? 0),
          aceitas: safeNumber(data.totais?.corridas_aceitas ?? 0),
          rejeitadas: safeNumber(data.totais?.corridas_rejeitadas ?? 0),
          completadas: safeNumber(data.totais?.corridas_completadas ?? 0),
        };

        if (IS_DEV) {
          safeLog.info('[useDashboardMainData] Definindo novos totals:', newTotals);
        }

        setTotals(newTotals);

        // Converter números para strings (horas_a_entregar e horas_entregues)
        const convertHorasToString = (value: number | string | undefined | null): string => {
          if (value === undefined || value === null) return '0';
          if (typeof value === 'string') return value;
          return String(value);
        };

        setAderenciaSemanal(Array.isArray(data.semanal)
          ? data.semanal.map(item => ({
            ...item,
            horas_a_entregar: convertHorasToString(item.horas_a_entregar),
            horas_entregues: convertHorasToString(item.horas_entregues)
          }))
          : []);
        setAderenciaDia(Array.isArray(data.dia)
          ? data.dia.map(item => ({
            ...item,
            horas_a_entregar: convertHorasToString(item.horas_a_entregar),
            horas_entregues: convertHorasToString(item.horas_entregues)
          }))
          : []);
        setAderenciaTurno(Array.isArray(data.turno)
          ? data.turno.map(item => ({
            ...item,
            horas_a_entregar: convertHorasToString(item.horas_a_entregar),
            horas_entregues: convertHorasToString(item.horas_entregues)
          }))
          : []);
        setAderenciaSubPraca(Array.isArray(data.sub_praca)
          ? data.sub_praca.map(item => ({
            ...item,
            horas_a_entregar: convertHorasToString(item.horas_a_entregar),
            horas_entregues: convertHorasToString(item.horas_entregues)
          }))
          : []);
        const newAderenciaOrigem = Array.isArray(data.origem)
          ? data.origem.map(item => ({
            ...item,
            horas_a_entregar: convertHorasToString(item.horas_a_entregar),
            horas_entregues: convertHorasToString(item.horas_entregues)
          }))
          : [];

        setAderenciaOrigem(newAderenciaOrigem);

        if (IS_DEV) {
          safeLog.info('[useDashboardMainData] Dados processados e estados atualizados:', {
            totals: newTotals,
            aderenciaSemanalLength: Array.isArray(data.semanal) ? data.semanal.length : 0,
            aderenciaDiaLength: Array.isArray(data.dia) ? data.dia.length : 0,
            aderenciaTurnoLength: Array.isArray(data.turno) ? data.turno.length : 0,
            aderenciaSubPracaLength: Array.isArray(data.sub_praca) ? data.sub_praca.length : 0,
            aderenciaOrigemLength: newAderenciaOrigem.length,
          });
        }

        // Armazenar dimensões para uso em filtros
        if (data.dimensoes) {
          setDimensoes(data.dimensoes);
        }

        // IMPORTANTE: Atualizar previousPayloadRef APENAS após fetch bem-sucedido
        // Isso garante que o fetch seja executado na primeira vez e quando o payload muda
        previousPayloadRef.current = currentPayloadKey;
        isFirstExecutionRef.current = false;
        pendingPayloadKeyRef.current = '';

        setError(null);
      } catch (err) {
        const errorMsg = getSafeErrorMessage(err);
        const error = err instanceof Error ? err : new Error(errorMsg);
        safeLog.error('Erro ao carregar dados principais do dashboard:', err);
        setError(errorMsg);
        if (onError) onError(error);
      } finally {
        setLoading(false);
        // Limpar referência do timeout após execução
        if (debounceRef.current === timeoutId) {
          debounceRef.current = null;
        }
      }
    }, DELAYS.DEBOUNCE);

    debounceRef.current = timeoutId;

    return () => {
      // Só cancelar o timeout se ele ainda for o atual
      // Isso evita cancelar um timeout que já foi executado ou substituído
      if (debounceRef.current && debounceRef.current === timeoutId) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [payloadKey, onError]);

  return {
    totals,
    aderenciaSemanal,
    aderenciaDia,
    aderenciaTurno,
    aderenciaSubPraca,
    aderenciaOrigem,
    dimensoes,
    loading,
    error,
  };
}
