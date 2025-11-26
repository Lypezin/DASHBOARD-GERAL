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
import { RPC_TIMEOUTS, DELAYS } from '@/constants/config';
import { transformDashboardData, createEmptyDashboardData } from '@/utils/dashboard/transformers';

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
    if (previousPayloadRef.current === payloadKey) {
      if (IS_DEV) safeLog.info('[useDashboardMainData] Payload não mudou, ignorando');
      return;
    }

    if (pendingPayloadKeyRef.current === payloadKey && debounceRef.current) return;

    if (debounceRef.current && previousPayloadRef.current !== '' && pendingPayloadKeyRef.current !== payloadKey) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (IS_DEV) {
      safeLog.info('[useDashboardMainData] useEffect acionado com payload:', {
        payloadKey,
        previousPayload: previousPayloadRef.current,
      });
    }

    const hasValidFilters = (filterPayload.p_ano !== null && filterPayload.p_ano !== undefined) ||
      (filterPayload.p_data_inicial !== null && filterPayload.p_data_inicial !== undefined);

    const shouldFetch = true;

    // Se o payload anterior era inválido e agora é válido, limpar cache
    const previousPayloadWasInvalid = previousPayloadRef.current &&
      (!previousPayloadRef.current.includes('"p_ano":') || previousPayloadRef.current.includes('"p_ano":null')) &&
      (!previousPayloadRef.current.includes('"p_data_inicial":') || previousPayloadRef.current.includes('"p_data_inicial":null'));

    if (previousPayloadWasInvalid && hasValidFilters) {
      if (IS_DEV) safeLog.info('[useDashboardMainData] Limpando cache - payload mudou de inválido para válido');
      cacheKeyRef.current = '';
      cachedDataRef.current = null;
    }

    pendingPayloadKeyRef.current = payloadKey;

    // Verificar cache
    if (shouldFetch && cacheKeyRef.current === payloadKey && cachedDataRef.current) {
      if (IS_DEV) safeLog.info('[useDashboardMainData] Usando dados do cache');

      const processedData = transformDashboardData(cachedDataRef.current);

      setTotals(processedData.totals);
      setAderenciaSemanal(processedData.aderenciaSemanal);
      setAderenciaDia(processedData.aderenciaDia);
      setAderenciaTurno(processedData.aderenciaTurno);
      setAderenciaSubPraca(processedData.aderenciaSubPraca);
      setAderenciaOrigem(processedData.aderenciaOrigem);

      if (processedData.dimensoes) setDimensoes(processedData.dimensoes);

      setError(null);
      setLoading(false);
      previousPayloadRef.current = payloadKey;
      isFirstExecutionRef.current = false;
      return;
    }

    const currentPayload = filterPayload;
    const currentPayloadKey = payloadKey;

    const timeoutId = setTimeout(async () => {
      if (debounceRef.current !== timeoutId) return;
      if (JSON.stringify(currentPayload) !== currentPayloadKey) return;
      if (pendingPayloadKeyRef.current !== currentPayloadKey) return;

      const isFirstExecutionInTimeout = isFirstExecutionRef.current;
      const hasValidFiltersInTimeout = (currentPayload.p_ano !== null && currentPayload.p_ano !== undefined) ||
        (currentPayload.p_data_inicial !== null && currentPayload.p_data_inicial !== undefined);

      if (IS_DEV) safeLog.info('[useDashboardMainData] Iniciando fetch com payload válido:', currentPayload);

      setLoading(true);
      setError(null);

      try {
        // Verificar se o Supabase está disponível
        try {
          const { supabase } = await import('@/lib/supabaseClient');
          if (!supabase || !supabase.rpc) throw new Error('Cliente Supabase não está disponível');
        } catch (supabaseError) {
          console.error('❌ [useDashboardMainData] Erro ao verificar cliente Supabase:', supabaseError);
          const errorMsg = 'Cliente Supabase não está disponível. Aguarde o carregamento completo da página.';
          setError(errorMsg);
          if (onError) onError(new Error(errorMsg));
          setLoading(false);
          return;
        }

        const { data, error: rpcError } = await safeRpc<DashboardResumoData>('dashboard_resumo', currentPayload, {
          timeout: RPC_TIMEOUTS.DEFAULT,
          validateParams: false
        });

        if (rpcError) {
          const errorMessage = String(rpcError?.message || '');
          if (errorMessage.includes('placeholder.supabase.co') || errorMessage.includes('ERR_NAME_NOT_RESOLVED')) {
            const errorMsg = 'Variáveis de ambiente do Supabase não estão configuradas.';
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
          if (IS_DEV) safeLog.warn('[useDashboardMainData] dashboard_resumo retornou null ou undefined');
          const emptyData = createEmptyDashboardData();
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

        if (IS_DEV) safeLog.info('[useDashboardMainData] Dados recebidos com sucesso');

        const cacheKeyToUse = isFirstExecutionInTimeout && !hasValidFiltersInTimeout
          ? '__first_execution_dimensions__'
          : currentPayloadKey;

        cachedDataRef.current = data;
        cacheKeyRef.current = cacheKeyToUse;

        const processedData = transformDashboardData(data);

        setTotals(processedData.totals);
        setAderenciaSemanal(processedData.aderenciaSemanal);
        setAderenciaDia(processedData.aderenciaDia);
        setAderenciaTurno(processedData.aderenciaTurno);
        setAderenciaSubPraca(processedData.aderenciaSubPraca);
        setAderenciaOrigem(processedData.aderenciaOrigem);

        if (processedData.dimensoes) setDimensoes(processedData.dimensoes);

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
        if (debounceRef.current === timeoutId) debounceRef.current = null;
      }
    }, DELAYS.DEBOUNCE);

    debounceRef.current = timeoutId;

    return () => {
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
