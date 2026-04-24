import { useEffect, useState } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { useSemanasComDados } from '@/hooks/data/useSemanasComDados';
import { fetchAllWeeks, getAllWeeksCache, primeAllWeeksCache } from '@/hooks/data/allWeeksCache';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useAllWeeks(fallbackWeeks?: string[], anoSelecionado?: number) {
  const [todasSemanas, setTodasSemanas] = useState<(number | string)[]>([]);
  const { semanasComDados, loadingSemanasComDados } = useSemanasComDados(anoSelecionado ?? null);

  useEffect(() => {
    if (anoSelecionado && semanasComDados.length > 0) {
      const orderedWeeks = [...semanasComDados].sort((a, b) => a - b);
      setTodasSemanas(orderedWeeks);
      return;
    }

    if (!anoSelecionado && fallbackWeeks && fallbackWeeks.length > 0) {
      primeAllWeeksCache(fallbackWeeks);
      setTodasSemanas(fallbackWeeks);
      return;
    }

    if (anoSelecionado && loadingSemanasComDados) {
      return;
    }

    async function fetchFallback() {
      const cached = getAllWeeksCache();
      if (cached) {
        setTodasSemanas(cached);
        return;
      }

      try {
        const processedWeeks = await fetchAllWeeks();
        if (processedWeeks.length > 0) {
          setTodasSemanas(processedWeeks);
        } else if (fallbackWeeks && fallbackWeeks.length > 0) {
          setTodasSemanas(fallbackWeeks);
        }
      } catch (err) {
        if (IS_DEV) safeLog.error('Erro ao buscar semanas:', err);
        if (fallbackWeeks && fallbackWeeks.length > 0) {
          setTodasSemanas(fallbackWeeks);
        }
      }
    }

    if (!anoSelecionado) {
      void fetchFallback();
    }
  }, [fallbackWeeks, anoSelecionado, semanasComDados, loadingSemanasComDados]);

  return todasSemanas;
}
