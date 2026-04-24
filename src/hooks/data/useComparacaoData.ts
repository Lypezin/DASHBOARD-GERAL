import { useEffect, useState } from 'react';
import { DashboardResumoData, UtrData, CurrentUser } from '@/types';
import { getSafeErrorMessage, safeLog } from '@/lib/errorHandler';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAllWeeks } from '@/hooks/comparacao/useAllWeeks';
import { fetchComparisonMetrics } from '@/hooks/comparacao/useComparisonMetrics';
import { fetchComparisonUtr } from '@/hooks/comparacao/useComparisonUtr';

interface UseComparacaoDataOptions {
  semanas: string[];
  semanasSelecionadas: string[];
  pracaSelecionada: string | null;
  currentUser: CurrentUser | null;
  anoSelecionado?: number;
}

export function useComparacaoData(options: UseComparacaoDataOptions) {
  const { semanasSelecionadas, pracaSelecionada, currentUser, semanas, anoSelecionado } = options;
  const { organizationId, isLoading: isOrgLoading } = useOrganization();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dadosComparacao, setDadosComparacao] = useState<DashboardResumoData[]>([]);
  const [utrComparacao, setUtrComparacao] = useState<Array<{ semana: string | number; utr: UtrData | null }>>([]);

  const todasSemanas = useAllWeeks(semanas, anoSelecionado);

  useEffect(() => {
    if (isOrgLoading) {
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      if (!semanasSelecionadas || semanasSelecionadas.length < 2) {
        setDadosComparacao([]);
        setUtrComparacao([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      if (isMounted) {
        setDadosComparacao([]);
        setUtrComparacao([]);
      }

      try {
        const [dados, utrs] = await Promise.all([
          fetchComparisonMetrics(semanasSelecionadas, pracaSelecionada, currentUser, organizationId, anoSelecionado),
          fetchComparisonUtr(semanasSelecionadas, pracaSelecionada, currentUser, organizationId, anoSelecionado),
        ]);

        if (!isMounted) return;

        setDadosComparacao(dados);
        setUtrComparacao(utrs);
      } catch (error: unknown) {
        safeLog.error('[Comparacao] Erro ao buscar dados:', error);
        if (isMounted) {
          setError(getSafeErrorMessage(error) || 'Erro ao comparar semanas. Tente novamente.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      isMounted = false;
    };
  }, [semanasSelecionadas, pracaSelecionada, currentUser, organizationId, isOrgLoading, anoSelecionado]);

  return { loading: loading || isOrgLoading, error, dadosComparacao, utrComparacao, todasSemanas };
}
