import { useState, useEffect } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import type { DimensoesDashboard } from '@/types';
import { fetchAllWeeks, primeAllWeeksCache } from '@/hooks/data/allWeeksCache';

const CACHE_KEY = 'dashboard_dimensions_cache_v5';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hora
export const DEFAULT_YEARS = [2026, 2025, 2024];
const EMPTY_DIMENSIONS: DimensoesDashboard = {
  anos: DEFAULT_YEARS,
  semanas: [],
  pracas: [],
  sub_pracas: [],
  origens: [],
  turnos: []
};

interface UseDashboardDimensionsOptions {
  fetchRemote?: boolean;
}

export function useDashboardDimensions(options: UseDashboardDimensionsOptions = {}) {
  const { fetchRemote = true } = options;
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [semanasDisponiveis, setSemanasDisponiveis] = useState<string[]>([]);
  const [outrasDimensoes, setOutrasDimensoes] = useState<DimensoesDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchInitialDimensions = async () => {
      setLoading(true);

      try {
        const cached = readCachedDimensions();
        if (cached) {
          primeAllWeeksCache(cached.semanas);
          setAnosDisponiveis(cached.anos);
          setSemanasDisponiveis(cached.semanas);
          setOutrasDimensoes(cached);
          setLoading(false);
          return;
        }

        if (!fetchRemote) {
          setAnosDisponiveis(DEFAULT_YEARS);
          setSemanasDisponiveis([]);
          setOutrasDimensoes(EMPTY_DIMENSIONS);
          setLoading(false);
          return;
        }

        // Evita scans amplos na mv_aderencia_agregada: sub_pracas/origens/turnos
        // agora sao carregados sob demanda em useDimensionOptions.
        const [anosResult, semanasData, pracasResult] = await Promise.all([
          safeRpc<number[]>('listar_anos_disponiveis', {}, { timeout: 10000, validateParams: false }),
          fetchAllWeeks(),
          safeRpc<any[]>('list_pracas_disponiveis', {}, { timeout: 10000, validateParams: false })
        ]);

        if (cancelled) return;

        const anosData = Array.isArray(anosResult.data) ? anosResult.data : [];
        const mergedYears = Array.from(new Set([...DEFAULT_YEARS, ...anosData])).sort((a, b) => b - a);

        const pracasData = Array.isArray(pracasResult.data)
          ? pracasResult.data.map((p: any) => p?.praca || p).filter(Boolean).map(String)
          : [];

        const dimensoesBase: DimensoesDashboard = {
          anos: mergedYears,
          semanas: semanasData,
          pracas: Array.from(new Set(pracasData)).sort(),
          sub_pracas: [],
          origens: [],
          turnos: []
        };

        setAnosDisponiveis(mergedYears);
        setSemanasDisponiveis(semanasData);
        setOutrasDimensoes(dimensoesBase);
        writeCachedDimensions(dimensoesBase);
      } catch (err) {
        safeLog.error('Erro ao buscar dimensoes iniciais:', err);
        setAnosDisponiveis(DEFAULT_YEARS);
        setOutrasDimensoes(EMPTY_DIMENSIONS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchInitialDimensions();

    return () => {
      cancelled = true;
    };
  }, [fetchRemote]);

  return { anosDisponiveis, semanasDisponiveis, dimensoes: outrasDimensoes, loadingDimensions: loading };
}

function readCachedDimensions(): DimensoesDashboard | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { timestamp, data } = JSON.parse(cached);
    const isValid = Date.now() - timestamp < CACHE_DURATION;

    if (isValid && data?.anos?.length > 0 && Array.isArray(data.pracas)) {
      return data as DimensoesDashboard;
    }
  } catch {
    sessionStorage.removeItem(CACHE_KEY);
  }

  return null;
}

export function writeCachedDimensions(data: DimensoesDashboard) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
  } catch {
    // Cache em sessionStorage e uma otimização opcional; falhas nao devem afetar o dashboard.
  }
}
