import { useState, useEffect } from 'react';
import { DashboardResumoData, UtrData, CurrentUser } from '@/types';
import { getSafeErrorMessage, safeLog } from '@/lib/errorHandler';
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
  const todasSemanas = useAllWeeks(semanas, anoSelecionado);

  // Removido compararSemanas pois a lógica agora é reativa via useEffect

  useEffect(() => {
    // Se a organização ainda está carregando, não inicia busca
    if (isOrgLoading) {
      console.log('[Comparacao] Aguardando organização carregar...');
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      safeLog.info('[Comparacao] fetchData iniciado', {
        semanasSelecionadas,
        pracaSelecionada,
        anoSelecionado,
        organizationId,
        currentUserRole: currentUser?.role,
        currentUserPracas: currentUser?.assigned_pracas
      });

      // Só busca se tiver pelo menos 2 semanas selecionadas (regra original)
      if (!semanasSelecionadas || semanasSelecionadas.length < 2) {
        safeLog.info('[Comparacao] Menos de 2 semanas selecionadas, retornando vazio');
        setDadosComparacao([]);
        setUtrComparacao([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        safeLog.info('[Comparacao] Chamando fetchComparisonMetrics e fetchComparisonUtr...');
        const [dados, utrs] = await Promise.all([
          fetchComparisonMetrics(semanasSelecionadas, pracaSelecionada, currentUser, organizationId, anoSelecionado),
          fetchComparisonUtr(semanasSelecionadas, pracaSelecionada, currentUser, organizationId, anoSelecionado)
        ]);

        safeLog.info('[Comparacao] Dados recebidos:', {
          dadosLength: dados?.length,
          dadosPreview: dados?.map(d => ({
            total_ofertadas: d?.total_ofertadas,
            total_aceitas: d?.total_aceitas,
            aderencia_semanal: d?.aderencia_semanal?.length,
            aderencia_dia: d?.aderencia_dia?.length
          })),
          utrsLength: utrs?.length
        });

        if (isMounted) {
          setDadosComparacao(dados);
          setUtrComparacao(utrs);
        }
      } catch (error: any) {
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

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [semanasSelecionadas, pracaSelecionada, currentUser, organizationId, isOrgLoading, anoSelecionado]);



  return {
    loading: loading || isOrgLoading,
    error,
    dadosComparacao,
    utrComparacao,
    todasSemanas,
  };
}
