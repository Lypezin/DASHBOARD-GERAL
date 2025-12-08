import { useState } from 'react';
import { DashboardResumoData, UtrData, CurrentUser } from '@/types';
import { getSafeErrorMessage } from '@/lib/errorHandler';
import { useAllWeeks } from './comparacao/useAllWeeks';
import { fetchComparisonMetrics } from './comparacao/useComparisonMetrics';
import { fetchComparisonUtr } from './comparacao/useComparisonUtr';

interface UseComparacaoDataOptions {
  semanas: string[];
  semanasSelecionadas: string[];
  pracaSelecionada: string | null;
  currentUser: CurrentUser | null;
}

export function useComparacaoData(options: UseComparacaoDataOptions) {
  const { semanasSelecionadas, pracaSelecionada, currentUser, semanas } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dadosComparacao, setDadosComparacao] = useState<DashboardResumoData[]>([]);
  const [utrComparacao, setUtrComparacao] = useState<Array<{ semana: string | number; utr: UtrData | null }>>([]);

  // Use extracted hook for all weeks
  const todasSemanas = useAllWeeks(semanas);

  const compararSemanas = async () => {
    if (semanasSelecionadas.length < 2) return;

    setLoading(true);
    setError(null);
    try {
      const [dados, utrs] = await Promise.all([
        fetchComparisonMetrics(semanasSelecionadas, pracaSelecionada, currentUser),
        fetchComparisonUtr(semanasSelecionadas, pracaSelecionada, currentUser)
      ]);

      setDadosComparacao(dados);
      setUtrComparacao(utrs);
    } catch (error) {
      setError(getSafeErrorMessage(error) || 'Erro ao comparar semanas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    dadosComparacao,
    utrComparacao,
    todasSemanas,
    compararSemanas,
  };
}
