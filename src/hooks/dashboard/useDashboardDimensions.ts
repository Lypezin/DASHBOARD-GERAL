import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import type { DimensoesDashboard } from '@/types';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useDashboardDimensions() {
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [semanasDisponiveis, setSemanasDisponiveis] = useState<string[]>([]);
  const [outrasDimensoes, setOutrasDimensoes] = useState<DimensoesDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialDimensions = async () => {
      setLoading(true);

      // Cache Key
      const CACHE_KEY = 'dashboard_dimensions_cache_v2';
      const CACHE_DURATION = 1000 * 60 * 60; // 1 hora

      try {
        // 1. Tentar ler do cache
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { timestamp, data } = JSON.parse(cached);
          const isValid = Date.now() - timestamp < CACHE_DURATION;

          if (isValid && data.anos?.length > 0 && data.dimensoes) {
            setAnosDisponiveis(data.anos);
            setSemanasDisponiveis(data.semanas || []);
            setOutrasDimensoes(data.dimensoes);
            setLoading(false);
            return;
          }
        }

        // 2. Se não houver cache ou expirou, buscar da API em paralelo
        const [anosResult, semanasResult, dimensoesResult] = await Promise.all([
          safeRpc<number[]>('listar_anos_disponiveis', {}, { timeout: 10000, validateParams: false }),
          safeRpc<any[]>('listar_todas_semanas', {}, { timeout: 10000, validateParams: false }),
          // Buscar dimensões estruturais (Pracas, Sub-Pracas, etc)
          // Usamos dashboard_resumo mas com uma semana fake ou mínima para obter apenas as dimensões se possível
          // Ou buscamos direto da view se o RPC for pesado. Para garantir velocidade, vamos simular o objeto DimensoesDashboard
          supabase.from('mv_aderencia_agregada').select('praca, sub_praca, origem, turno').limit(1000)
        ]);

        // Processar Anos
        const anosData = anosResult.data || [2024, 2025, 2026];
        const mergedYears = Array.from(new Set([...[2024, 2025, 2026], ...anosData])).sort((a, b) => b - a);
        setAnosDisponiveis(mergedYears);

        // Processar Semanas
        const semanasData = Array.isArray(semanasResult.data)
          ? semanasResult.data.map(s => (typeof s === 'object' && s !== null ? `${s.ano || 2025}-W${s.semana || s.numero_semana}` : String(s)))
          : [];
        setSemanasDisponiveis(semanasData);

        // Processar Outras Dimensões (Pracas, Subs, etc)
        let dimensoesBase: DimensoesDashboard = {
          anos: mergedYears,
          semanas: semanasData,
          pracas: [],
          sub_pracas: [],
          origens: [],
          turnos: []
        };

        if (dimensoesResult.data) {
          dimensoesBase = {
            ...dimensoesBase,
            pracas: Array.from(new Set(dimensoesResult.data.map(d => d.praca).filter(Boolean))),
            sub_pracas: Array.from(new Set(dimensoesResult.data.map(d => d.sub_praca).filter(Boolean))),
            origens: Array.from(new Set(dimensoesResult.data.map(d => d.origem).filter(Boolean))),
            turnos: Array.from(new Set(dimensoesResult.data.map(d => d.turno).filter(Boolean)))
          };
        }
        setOutrasDimensoes(dimensoesBase);

        // 3. Salvar no Cache
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          timestamp: Date.now(),
          data: {
            anos: mergedYears,
            semanas: semanasData,
            dimensoes: dimensoesBase
          }
        }));

      } catch (err) {
        safeLog.error('Erro ao buscar dimensões iniciais:', err);
        setAnosDisponiveis([2025]);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialDimensions();
  }, []);

  return { anosDisponiveis, semanasDisponiveis, dimensoes: outrasDimensoes, loadingDimensions: loading };
}
