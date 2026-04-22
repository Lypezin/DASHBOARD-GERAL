import { useState, useEffect } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import type { DimensoesDashboard } from '@/types';

const CACHE_KEY = 'dashboard_dimensions_cache_v4';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hora
const DEFAULT_YEARS = [2024, 2025, 2026];

export function useDashboardDimensions() {
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [semanasDisponiveis, setSemanasDisponiveis] = useState<string[]>([]);
  const [outrasDimensoes, setOutrasDimensoes] = useState<DimensoesDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchInitialDimensions = async () => {
      setLoading(true);

      try {
        const cached = readCachedDimensions();
        if (cached) {
          setAnosDisponiveis(cached.anos);
          setSemanasDisponiveis(cached.semanas);
          setOutrasDimensoes(cached);
          setLoading(false);
          return;
        }

        // Evita scans amplos na mv_aderencia_agregada: sub_pracas/origens/turnos
        // agora sao carregados sob demanda em useDimensionOptions.
        const [anosResult, semanasResult, pracasResult] = await Promise.all([
          safeRpc<number[]>('listar_anos_disponiveis', {}, { timeout: 10000, validateParams: false }),
          safeRpc<any[]>('listar_todas_semanas', {}, { timeout: 10000, validateParams: false }),
          safeRpc<any[]>('list_pracas_disponiveis', {}, { timeout: 10000, validateParams: false })
        ]);

        if (cancelled) return;

        const anosData = Array.isArray(anosResult.data) ? anosResult.data : [];
        const mergedYears = Array.from(new Set([...DEFAULT_YEARS, ...anosData])).sort((a, b) => b - a);

        const semanasData = Array.isArray(semanasResult.data)
          ? semanasResult.data.map(s => (typeof s === 'object' && s !== null ? `${s.ano || 2025}-W${s.semana || s.numero_semana}` : String(s)))
          : [];

        const pracasData = Array.isArray(pracasResult.data)
          ? pracasResult.data.map((p: any) => p?.praca || p).filter(Boolean).map(String)
          : [];

        const dimensoesBase: DimensoesDashboard = {
          anos: mergedYears,
          semanas: semanasData,
          pracas: Array.from(new Set(pracasData)).sort(),
          sub_pracas: [],
          origens: [],
          turnos: []
        };

        setAnosDisponiveis(mergedYears);
        setSemanasDisponiveis(semanasData);
        setOutrasDimensoes(dimensoesBase);
        writeCachedDimensions(dimensoesBase);
      } catch (err) {
        safeLog.error('Erro ao buscar dimensoes iniciais:', err);
        setAnosDisponiveis([2025]);
        setOutrasDimensoes({
          anos: [2025],
          semanas: [],
          pracas: [],
          sub_pracas: [],
          origens: [],
          turnos: []
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchInitialDimensions();

    return () => {
      cancelled = true;
    };
  }, []);

  return { anosDisponiveis, semanasDisponiveis, dimensoes: outrasDimensoes, loadingDimensions: loading };
}

function readCachedDimensions(): DimensoesDashboard | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { timestamp, data } = JSON.parse(cached);
    const isValid = Date.now() - timestamp < CACHE_DURATION;

    if (isValid && data?.anos?.length > 0 && Array.isArray(data.pracas)) {
      return data as DimensoesDashboard;
    }
  } catch {
    sessionStorage.removeItem(CACHE_KEY);
  }

  return null;
}

function writeCachedDimensions(data: DimensoesDashboard) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
  } catch {
    // Cache em sessionStorage e uma otimização opcional; falhas nao devem afetar o dashboard.
  }
}
