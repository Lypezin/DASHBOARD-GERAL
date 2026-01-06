import { useState, useEffect } from 'react';
import { DashboardResumoData, UtrData, CurrentUser } from '@/types';
import { getSafeErrorMessage } from '@/lib/errorHandler';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAllWeeks } from './comparacao/useAllWeeks';
import { fetchComparisonMetrics } from './comparacao/useComparisonMetrics';
import { fetchComparisonUtr } from './comparacao/useComparisonUtr';

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

  // Use extracted hook for all weeks
  const todasSemanas = useAllWeeks(semanas);

  // Removido compararSemanas pois a lógica agora é reativa via useEffect

  useEffect(() => {
    // Se a organização ainda está carregando, não inicia busca
    if (isOrgLoading) {
      // Opcional: manter loading true se quiser indicar que o sistema "está pensando"
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      // Só busca se tiver pelo menos 2 semanas selecionadas (regra original)
      // OU se tiver pelo menos 1? A regra original do hook tinha if (semanasSelecionadas.length < 2) return;
      // Mas o estado inicial pode ser vazio.
      if (!semanasSelecionadas || semanasSelecionadas.length < 2) {
        setDadosComparacao([]);
        setUtrComparacao([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [dados, utrs] = await Promise.all([
          fetchComparisonMetrics(semanasSelecionadas, pracaSelecionada, currentUser, organizationId, anoSelecionado),
          fetchComparisonUtr(semanasSelecionadas, pracaSelecionada, currentUser, organizationId, anoSelecionado)
        ]);

        if (isMounted) {
          setDadosComparacao(dados);
          setUtrComparacao(utrs);
        }
      } catch (error: any) {
        if (isMounted) {
          setError(getSafeErrorMessage(error) || 'Erro ao comparar semanas. Tente novamente.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [semanasSelecionadas, pracaSelecionada, currentUser, organizationId, isOrgLoading, anoSelecionado]);

  // Função vazia apenas para manter compatibilidade com interface antiga se necessário,
  // ou pode ser removida se o controller não a usar.
  // O hook original retornava `compararSemanas`.
  const compararSemanas = async () => {
    // No-op, data fetching is now reactive
    console.warn('compararSemanas is deprecated, fetching is reactive now');
  };

  return {
    loading: loading || isOrgLoading,
    error,
    dadosComparacao,
    utrComparacao,
    todasSemanas,
    compararSemanas,
  };
}
