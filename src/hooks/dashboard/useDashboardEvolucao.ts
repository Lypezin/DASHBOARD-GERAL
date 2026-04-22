import { useEffect, useMemo, useRef, useState } from 'react';

import { CACHE, DELAYS } from '@/constants/config';
import { useOrganization } from '@/contexts/OrganizationContext';
import { safeLog } from '@/lib/errorHandler';
import type { EvolucaoMensal, EvolucaoSemanal, UtrSemanal } from '@/types';
import type { FilterPayload } from '@/types/filters';
import { fetchDashboardEvolucaoData } from './utils/fetchEvolucao';

interface UseDashboardEvolucaoOptions {
  filterPayload: FilterPayload;
  anoEvolucao: number;
  activeTab: string;
}

interface EvolucaoRequestData {
  mensalData: EvolucaoMensal[];
  semanalData: EvolucaoSemanal[];
  utrData: UtrSemanal[];
}

interface EvolucaoCacheEntry extends EvolucaoRequestData {
  cachedAt: number;
}

const evolucaoCache = new Map<string, EvolucaoCacheEntry>();
const evolucaoInFlight = new Map<string, Promise<EvolucaoRequestData>>();

function pruneEvolucaoCache() {
  const now = Date.now();

  for (const [key, value] of evolucaoCache.entries()) {
    if (now - value.cachedAt > CACHE.EVOLUCAO_TTL) {
      evolucaoCache.delete(key);
    }
  }
}

function getCachedEvolucao(signature: string) {
  const cached = evolucaoCache.get(signature);

  if (!cached) return null;

  if (Date.now() - cached.cachedAt > CACHE.EVOLUCAO_TTL) {
    evolucaoCache.delete(signature);
    return null;
  }

  return cached;
}

export function useDashboardEvolucao({ filterPayload, anoEvolucao, activeTab }: UseDashboardEvolucaoOptions) {
  const [evolucaoMensal, setEvolucaoMensal] = useState<EvolucaoMensal[]>([]);
  const [evolucaoSemanal, setEvolucaoSemanal] = useState<EvolucaoSemanal[]>([]);
  const [utrSemanal, setUtrSemanal] = useState<UtrSemanal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { isLoading: isOrgLoading } = useOrganization();
  const lastFetchSignature = useRef<string | null>(null);
  const filterPayloadKey = JSON.stringify(filterPayload);
  const stableFilterPayload = useMemo(() => JSON.parse(filterPayloadKey) as FilterPayload, [filterPayloadKey]);

  useEffect(() => {
    if (isOrgLoading) return;

    const needsEvolucao = activeTab === 'evolucao' || activeTab === 'dashboard' || activeTab === 'utr' || activeTab === 'resumo';
    if (!needsEvolucao) return;
    if (!anoEvolucao) return;

    pruneEvolucaoCache();

    const currentSignature = JSON.stringify({ filterPayload: stableFilterPayload, anoEvolucao });
    const cachedData = getCachedEvolucao(currentSignature);

    if (cachedData) {
      setEvolucaoMensal(cachedData.mensalData);
      setEvolucaoSemanal(cachedData.semanalData);
      setUtrSemanal(cachedData.utrData);
      setError(null);
      setLoading(false);
      lastFetchSignature.current = currentSignature;
      return;
    }

    if (
      lastFetchSignature.current === currentSignature &&
      (evolucaoMensal.length > 0 || evolucaoSemanal.length > 0 || utrSemanal.length > 0)
    ) {
      return;
    }

    let mounted = true;

    const fetchEvolucao = async () => {
      try {
        setLoading(true);
        setError(null);

        let request = evolucaoInFlight.get(currentSignature);

        if (!request) {
          request = fetchDashboardEvolucaoData(stableFilterPayload, anoEvolucao, activeTab);
          evolucaoInFlight.set(currentSignature, request);
        }

        const result = await request;

        evolucaoCache.set(currentSignature, {
          ...result,
          cachedAt: Date.now()
        });

        if (!mounted) return;

        setEvolucaoMensal(result.mensalData);
        setEvolucaoSemanal(result.semanalData);
        setUtrSemanal(result.utrData);
        lastFetchSignature.current = currentSignature;
      } catch (err: unknown) {
        if (mounted) {
          safeLog.error('[useDashboardEvolucao] Erro ao buscar evolucao:', err);
          setError(err instanceof Error ? err : new Error('Erro desconhecido'));
        }
      } finally {
        evolucaoInFlight.delete(currentSignature);
        if (mounted) setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchEvolucao, DELAYS.DEBOUNCE);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [activeTab, anoEvolucao, filterPayloadKey, isOrgLoading, stableFilterPayload, evolucaoMensal.length, evolucaoSemanal.length, utrSemanal.length]);

  return {
    evolucaoMensal,
    evolucaoSemanal,
    utrSemanal,
    loading,
    error
  };
}
