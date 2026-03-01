import { useState, useEffect, useMemo, useRef } from 'react';

import { safeLog } from '@/lib/errorHandler';
import { fetchDashboardEvolucaoData } from './utils/fetchEvolucao';
import { DELAYS } from '@/constants/config';
import type { FilterPayload } from '@/types/filters';
import { useOrganization } from '@/contexts/OrganizationContext';

interface UseDashboardEvolucaoOptions {
  filterPayload: FilterPayload;
  anoEvolucao: number;
  activeTab: string;
}

export function useDashboardEvolucao({ filterPayload, anoEvolucao, activeTab }: UseDashboardEvolucaoOptions) {
  const [evolucaoMensal, setEvolucaoMensal] = useState<any>(null);
  const [evolucaoSemanal, setEvolucaoSemanal] = useState<any>(null);
  const [utrSemanal, setUtrSemanal] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { isLoading: isOrgLoading } = useOrganization();
  const lastFetchSignature = useRef<string | null>(null);

  useEffect(() => {
    if (isOrgLoading) return;

    // Só buscar se a tab ativa precisar desses dados
    const needsEvolucao = activeTab === 'evolucao' || activeTab === 'dashboard' || activeTab === 'utr' || activeTab === 'resumo';

    if (!needsEvolucao) return;

    // Se ano não definido, não buscar
    if (!anoEvolucao) return;

    const currentSignature = JSON.stringify({ filterPayload, anoEvolucao });

    // Evita refetch desnecessário se mudou só a tab ativa iterando local
    if (lastFetchSignature.current === currentSignature && evolucaoMensal && evolucaoSemanal) {
      return;
    }

    let mounted = true;

    const fetchEvolucao = async () => {
      try {
        setLoading(true);
        setError(null);

        const { mensalData, semanalData, utrData } = await fetchDashboardEvolucaoData(filterPayload, anoEvolucao, activeTab);

        if (!mounted) return;

        setEvolucaoMensal(mensalData);
        setEvolucaoSemanal(semanalData);
        setUtrSemanal(utrData);

        lastFetchSignature.current = currentSignature;

      } catch (err: unknown) {
        if (mounted) {
          safeLog.error('[useDashboardEvolucao] Erro ao buscar evolução:', err);
          setError(err instanceof Error ? err : new Error('Erro desconhecido'));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchEvolucao, DELAYS.DEBOUNCE);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [
    activeTab,
    anoEvolucao,
    isOrgLoading,
    // Dependências de filtro (usar JSON.stringify se payload mudar referência)
    JSON.stringify(filterPayload)
  ]);

  return {
    evolucaoMensal,
    evolucaoSemanal,
    utrSemanal,
    loading,
    error
  };
}
