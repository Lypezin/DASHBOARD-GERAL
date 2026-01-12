import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useDashboardDimensions() {
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [semanasDisponiveis, setSemanasDisponiveis] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialDimensions = async () => {
      setLoading(true);

      // Cache Key
      const CACHE_KEY = 'dashboard_dimensions_cache';
      const CACHE_DURATION = 1000 * 60 * 60; // 1 hora

      try {
        // 1. Tentar ler do cache
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { timestamp, data } = JSON.parse(cached);
          const isValid = Date.now() - timestamp < CACHE_DURATION;

          if (isValid && data.anos?.length > 0 && data.semanas?.length > 0) {
            setAnosDisponiveis(data.anos);
            setSemanasDisponiveis(data.semanas);
            setLoading(false);
            return; // Cache hit!
          }
        }

        // 2. Se não houver cache ou expirou, buscar da API
        const [anosResult, semanasResult] = await Promise.all([
          safeRpc<number[]>('listar_anos_disponiveis', {}, {
            timeout: 30000,
            validateParams: false
          }),
          safeRpc<any[]>('listar_todas_semanas', {}, {
            timeout: 30000,
            validateParams: false
          })
        ]);

        if (anosResult.error) throw anosResult.error;
        const anosData = anosResult.data || [];
        // Ensure 2024, 2025, 2026 are always available
        const defaultYears = [2024, 2025, 2026];
        const mergedYears = Array.from(new Set([...defaultYears, ...anosData])).sort((a, b) => b - a);
        setAnosDisponiveis(mergedYears);

        if (semanasResult.error) throw semanasResult.error;
        const semanasData = Array.isArray(semanasResult.data)
          ? semanasResult.data.map(s => {
            if (typeof s === 'object' && s !== null && 'ano' in s && 'semana' in s) {
              // Include year info: "2026-W1"
              return `${s.ano}-W${s.semana}`;
            } else if (typeof s === 'object' && s !== null && 'semana' in s) {
              return String(s.semana);
            }
            return String(s);
          })
          : [];
        setSemanasDisponiveis(semanasData);

        // 3. Salvar no Cache
        if (anosData.length > 0 && semanasData.length > 0) {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            data: {
              anos: anosData,
              semanas: semanasData
            }
          }));
        }

      } catch (err) {
        safeLog.error('Erro ao buscar dimensões iniciais:', err);
        // Fallback para 2025 (ano com dados conhecidos)
        setAnosDisponiveis([2025]);
        setSemanasDisponiveis([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialDimensions();
  }, []);

  return { anosDisponiveis, semanasDisponiveis, loadingDimensions: loading };
}
