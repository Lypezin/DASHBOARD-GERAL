import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';

interface CityUpdateInfo {
  city: string;
  last_update_date: string;
}

// Global cache variables para evitar chamadas redundantes ao trocar abas/remontar
let globalCache: CityUpdateInfo[] | null = null;
let globalPromise: Promise<CityUpdateInfo[] | null> | null = null;
let globalCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export function useCityLastUpdates() {
  const [data, setData] = useState<CityUpdateInfo[]>(globalCache || []);
  const [loading, setLoading] = useState(!globalCache);

  useEffect(() => {
    let mounted = true;

    async function fetchUpdates() {
      // Retorna dado do cache se estiver válido
      if (globalCache && Date.now() - globalCacheTime < CACHE_TTL) {
        if (mounted) {
          setData(globalCache);
          setLoading(false);
        }
        return;
      }

      // Se não tem promessa em andamento, inicia a requisição
      if (!globalPromise) {
        globalPromise = (async () => {
          try {
            const { data, error } = await supabase.rpc('get_city_last_updates');
            if (error) {
              safeLog.error('Error fetching city updates:', error);
              globalPromise = null;
              return null;
            }
            if (data) {
              globalCache = data as CityUpdateInfo[];
              globalCacheTime = Date.now();
            }
            globalPromise = null;
            return globalCache;
          } catch (err: any) {
            safeLog.error('Unexpected error fetching updates:', err);
            globalPromise = null;
            return null;
          }
        })();
      }

      if (mounted) setLoading(true);
      const result = await globalPromise;

      if (mounted) {
        if (result) setData(result);
        setLoading(false);
      }
    }

    fetchUpdates();

    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading };
}
