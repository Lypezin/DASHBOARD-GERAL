import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { ActivityLog, MonitoringStats, UserProfile } from './types';
import { processActiveUsers, processTopPages, processUserTime } from './monitoringTransformers';

export type { MonitoringStats };

export function useMonitoringData() {
    const [stats, setStats] = useState<MonitoringStats>({
        activeUsers: [],
        topPages: [],
        userTime: [],
        summary: {
            totalVisits: 0,
            totalTimeSeconds: 0,
            uniqueUsers24h: 0,
            activeUsersNow: 0,
            monitoredPages: 0
        }
    });
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
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: logs, error: logsError } = await supabase
                .from('user_activity_logs')
                .select('user_id, entered_at, last_seen, exited_at, path, duration_seconds')
                .gte('entered_at', yesterday)
                .order('entered_at', { ascending: false });

            if (logsError) throw logsError;

            const safeLogs = (logs || []) as ActivityLog[];
            if (safeLogs.length === 0) {
                setStats({
                    activeUsers: [],
                    topPages: [],
                    userTime: [],
                    summary: {
                        totalVisits: 0,
                        totalTimeSeconds: 0,
                        uniqueUsers24h: 0,
                        activeUsersNow: 0,
                        monitoredPages: 0
                    }
                });
                setLastUpdated(new Date().toISOString());
                return;
            }

            const userIds = Array.from(new Set(safeLogs.map(l => l.user_id).filter(Boolean)));
            const { data: profiles, error: profilesError } = userIds.length > 0
                ? await supabase
                    .from('user_profiles')
                    .select('id, full_name, avatar_url, email')
                    .in('id', userIds)
                : { data: [], error: null };

            if (profilesError) safeLog.warn('Error fetching profiles:', profilesError);

            const profileMap = new Map<string, UserProfile>();
            profiles?.forEach(p => profileMap.set(p.id, p));

            const activeUsers = processActiveUsers(safeLogs, profileMap);
            const topPages = processTopPages(safeLogs);
            const userTime = processUserTime(safeLogs, profileMap);
            const totalVisits = userTime.reduce((acc, item) => acc + item.totalVisits, 0);
            const totalTimeSeconds = userTime.reduce((acc, item) => acc + item.totalTimeSeconds, 0);

            setStats({
                activeUsers,
                topPages,
                userTime,
                summary: {
                    totalVisits,
                    totalTimeSeconds,
                    uniqueUsers24h: userIds.length,
                    activeUsersNow: activeUsers.length,
                    monitoredPages: topPages.length
                }
            });
            setLastUpdated(new Date().toISOString());

        } catch (err: unknown) {
            safeLog.error('Monitoring fetch error:', err);
            const msg = err instanceof Error ? err.message : '';
            if (msg.includes('relation "user_activity_logs" does not exist')) {
                setError("Tabela de logs não encontrada. Por favor execute o script SQL.");
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
