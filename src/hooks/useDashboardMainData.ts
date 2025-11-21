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
  if (error?.message) return error.message;
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

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const payloadKey = JSON.stringify(filterPayload);
    
    // Verificar cache
    if (cacheKeyRef.current === payloadKey && cachedDataRef.current) {
      const cached = cachedDataRef.current;
      setTotals({
        ofertadas: safeNumber(cached.totais?.corridas_ofertadas ?? 0),
        aceitas: safeNumber(cached.totais?.corridas_aceitas ?? 0),
        rejeitadas: safeNumber(cached.totais?.corridas_rejeitadas ?? 0),
        completadas: safeNumber(cached.totais?.corridas_completadas ?? 0),
      });
      setAderenciaSemanal(Array.isArray(cached.semanal) ? cached.semanal : []);
      setAderenciaDia(Array.isArray(cached.dia) ? cached.dia : []);
      setAderenciaTurno(Array.isArray(cached.turno) ? cached.turno : []);
      setAderenciaSubPraca(Array.isArray(cached.sub_praca) ? cached.sub_praca : []);
      setAderenciaOrigem(Array.isArray(cached.origem) ? cached.origem : []);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error: rpcError } = await safeRpc<DashboardResumoData>('dashboard_resumo', filterPayload, {
          timeout: RPC_TIMEOUTS.DEFAULT,
          validateParams: true
        });
        
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
          safeLog.warn('dashboard_resumo retornou null');
          const errorMsg = 'Não foi possível carregar os dados do dashboard.';
          setError(errorMsg);
          if (onError) onError(new Error(errorMsg));
          return;
        }

        // Atualizar cache
        cachedDataRef.current = data;
        cacheKeyRef.current = payloadKey;

        // Atualizar estados
        setTotals({
          ofertadas: safeNumber(data.totais?.corridas_ofertadas ?? 0),
          aceitas: safeNumber(data.totais?.corridas_aceitas ?? 0),
          rejeitadas: safeNumber(data.totais?.corridas_rejeitadas ?? 0),
          completadas: safeNumber(data.totais?.corridas_completadas ?? 0),
        });
        setAderenciaSemanal(Array.isArray(data.semanal) ? data.semanal : []);
        setAderenciaDia(Array.isArray(data.dia) ? data.dia : []);
        setAderenciaTurno(Array.isArray(data.turno) ? data.turno : []);
        setAderenciaSubPraca(Array.isArray(data.sub_praca) ? data.sub_praca : []);
        setAderenciaOrigem(Array.isArray(data.origem) ? data.origem : []);
        
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

