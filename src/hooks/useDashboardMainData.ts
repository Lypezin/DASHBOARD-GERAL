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
    
    // Evitar processamento se o payload não mudou realmente
    if (previousPayloadRef.current === payloadKey) {
      if (IS_DEV) {
        safeLog.info('[useDashboardMainData] Payload não mudou, ignorando');
      }
      return;
    }
    
    // Log sempre visível para debug
    console.log('🔵 [useDashboardMainData] useEffect ACIONADO (payload mudou)', {
      payload: filterPayload,
      p_ano: filterPayload.p_ano,
      p_semana: filterPayload.p_semana,
      p_data_inicial: filterPayload.p_data_inicial,
      timestamp: new Date().toISOString(),
    });
    
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
    // A função RPC aceita apenas p_ano, então aceitamos se p_ano estiver presente
    // ou se p_data_inicial estiver presente (modo intervalo)
    const hasValidFilters = (filterPayload.p_ano !== null && filterPayload.p_ano !== undefined) ||
                            (filterPayload.p_data_inicial !== null && filterPayload.p_data_inicial !== undefined);
    
    // Log sempre visível para debug
    console.log('🟢 [useDashboardMainData] Validação de filtros:', {
      hasValidFilters,
      p_ano: filterPayload.p_ano,
      p_semana: filterPayload.p_semana,
      p_data_inicial: filterPayload.p_data_inicial,
      reason: hasValidFilters 
        ? (filterPayload.p_ano ? 'p_ano presente' : 'p_data_inicial presente')
        : 'nenhum filtro válido',
    });
    
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
      console.log('🔄 [useDashboardMainData] Limpando cache - payload mudou de inválido para válido');
      if (IS_DEV) {
        safeLog.info('[useDashboardMainData] Limpando cache - payload mudou de inválido para válido');
      }
      cacheKeyRef.current = '';
      cachedDataRef.current = null;
    }
    
    // Atualizar referência do payload anterior ANTES de processar
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

    // Capturar o payload atual para usar dentro do timeout
    const currentPayload = filterPayload;
    const currentPayloadKey = payloadKey;
    
    debounceRef.current = setTimeout(async () => {
      // Verificar se o payload ainda é o mesmo (pode ter mudado durante o debounce)
      const currentPayloadKeyCheck = JSON.stringify(currentPayload);
      if (currentPayloadKeyCheck !== currentPayloadKey) {
        console.log('⚠️ [useDashboardMainData] Payload mudou durante debounce, cancelando fetch');
        return;
      }
      
      // Verificar se o payload tem valores válidos antes de fazer fetch
      // A função RPC aceita apenas p_ano, então aceitamos se p_ano estiver presente
      // ou se p_data_inicial estiver presente (modo intervalo)
      const hasValidFilters = (currentPayload.p_ano !== null && currentPayload.p_ano !== undefined) ||
                              (currentPayload.p_data_inicial !== null && currentPayload.p_data_inicial !== undefined);
      
      console.log('🔍 [useDashboardMainData] Verificando se deve fazer fetch:', {
        hasValidFilters,
        p_ano: currentPayload.p_ano,
        p_semana: currentPayload.p_semana,
        p_data_inicial: currentPayload.p_data_inicial,
        debounceDelay: DELAYS.DEBOUNCE,
        reason: hasValidFilters 
          ? (currentPayload.p_ano ? 'p_ano presente' : 'p_data_inicial presente')
          : 'nenhum filtro válido',
      });
      
      if (IS_DEV) {
        safeLog.info('[useDashboardMainData] Verificando se deve fazer fetch:', {
          hasValidFilters,
          payload: currentPayload,
          debounceDelay: DELAYS.DEBOUNCE,
        });
      }
      
      if (!hasValidFilters) {
        console.warn('⚠️ [useDashboardMainData] Payload INVÁLIDO - não fazendo fetch:', {
          payload: currentPayload,
          p_ano: currentPayload.p_ano,
          p_semana: currentPayload.p_semana,
          p_data_inicial: currentPayload.p_data_inicial,
        });
        if (IS_DEV) {
          safeLog.warn('[useDashboardMainData] Payload inválido, aguardando filtros válidos:', {
            payload: currentPayload,
            p_ano: currentPayload.p_ano,
            p_semana: currentPayload.p_semana,
            p_data_inicial: currentPayload.p_data_inicial,
          });
        }
        setLoading(false);
        return;
      }
      
      console.log('🚀 [useDashboardMainData] FETCH ACIONADO com payload válido:', {
        p_ano: currentPayload.p_ano,
        p_semana: currentPayload.p_semana,
        p_data_inicial: currentPayload.p_data_inicial,
        timestamp: new Date().toISOString(),
      });
      
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
        
        console.log('🔄 [useDashboardMainData] Chamando safeRpc...');
        
        const { data, error: rpcError } = await safeRpc<DashboardResumoData>('dashboard_resumo', currentPayload, {
          timeout: RPC_TIMEOUTS.DEFAULT,
          validateParams: true
        });
        
        console.log('📥 [useDashboardMainData] Resposta do safeRpc:', {
          hasData: !!data,
          hasError: !!rpcError,
          dataKeys: data ? Object.keys(data) : null,
          errorMessage: rpcError ? String(rpcError.message || rpcError) : null,
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
          console.error('❌ [useDashboardMainData] Erro do RPC:', rpcError);
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

        console.log('✅ [useDashboardMainData] DADOS RECEBIDOS:', {
          hasTotais: !!data.totais,
          totais: data.totais,
          hasSemanal: Array.isArray(data.semanal),
          semanalLength: Array.isArray(data.semanal) ? data.semanal.length : 0,
          hasDia: Array.isArray(data.dia),
          diaLength: Array.isArray(data.dia) ? data.dia.length : 0,
          hasDimensoes: !!data.dimensoes,
        });
        
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
        cacheKeyRef.current = currentPayloadKey;

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
        
        console.log('✅ [useDashboardMainData] ESTADOS ATUALIZADOS:', {
          totals: newTotals,
          aderenciaSemanalLength: Array.isArray(data.semanal) ? data.semanal.length : 0,
          aderenciaDiaLength: Array.isArray(data.dia) ? data.dia.length : 0,
          aderenciaTurnoLength: Array.isArray(data.turno) ? data.turno.length : 0,
          aderenciaSubPracaLength: Array.isArray(data.sub_praca) ? data.sub_praca.length : 0,
          aderenciaOrigemLength: newAderenciaOrigem.length,
        });
        
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
          console.log('✅ [useDashboardMainData] Armazenando dimensões:', {
            hasPracas: !!data.dimensoes.pracas,
            pracasLength: Array.isArray(data.dimensoes.pracas) ? data.dimensoes.pracas.length : 0,
            pracas: data.dimensoes.pracas,
            hasSubPracas: !!data.dimensoes.sub_pracas,
            hasOrigens: !!data.dimensoes.origens,
            hasTurnos: !!data.dimensoes.turnos,
          });
          setDimensoes(data.dimensoes);
        } else {
          console.warn('⚠️ [useDashboardMainData] Dados não contêm dimensões');
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

