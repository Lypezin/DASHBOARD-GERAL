import { useState, useEffect, useCallback } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import type { DimensoesDashboard } from '@/types';
import { IS_DEV } from '@/constants/environment';
import { readJsonStorage, removeJsonStorage, writeJsonStorage } from '@/utils/storage/jsonStorage';
import { scheduleIdleTask } from '@/utils/scheduling/idleTask';

const CACHE_KEY = 'dashboard_dimensions_cache_v8';
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
  cacheScopeKey?: string | null;
  organizationId?: string | null;
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
  const { fetchRemote = true, organizationId = null } = options;
  const cacheScopeKey = options.cacheScopeKey?.trim() || 'global';
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [semanasDisponiveis, setSemanasDisponiveis] = useState<string[]>([]);
  const [outrasDimensoes, setOutrasDimensoes] = useState<DimensoesDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedCacheScopeKey, setResolvedCacheScopeKey] = useState<string | null>(null);
  const [dimensionsError, setDimensionsError] = useState<{ scopeKey: string; message: string } | null>(null);
  const [retryIndex, setRetryIndex] = useState(0);
  const retry = useCallback(() => setRetryIndex((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    let cancelYearsRefresh: (() => void) | null = null;

    const scheduleYearsRefresh = (baseDimensions: DimensoesDashboard) => {
      cancelYearsRefresh = scheduleIdleTask(
        () => {
          void refreshYearsOnly(baseDimensions);
        },
        { timeoutMs: 2500, fallbackDelayMs: 1200 }
      );
    };
    const refreshYearsOnly = async (baseDimensions: DimensoesDashboard) => {
      try {
        const anosResult = await safeRpc<number[]>('listar_anos_disponiveis', { p_organization_id: organizationId }, {
          timeout: 10000,
          validateParams: false,
        });

        if (cancelled) return;
        if (anosResult.error || !Array.isArray(anosResult.data)) {
          if (IS_DEV) safeLog.warn('Nao foi possivel atualizar os anos; mantendo as opcoes atuais.', anosResult.error);
          return;
        }

        const resolvedYears = resolveAvailableYears(anosResult.data);

        setAnosDisponiveis(resolvedYears);
        setOutrasDimensoes((current) => {
          const nextDimensions = {
            ...(current || baseDimensions),
            anos: resolvedYears,
          };
          writeCachedDimensions(nextDimensions, cacheScopeKey);
          return nextDimensions;
        });
      } catch (err) {
        if (IS_DEV) safeLog.error('Erro ao atualizar anos disponiveis:', err);
      }
    };

    const fetchInitialDimensions = async () => {
      setLoading(true);
      setDimensionsError(null);
      let cachedDimensions: { data: DimensoesDashboard; isFresh: boolean } | null = null;

      try {
        cachedDimensions = readCachedDimensions(cacheScopeKey);
        if (cachedDimensions) {
            const cached = cachedDimensions.data;
            setAnosDisponiveis(cached.anos);
            setSemanasDisponiveis(cached.semanas);
            setOutrasDimensoes(cached);
            setResolvedCacheScopeKey(cacheScopeKey);
            if (cachedDimensions.isFresh) return;
        }

        if (!fetchRemote) {
          if (!cachedDimensions) {
            setAnosDisponiveis(DEFAULT_YEARS);
            setSemanasDisponiveis([]);
            setOutrasDimensoes(EMPTY_DIMENSIONS);
            setResolvedCacheScopeKey(cacheScopeKey);
            scheduleYearsRefresh(EMPTY_DIMENSIONS);
          }
          return;
        }

        // Evita scans amplos na mv_aderencia_agregada: sub_pracas/origens/turnos
        // agora sao carregados sob demanda em useDimensionOptions.
        const [anosResult, pracasResult] = await Promise.all([
          safeRpc<number[]>('listar_anos_disponiveis', { p_organization_id: organizationId }, { timeout: 10000, validateParams: false }),
          safeRpc<any[]>('list_pracas_disponiveis', { p_organization_id: organizationId }, { timeout: 10000, validateParams: false })
        ]);

        if (cancelled) return;
        if (anosResult.error) throw anosResult.error;
        if (pracasResult.error) throw pracasResult.error;
        if (!Array.isArray(anosResult.data) || !Array.isArray(pracasResult.data)) {
          throw new Error('As consultas de anos e praças retornaram respostas inválidas.');
        }

        const resolvedYears = resolveAvailableYears(anosResult.data);

        const pracasData = pracasResult.data.map((p: any) => p?.praca || p).filter(Boolean).map(String);

        const dimensoesBase: DimensoesDashboard = {
          anos: resolvedYears,
          // The filter bar loads only the selected year's weeks via get_available_weeks.
          semanas: [],
          pracas: Array.from(new Set(pracasData)).sort(),
          sub_pracas: [],
          origens: [],
          turnos: []
        };

        setAnosDisponiveis(resolvedYears);
        setSemanasDisponiveis([]);
        setOutrasDimensoes(dimensoesBase);
        setResolvedCacheScopeKey(cacheScopeKey);
        setDimensionsError(null);
        writeCachedDimensions(dimensoesBase, cacheScopeKey);
      } catch (err) {
        safeLog.error('Erro ao buscar dimensoes iniciais:', err);
        if (!cancelled) {
          setDimensionsError({
            scopeKey: cacheScopeKey,
            message: 'Não foi possível atualizar as opções de anos e praças.',
          });
          if (cachedDimensions) {
            setAnosDisponiveis(cachedDimensions.data.anos);
            setSemanasDisponiveis(cachedDimensions.data.semanas);
            setOutrasDimensoes(cachedDimensions.data);
            setResolvedCacheScopeKey(cacheScopeKey);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchInitialDimensions();

    return () => {
      cancelled = true;
      cancelYearsRefresh?.();
    };
  }, [cacheScopeKey, fetchRemote, organizationId, retryIndex]);

  const hasCurrentScope = resolvedCacheScopeKey === cacheScopeKey;

  return {
    anosDisponiveis: hasCurrentScope ? anosDisponiveis : DEFAULT_YEARS,
    semanasDisponiveis: hasCurrentScope ? semanasDisponiveis : [],
    dimensoes: hasCurrentScope ? outrasDimensoes : null,
    loadingDimensions: loading || !hasCurrentScope,
    dimensionsError: dimensionsError?.scopeKey === cacheScopeKey ? dimensionsError.message : null,
    retryDimensions: retry,
  };
}

function readCachedDimensions(cacheScopeKey: string): { data: DimensoesDashboard; isFresh: boolean } | null {
  if (typeof sessionStorage === 'undefined') return null;

  const cached = readJsonStorage<{ timestamp?: number; data?: Partial<DimensoesDashboard> } | null>(
    sessionStorage,
    `${CACHE_KEY}:${cacheScopeKey}`,
    null
  );
  if (!cached) return null;

  const data = cached.data;
  const hasValidTimestamp = typeof cached.timestamp === 'number' && cached.timestamp > 0;

  if (hasValidTimestamp && data?.anos?.length && Array.isArray(data.pracas)) {
    return {
      isFresh: Date.now() - cached.timestamp! < CACHE_DURATION,
      data: {
      ...(data as DimensoesDashboard),
      anos: resolveAvailableYears(Array.isArray(data.anos) ? data.anos : [])
      }
    };
  }

  removeJsonStorage(sessionStorage, `${CACHE_KEY}:${cacheScopeKey}`);
  return null;
}

export function writeCachedDimensions(data: DimensoesDashboard, cacheScopeKey = 'global') {
  if (typeof sessionStorage === 'undefined') return;

  try {
    writeJsonStorage(sessionStorage, `${CACHE_KEY}:${cacheScopeKey.trim() || 'global'}`, { timestamp: Date.now(), data });
  } catch {
    // Cache em sessionStorage e uma otimizaÃ§Ã£o opcional; falhas nao devem afetar o dashboard.
  }
}
