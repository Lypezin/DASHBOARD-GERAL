import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';

interface ActivityLog {
    id: string;
    user_id: string;
    path: string;
    entered_at: string;
    exited_at: string | null;
    duration_seconds: number | null;
    last_seen?: string;
}

interface UserProfile {
    id: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
}

export interface MonitoringStats {
    activeUsers: {
        userId: string;
        profile: UserProfile | null;
        currentPath: string;
        lastSeen: string;
    }[];
    topPages: {
        path: string;
        visits: number;
        avgDuration: number;
    }[];
    userTime: {
        userId: string;
        profile: UserProfile | null;
        totalTimeSeconds: number;
        totalVisits: number;
    }[];
}

export function useMonitoringData() {
    const [stats, setStats] = useState<MonitoringStats>({
        activeUsers: [],
        topPages: [],
        userTime: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch logs from last 24 hours for stats
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

            const { data: logs, error: logsError } = await supabase
                .from('user_activity_logs')
                .select('*')
                .gte('entered_at', yesterday)
                .order('entered_at', { ascending: false });

            if (logsError) throw logsError;
            if (!logs) return;

            // Fetch profiles
            const userIds = Array.from(new Set(logs.map(l => l.user_id)));
            const { data: profiles, error: profilesError } = await supabase
                .from('user_profiles')
                .select('id, full_name, avatar_url, email')
                .in('id', userIds);

            if (profilesError) safeLog.warn('Error fetching profiles:', profilesError);

            const profileMap = new Map<string, UserProfile>();
            profiles?.forEach(p => profileMap.set(p.id, p));

            // 1. Processing Active Users (Last 2 mins)
            const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000).getTime();

            // Map to track latest activity per user
            const latestActivity = new Map<string, ActivityLog>();
            logs.forEach(log => {
                const existing = latestActivity.get(log.user_id);
                // We want the MOST RECENT log entry
                if (!existing || new Date(log.entered_at) > new Date(existing.entered_at)) {
                    latestActivity.set(log.user_id, log);
                }
            });

            const activeUsers = Array.from(latestActivity.values())
                .filter(log => {
                    const lastSeenTime = log.last_seen
                        ? new Date(log.last_seen).getTime()
                        : new Date(log.entered_at).getTime();

                    // Active if seen in last 2 mins AND (still open OR just closed)
                    // If exited_at is set, it means they navigated away from that specific page.
                    // But if it is their LATEST log, they might still be there if the exit was the last thing they did.
                    // Ideally, if they exist on ANY page without exit, they are online.
                    // BUT, if they switch pages, old page has exit, new page has entry.
                    // So we only care if the LATEST log has NO exit key OR is very very recent.

                    return lastSeenTime > twoMinsAgo && !log.exited_at;
                })
                .map(log => ({
                    userId: log.user_id,
                    profile: profileMap.get(log.user_id) || null,
                    currentPath: log.path,
                    lastSeen: log.last_seen || log.entered_at
                }));

            // 2. Top Pages
            const pageMap = new Map<string, { visits: number; totalDuration: number; countWithDuration: number }>();

            logs.forEach(log => {
                const current = pageMap.get(log.path) || { visits: 0, totalDuration: 0, countWithDuration: 0 };
                current.visits++;
                if (log.duration_seconds) {
                    current.totalDuration += log.duration_seconds;
                    current.countWithDuration++;
                }
                pageMap.set(log.path, current);
            });

            const topPages = Array.from(pageMap.entries()).map(([path, data]) => ({
                path,
                visits: data.visits,
                avgDuration: data.countWithDuration > 0 ? Math.round(data.totalDuration / data.countWithDuration) : 0
            })).sort((a, b) => b.visits - a.visits);

            // 3. User Time
            const userTimeMap = new Map<string, { totalTime: number; visits: number }>();
            logs.forEach(log => {
                const current = userTimeMap.get(log.user_id) || { totalTime: 0, visits: 0 };
                current.visits++;
                if (log.duration_seconds) {
                    current.totalTime += log.duration_seconds;
                }
                userTimeMap.set(log.user_id, current);
            });

            const userTime = Array.from(userTimeMap.entries()).map(([userId, data]) => ({
                userId,
                profile: profileMap.get(userId) || null,
                totalTimeSeconds: data.totalTime,
                totalVisits: data.visits
            })).sort((a, b) => b.totalTimeSeconds - a.totalTimeSeconds);

            setStats({
                activeUsers,
                topPages,
                userTime
            });

        } catch (err: any) {
            safeLog.error('Monitoring fetch error:', err);
            if (err.message && err.message.includes('relation "user_activity_logs" does not exist')) {
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
