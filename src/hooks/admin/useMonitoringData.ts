import { useCallback, useEffect, useRef, useState } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { getAppApiData } from '@/utils/app/fetchAppApi';
import { MonitoringStats } from './types';

export type { MonitoringStats };

const EMPTY_STATS: MonitoringStats = {
  activeUsers: [],
  topPages: [],
  userTime: [],
  summary: {
    totalVisits: 0,
    totalTimeSeconds: 0,
    uniqueUsers24h: 0,
    activeUsersNow: 0,
    monitoredPages: 0,
  },
};

export function useMonitoringData() {
  const [stats, setStats] = useState<MonitoringStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const requestInFlightRef = useRef(false);

  const fetchData = useCallback(async (background = false) => {
    if (requestInFlightRef.current) return;
    requestInFlightRef.current = true;

    if (background) setRefreshing(true);
    else setLoading(true);
    if (!background) setError(null);

    try {
      const result = await getAppApiData<MonitoringStats>('/api/admin/monitoring');
      if (result.error || !result.data) {
        throw new Error(result.error || 'Erro ao carregar dados de monitoramento');
      }

      setStats(result.data);
      setLastUpdated(new Date().toISOString());
    } catch (err: unknown) {
      safeLog.error('Monitoring fetch error:', err);
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('relation "user_activity_logs" does not exist')) {
        setError('Tabela de logs não encontrada. Verifique a criação de user_activity_logs no Supabase.');
      } else {
        setError(msg || 'Erro ao carregar dados de monitoramento');
      }
    } finally {
      requestInFlightRef.current = false;
      if (background) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      void fetchData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  return { stats, loading, refreshing, error, lastUpdated, refresh: () => fetchData(true) };
}
