import { useCallback, useEffect, useRef, useState } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { useSemanasComDados } from '@/hooks/data/useSemanasComDados';
import { fetchAllWeeks, getAllWeeksCache, primeAllWeeksCache } from '@/hooks/data/allWeeksCache';
import { IS_DEV } from '@/constants/environment';
import { useOrganization } from '@/contexts/OrganizationContext';


export function useAllWeeks(fallbackWeeks?: string[], anoSelecionado?: number) {
  const { organizationId, isLoading: isOrganizationLoading } = useOrganization();
  const organizationScopeKey = organizationId || 'global';
  const fallbackWeeksKey = (fallbackWeeks || []).join(',');
  const fallbackWeeksRef = useRef<{ key: string; weeks: string[] }>();
  if (!fallbackWeeksRef.current || fallbackWeeksRef.current.key !== fallbackWeeksKey) {
    fallbackWeeksRef.current = { key: fallbackWeeksKey, weeks: fallbackWeeks || [] };
  }
  const stableFallbackWeeks = fallbackWeeksRef.current.weeks;
  const [todasSemanas, setTodasSemanas] = useState<(number | string)[]>([]);
  const [loadingTodasSemanas, setLoadingTodasSemanas] = useState(false);
  const [errorTodasSemanas, setErrorTodasSemanas] = useState<string | null>(null);
  const [resolvedAllWeeksScopeKey, setResolvedAllWeeksScopeKey] = useState<string | null>(null);
  const [fallbackRetryNonce, setFallbackRetryNonce] = useState(0);
  const { semanasComDados, loadingSemanasComDados, error: semanasError, retry: retryYearWeeks } = useSemanasComDados(anoSelecionado ?? null);

  useEffect(() => {
    let cancelled = false;

    if (isOrganizationLoading) {
      setLoadingTodasSemanas(true);
      return () => { cancelled = true; };
    }

    if (anoSelecionado && semanasComDados.length > 0) {
      const orderedWeeks = [...semanasComDados].sort((a, b) => a - b);
      setTodasSemanas(orderedWeeks);
      setErrorTodasSemanas(null);
      setLoadingTodasSemanas(false);
      return () => { cancelled = true; };
    }

    if (anoSelecionado && loadingSemanasComDados) {
      setLoadingTodasSemanas(false);
      return () => { cancelled = true; };
    }

    if (anoSelecionado) {
      setTodasSemanas([]);
      setLoadingTodasSemanas(false);
      setErrorTodasSemanas(null);
      if (semanasError && IS_DEV) safeLog.warn('Semanas da comparação indisponíveis; aguardando nova tentativa.');
      return () => { cancelled = true; };
    }

    async function fetchFallback() {
      setLoadingTodasSemanas(true);
      setErrorTodasSemanas(null);
      const cached = getAllWeeksCache(true, organizationId);
      if (cached) {
        if (!cancelled) {
          setTodasSemanas(cached);
          setResolvedAllWeeksScopeKey(organizationScopeKey);
          setLoadingTodasSemanas(false);
        }
        return;
      }

      try {
        const processedWeeks = await fetchAllWeeks(organizationId);
        if (cancelled) return;
        if (processedWeeks.length > 0) {
          setTodasSemanas(processedWeeks);
        } else {
          const scopedFallbackWeeks = stableFallbackWeeks.filter((week) => /^\d{4}-W\d{1,2}$/.test(week));
          if (scopedFallbackWeeks.length > 0) {
            primeAllWeeksCache(scopedFallbackWeeks, organizationId);
            setTodasSemanas(scopedFallbackWeeks);
          } else {
            setTodasSemanas([]);
          }
        }
        setResolvedAllWeeksScopeKey(organizationScopeKey);
      } catch (err) {
        if (cancelled) return;
        if (IS_DEV) safeLog.error('Erro ao buscar semanas:', err);
        setErrorTodasSemanas('Não foi possível carregar a lista completa de semanas.');
        const scopedFallbackWeeks = stableFallbackWeeks.filter((week) => /^\d{4}-W\d{1,2}$/.test(week));
        if (scopedFallbackWeeks.length > 0) {
          setTodasSemanas(scopedFallbackWeeks);
        } else {
          setTodasSemanas([]);
        }
        setResolvedAllWeeksScopeKey(organizationScopeKey);
      } finally {
        if (!cancelled) setLoadingTodasSemanas(false);
      }
    }

    if (!anoSelecionado) {
      void fetchFallback();
    }

    return () => { cancelled = true; };
  }, [fallbackRetryNonce, stableFallbackWeeks, anoSelecionado, semanasComDados, loadingSemanasComDados, semanasError, organizationId, organizationScopeKey, isOrganizationLoading]);

  const retry = useCallback(() => {
    if (anoSelecionado) {
      retryYearWeeks();
      return;
    }
    setFallbackRetryNonce((current) => current + 1);
  }, [anoSelecionado, retryYearWeeks]);

  const visibleWeeks = anoSelecionado
    ? loadingSemanasComDados
      ? []
      : [...semanasComDados].sort((a, b) => a - b)
    : !isOrganizationLoading && resolvedAllWeeksScopeKey === organizationScopeKey && !loadingTodasSemanas
      ? todasSemanas
      : [];

  const hasResolvedCurrentOrganizationWeeks = resolvedAllWeeksScopeKey === organizationScopeKey;

  return {
    todasSemanas: visibleWeeks,
    loadingSemanas: anoSelecionado ? loadingSemanasComDados : isOrganizationLoading || loadingTodasSemanas || !hasResolvedCurrentOrganizationWeeks,
    errorSemanas: anoSelecionado ? semanasError : !isOrganizationLoading && hasResolvedCurrentOrganizationWeeks ? errorTodasSemanas : null,
    retrySemanas: retry,
  };
}
