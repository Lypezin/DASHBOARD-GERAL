/**
 * Hook para buscar dados de evolução do dashboard
 * Separa lógica de busca de evolução (mensal, semanal, UTR)
 */

import { useState, useEffect, useRef } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { is500Error } from '@/lib/rpcErrorHandler';
import { EvolucaoMensal, EvolucaoSemanal, UtrSemanal } from '@/types';
import { RPC_TIMEOUTS, CACHE, DELAYS } from '@/constants/config';

const IS_DEV = process.env.NODE_ENV === 'development';

interface UseDashboardEvolucaoOptions {
  filterPayload: any;
  anoEvolucao: number;
  activeTab: string;
}

/**
 * Hook para buscar dados de evolução do dashboard
 */
export function useDashboardEvolucao(options: UseDashboardEvolucaoOptions) {
  const { filterPayload, anoEvolucao, activeTab } = options;
  
  const [evolucaoMensal, setEvolucaoMensal] = useState<EvolucaoMensal[]>([]);
  const [evolucaoSemanal, setEvolucaoSemanal] = useState<EvolucaoSemanal[]>([]);
  const [utrSemanal, setUtrSemanal] = useState<UtrSemanal[]>([]);
  const [loading, setLoading] = useState(false);

  const evolucaoCacheRef = useRef<Map<string, { mensal: EvolucaoMensal[]; semanal: EvolucaoSemanal[]; utrSemanal: UtrSemanal[]; timestamp: number }>>(new Map());
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Só carregar se estiver na aba de evolução
    if (activeTab !== 'evolucao') {
      setEvolucaoMensal([]);
      setEvolucaoSemanal([]);
      setUtrSemanal([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const pracaFilter = (filterPayload as any)?.p_praca || null;
    const cacheKey = `evolucao-${anoEvolucao}-${pracaFilter || 'all'}`;
    const cached = evolucaoCacheRef.current.get(cacheKey);

    // Verificar cache
    if (cached && Date.now() - cached.timestamp < CACHE.EVOLUCAO_TTL) {
      setEvolucaoMensal(cached.mensal);
      setEvolucaoSemanal(cached.semanal);
      setUtrSemanal(cached.utrSemanal);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      
      try {
        const [mensalRes, semanalRes] = await Promise.all([
          safeRpc<EvolucaoMensal[]>('listar_evolucao_mensal', { p_praca: pracaFilter, p_ano: anoEvolucao }, {
            timeout: RPC_TIMEOUTS.MEDIUM,
            validateParams: false
          }),
          safeRpc<EvolucaoSemanal[]>('listar_evolucao_semanal', { p_praca: pracaFilter || null, p_ano: anoEvolucao, p_limite_semanas: 60 }, {
            timeout: RPC_TIMEOUTS.MEDIUM,
            validateParams: false
          })
        ]);

        // Tratar erros silenciosamente
        if (mensalRes.error) {
          const is500 = is500Error(mensalRes.error);
          if (is500 && IS_DEV) {
            safeLog.warn('Erro 500 ao carregar evolução mensal (ignorado):', mensalRes.error);
          } else if (!is500) {
            safeLog.error('Erro ao carregar evolução mensal:', mensalRes.error);
          }
        }
        
        if (semanalRes.error) {
          const is500 = is500Error(semanalRes.error);
          if (is500 && IS_DEV) {
            safeLog.warn('Erro 500 ao carregar evolução semanal (ignorado):', semanalRes.error);
          } else if (!is500) {
            safeLog.error('Erro ao carregar evolução semanal:', semanalRes.error);
          }
        }

        const mensal = mensalRes.data || [];
        const semanal = semanalRes.data || [];

        // Calcular UTR semanal
        const utrSemanalData: UtrSemanal[] = semanal.map(item => ({
          ano: item.ano,
          semana: item.semana,
          semana_label: item.semana_label,
          tempo_horas: item.total_segundos / 3600,
          total_corridas: item.total_corridas || 0,
          utr: item.total_segundos > 0 && item.total_corridas 
            ? (item.total_corridas / (item.total_segundos / 3600))
            : 0
        }));

        // Atualizar cache
        evolucaoCacheRef.current.set(cacheKey, {
          mensal,
          semanal,
          utrSemanal: utrSemanalData,
          timestamp: Date.now()
        });

        setEvolucaoMensal(mensal);
        setEvolucaoSemanal(semanal);
        setUtrSemanal(utrSemanalData);
      } catch (err) {
        safeLog.error('Erro ao carregar evolução:', err);
      } finally {
        setLoading(false);
      }
    }, DELAYS.EVOLUCAO);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [filterPayload, anoEvolucao, activeTab]);

  return {
    evolucaoMensal,
    evolucaoSemanal,
    utrSemanal,
    loading,
  };
}

