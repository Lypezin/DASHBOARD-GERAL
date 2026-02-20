import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { MonitoringStats, UserProfile } from './types';
import { processActiveUsers, processTopPages, processUserTime } from './monitoringTransformers';

export type { MonitoringStats };

export function useMonitoringData() {
    const [stats, setStats] = useState<MonitoringStats>({ activeUsers: [], topPages: [], userTime: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: logs, error: logsError } = await supabase
                .from('user_activity_logs')
                .select('*')
                .gte('entered_at', yesterday)
                .order('entered_at', { ascending: false });

            if (logsError) throw logsError;
            if (!logs) return;

            const userIds = Array.from(new Set(logs.map(l => l.user_id)));
            const { data: profiles, error: profilesError } = await supabase
                .from('user_profiles')
                .select('id, full_name, avatar_url, email')
                .in('id', userIds);

            if (profilesError) safeLog.warn('Error fetching profiles:', profilesError);

            const profileMap = new Map<string, UserProfile>();
            profiles?.forEach(p => profileMap.set(p.id, p));

            setStats({
                activeUsers: processActiveUsers(logs, profileMap),
                topPages: processTopPages(logs),
                userTime: processUserTime(logs, profileMap)
            });

        } catch (err: any) {
            safeLog.error('Monitoring fetch error:', err);
            if (err.message?.includes('relation "user_activity_logs" does not exist')) {
                setError("Tabela de logs não encontrada. Por favor execute o script SQL.");
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    return { stats, loading, error, refresh: fetchData };
}
