/**
 * Hook para buscar dados principais do dashboard
 * Separa lógica de busca de dados principais (totais, aderências)
 */

import { useState, useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const payloadKey = JSON.stringify(filterPayload);
    
    if (IS_DEV) {
      safeLog.info('[useDashboardMainData] useEffect acionado com payload:', {
        payload: filterPayload,
        payloadKey,
        previousPayload: previousPayloadRef.current,
        cacheKey: cacheKeyRef.current,
        hasCachedData: !!cachedDataRef.current,
      });
    }
    
    // Verificar se o payload tem valores válidos antes de usar cache
    // Se p_ano ou p_semana forem null, não usar cache e forçar fetch
    const hasValidFilters = filterPayload.p_ano !== null && filterPayload.p_ano !== undefined &&
                            (filterPayload.p_semana !== null && filterPayload.p_semana !== undefined ||
                             filterPayload.p_data_inicial !== null && filterPayload.p_data_inicial !== undefined);
    
    if (IS_DEV) {
      safeLog.info('[useDashboardMainData] Validação de filtros:', {
        hasValidFilters,
        p_ano: filterPayload.p_ano,
        p_semana: filterPayload.p_semana,
        p_data_inicial: filterPayload.p_data_inicial,
      });
    }
    
    // Se o payload anterior era inválido e agora é válido, limpar cache
    const previousPayloadWasInvalid = previousPayloadRef.current && 
      (previousPayloadRef.current.includes('"p_semana":null') || 
       (!previousPayloadRef.current.includes('"p_semana":') && !previousPayloadRef.current.includes('"p_data_inicial":')));
    
    if (previousPayloadWasInvalid && hasValidFilters) {
      if (IS_DEV) {
        safeLog.info('[useDashboardMainData] Limpando cache - payload mudou de inválido para válido');
      }
      cacheKeyRef.current = '';
      cachedDataRef.current = null;
    }
    
    previousPayloadRef.current = payloadKey;
    
    // Verificar cache apenas se tiver filtros válidos
    if (hasValidFilters && cacheKeyRef.current === payloadKey && cachedDataRef.current) {
      if (IS_DEV) {
        safeLog.info('[useDashboardMainData] Usando dados do cache');
      }
      const cached = cachedDataRef.current;
      
      // Função auxiliar para converter horas
      const convertHorasToString = (value: number | string | undefined): string => {
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
      return;
    }

    debounceRef.current = setTimeout(async () => {
      // Verificar se o payload tem valores válidos antes de fazer fetch
      const hasValidFilters = filterPayload.p_ano !== null && filterPayload.p_ano !== undefined &&
                              (filterPayload.p_semana !== null && filterPayload.p_semana !== undefined ||
                               filterPayload.p_data_inicial !== null && filterPayload.p_data_inicial !== undefined);
      
      if (IS_DEV) {
        safeLog.info('[useDashboardMainData] Verificando se deve fazer fetch:', {
          hasValidFilters,
          payload: filterPayload,
          debounceDelay: DELAYS.DEBOUNCE,
        });
      }
      
      if (!hasValidFilters) {
        if (IS_DEV) {
          safeLog.warn('[useDashboardMainData] Payload inválido, aguardando filtros válidos:', {
            payload: filterPayload,
            p_ano: filterPayload.p_ano,
            p_semana: filterPayload.p_semana,
            p_data_inicial: filterPayload.p_data_inicial,
          });
        }
        setLoading(false);
        return;
      }
      
      if (IS_DEV) {
        safeLog.info('[useDashboardMainData] Iniciando fetch com payload válido:', filterPayload);
      }
      
      setLoading(true);
      setError(null);
      
      try {
        if (IS_DEV) {
          safeLog.info('[useDashboardMainData] Chamando safeRpc dashboard_resumo com:', {
            functionName: 'dashboard_resumo',
            payload: filterPayload,
            timeout: RPC_TIMEOUTS.DEFAULT,
          });
        }
        
        const { data, error: rpcError } = await safeRpc<DashboardResumoData>('dashboard_resumo', filterPayload, {
          timeout: RPC_TIMEOUTS.DEFAULT,
          validateParams: true
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
            safeLog.warn('[useDashboardMainData] dashboard_resumo retornou null ou undefined');
          }
          const errorMsg = 'Não foi possível carregar os dados do dashboard.';
          setError(errorMsg);
          if (onError) onError(new Error(errorMsg));
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
        cachedDataRef.current = data;
        cacheKeyRef.current = payloadKey;

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
        const convertHorasToString = (value: number | string | undefined): string => {
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
        
        setError(null);
      } catch (err) {
        const errorMsg = getSafeErrorMessage(err);
        const error = err instanceof Error ? err : new Error(errorMsg);
        safeLog.error('Erro ao carregar dados principais do dashboard:', err);
        setError(errorMsg);
        if (onError) onError(error);
      } finally {
        setLoading(false);
      }
    }, DELAYS.DEBOUNCE);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [filterPayload, onError]);

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

