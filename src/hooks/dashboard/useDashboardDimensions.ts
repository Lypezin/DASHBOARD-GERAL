import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import type { DimensoesDashboard } from '@/types';
import { useOrganization } from '@/contexts/OrganizationContext';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useDashboardDimensions() {
  const { organizationId, isLoading: isOrgLoading } = useOrganization();
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [semanasDisponiveis, setSemanasDisponiveis] = useState<string[]>([]);
  const [outrasDimensoes, setOutrasDimensoes] = useState<DimensoesDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOrgLoading) return;

    const fetchInitialDimensions = async () => {
      setLoading(true);

      // Cache Key
      const CACHE_KEY = `dashboard_dimensions_cache_v3_${organizationId || 'global'}`;
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
        const scopedDimensionQuery = (column: 'praca' | 'sub_praca' | 'origem' | 'turno') => {
          let query = supabase
            .from('mv_aderencia_agregada')
            .select(column, { count: 'exact', head: false })
            .neq(column, null);

          if (organizationId) {
            query = query.eq('organization_id', organizationId);
          }

          return query;
        };

        const [anosResult, semanasResult, pracasResult, subPracasResult, origensResult, turnosResult] = await Promise.all([
          safeRpc<number[]>('listar_anos_disponiveis', {}, { timeout: 10000, validateParams: false }),
          safeRpc<any[]>('listar_todas_semanas', {}, { timeout: 10000, validateParams: false }),
          scopedDimensionQuery('praca'),
          scopedDimensionQuery('sub_praca'),
          scopedDimensionQuery('origem'),
          scopedDimensionQuery('turno')
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

        // Processar Outras Dimensões
        const pracasData = (pracasResult.data || []) as Array<{ praca: string | null }>;
        const subPracasData = (subPracasResult.data || []) as Array<{ sub_praca: string | null }>;
        const origensData = (origensResult.data || []) as Array<{ origem: string | null }>;
        const turnosData = (turnosResult.data || []) as Array<{ turno: string | null }>;

        const dimensoesBase: DimensoesDashboard = {
          anos: mergedYears,
          semanas: semanasData,
          pracas: Array.from(new Set(pracasData.map(d => d.praca).filter(Boolean))) as string[],
          sub_pracas: Array.from(new Set(subPracasData.map(d => d.sub_praca).filter(Boolean))) as string[],
          origens: Array.from(new Set(origensData.map(d => d.origem).filter(Boolean))) as string[],
          turnos: Array.from(new Set(turnosData.map(d => d.turno).filter(Boolean))) as string[]
        };
        
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
  }, [isOrgLoading, organizationId]);

  return { anosDisponiveis, semanasDisponiveis, dimensoes: outrasDimensoes, loadingDimensions: loading };
}
