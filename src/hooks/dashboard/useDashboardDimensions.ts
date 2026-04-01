import { useState, useEffect } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import type { DimensoesDashboard } from '@/types';
import { getInitialCacheData } from './useDashboardCache';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useDashboardDimensions(preferredDimensoes: DimensoesDashboard | null = null) {
  const cachedMainDimensions = getInitialCacheData()?.dimensoes ?? null;
  const initialDimensions = preferredDimensoes ?? cachedMainDimensions;

  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>(initialDimensions?.anos ?? []);
  const [semanasDisponiveis, setSemanasDisponiveis] = useState<string[]>(initialDimensions?.semanas ?? []);
  const [outrasDimensoes, setOutrasDimensoes] = useState<DimensoesDashboard | null>(initialDimensions);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!preferredDimensoes) {
      return;
    }

    setOutrasDimensoes((current) => {
      if (current && JSON.stringify(current) === JSON.stringify(preferredDimensoes)) {
        return current;
      }

      return preferredDimensoes;
    });

    if (preferredDimensoes.anos?.length > 0) {
      setAnosDisponiveis(preferredDimensoes.anos);
    }

    if (preferredDimensoes.semanas?.length > 0) {
      setSemanasDisponiveis(preferredDimensoes.semanas);
    }
  }, [preferredDimensoes]);

  useEffect(() => {
    const fetchInitialDimensions = async () => {
      setLoading(true);

      // Cache Key
      const CACHE_KEY = 'dashboard_dimensions_cache_v2';
      const CACHE_DURATION = 1000 * 60 * 60; // 1 hora

      try {
        // 1. Tentar ler do cache
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { timestamp, data } = JSON.parse(cached);
          const isValid = Date.now() - timestamp < CACHE_DURATION;

          if (isValid && data.anos?.length > 0) {
            setAnosDisponiveis(data.anos);
            setSemanasDisponiveis(data.semanas || []);
            setOutrasDimensoes(data.dimensoes || preferredDimensoes || cachedMainDimensions);
            setLoading(false);
            return;
          }
        }

        // 2. Se não houver cache ou expirou, buscar da API em paralelo
        const [anosResult, semanasResult] = await Promise.all([
          safeRpc<number[]>('listar_anos_disponiveis', {}, { timeout: 10000, validateParams: false }),
          safeRpc<any[]>('listar_todas_semanas', {}, { timeout: 10000, validateParams: false })
        ]);

        // Processar Anos
        const anosData = anosResult.data || [2024, 2025, 2026];
        const mergedYears = Array.from(new Set([...[2024, 2025, 2026], ...anosData])).sort((a, b) => b - a);
        setAnosDisponiveis(mergedYears);

        // Processar Semanas
        const semanasData = Array.isArray(semanasResult.data)
          ? semanasResult.data.map(s => (typeof s === 'object' && s !== null ? `${s.ano || 2025}-W${s.semana || s.numero_semana}` : String(s)))
          : [];
        setSemanasDisponiveis(semanasData);

        // Processar Outras Dimensões
        const dimensoesBase: DimensoesDashboard = preferredDimensoes || cachedMainDimensions || {
          anos: mergedYears,
          semanas: semanasData,
          pracas: [],
          sub_pracas: [],
          origens: [],
          turnos: []
        };
        
        setOutrasDimensoes(dimensoesBase);

        // 3. Salvar no Cache
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          timestamp: Date.now(),
          data: {
            anos: mergedYears,
            semanas: semanasData,
            dimensoes: dimensoesBase
          }
        }));

      } catch (err) {
        safeLog.error('Erro ao buscar dimensões iniciais:', err);
        setAnosDisponiveis([2025]);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialDimensions();
  }, [cachedMainDimensions, preferredDimensoes]);

  return { anosDisponiveis, semanasDisponiveis, dimensoes: outrasDimensoes, loadingDimensions: loading };
}
