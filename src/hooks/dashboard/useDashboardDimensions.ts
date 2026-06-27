import { useState, useEffect } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import type { DimensoesDashboard } from '@/types';
import { fetchAllWeeks, primeAllWeeksCache } from '@/hooks/data/allWeeksCache';
import { IS_DEV } from '@/constants/environment';
import { readJsonStorage, removeJsonStorage, writeJsonStorage } from '@/utils/storage/jsonStorage';

const CACHE_KEY = 'dashboard_dimensions_cache_v7';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hora
export const DEFAULT_YEARS = buildFallbackYears();
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

function buildFallbackYears() {
  const currentYear = new Date().getFullYear();
  return [currentYear, currentYear - 1, currentYear - 2];
}

function resolveAvailableYears(years: number[]) {
  const normalized = Array.from(new Set(
    years.filter((ano) => Number.isFinite(ano))
  )).sort((a, b) => b - a);

  return normalized.length > 0 ? normalized : DEFAULT_YEARS;
}

export function useDashboardDimensions(options: UseDashboardDimensionsOptions = {}) {
  const { fetchRemote = true } = options;
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [semanasDisponiveis, setSemanasDisponiveis] = useState<string[]>([]);
  const [outrasDimensoes, setOutrasDimensoes] = useState<DimensoesDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const scheduleYearsRefresh = (baseDimensions: DimensoesDashboard) => {
      if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(() => {
          void refreshYearsOnly(baseDimensions);
        }, { timeout: 2500 });
        return;
      }

      timeoutId = setTimeout(() => {
        void refreshYearsOnly(baseDimensions);
      }, 1200);
    };
    const refreshYearsOnly = async (baseDimensions: DimensoesDashboard) => {
      try {
        const anosResult = await safeRpc<number[]>('listar_anos_disponiveis', {}, {
          timeout: 10000,
          validateParams: false,
        });

        if (cancelled) return;

        const anosData = Array.isArray(anosResult.data) ? anosResult.data : [];
        const resolvedYears = resolveAvailableYears(anosData);

        setAnosDisponiveis(resolvedYears);
        setOutrasDimensoes((current) => {
          const nextDimensions = {
            ...(current || baseDimensions),
            anos: resolvedYears,
          };
          writeCachedDimensions(nextDimensions);
          return nextDimensions;
        });
      } catch (err) {
        if (IS_DEV) safeLog.error('Erro ao atualizar anos disponiveis:', err);
      }
    };

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
          scheduleYearsRefresh(cached);
          return;
        }

        if (!fetchRemote) {
          setAnosDisponiveis(DEFAULT_YEARS);
          setSemanasDisponiveis([]);
          setOutrasDimensoes(EMPTY_DIMENSIONS);
          setLoading(false);
          scheduleYearsRefresh(EMPTY_DIMENSIONS);
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
        const resolvedYears = resolveAvailableYears(anosData);

        const pracasData = Array.isArray(pracasResult.data)
          ? pracasResult.data.map((p: any) => p?.praca || p).filter(Boolean).map(String)
          : [];

        const dimensoesBase: DimensoesDashboard = {
          anos: resolvedYears,
          semanas: semanasData,
          pracas: Array.from(new Set(pracasData)).sort(),
          sub_pracas: [],
          origens: [],
          turnos: []
        };

        setAnosDisponiveis(resolvedYears);
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
      if (idleId !== null && typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [fetchRemote]);

  return { anosDisponiveis, semanasDisponiveis, dimensoes: outrasDimensoes, loadingDimensions: loading };
}

function readCachedDimensions(): DimensoesDashboard | null {
  if (typeof sessionStorage === 'undefined') return null;

  const cached = readJsonStorage<{ timestamp?: number; data?: Partial<DimensoesDashboard> } | null>(
    sessionStorage,
    CACHE_KEY,
    null
  );
  if (!cached) return null;

  const isValid = typeof cached.timestamp === 'number' && Date.now() - cached.timestamp < CACHE_DURATION;
  const data = cached.data;

  if (isValid && data?.anos?.length && Array.isArray(data.pracas)) {
    return {
      ...(data as DimensoesDashboard),
      anos: resolveAvailableYears(Array.isArray(data.anos) ? data.anos : [])
    };
  }

  removeJsonStorage(sessionStorage, CACHE_KEY);
  return null;
}

export function writeCachedDimensions(data: DimensoesDashboard) {
  if (typeof sessionStorage === 'undefined') return;

  try {
    writeJsonStorage(sessionStorage, CACHE_KEY, { timestamp: Date.now(), data });
  } catch {
    // Cache em sessionStorage e uma otimizaÃ§Ã£o opcional; falhas nao devem afetar o dashboard.
  }
}
