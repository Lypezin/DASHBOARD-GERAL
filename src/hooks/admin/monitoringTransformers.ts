import { ActivityLog, UserProfile, MonitoringStats } from './types';

export function processActiveUsers(logs: any[], profileMap: Map<string, any>): any[] {
    const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000).getTime();
    const latestActivity = new Map<string, any>();
    logs.forEach(log => {
        const existing = latestActivity.get(log.user_id);
        if (!existing || new Date(log.entered_at) > new Date(existing.entered_at)) {
            latestActivity.set(log.user_id, log);
        }
    });

    return Array.from(latestActivity.values())
        .filter(log => {
            const lastSeenTime = log.last_seen ? new Date(log.last_seen).getTime() : new Date(log.entered_at).getTime();
            return lastSeenTime > twoMinsAgo && !log.exited_at;
        })
        .map(log => ({
            userId: log.user_id,
            profile: profileMap.get(log.user_id) || null,
            currentPath: log.path,
            lastSeen: log.last_seen || log.entered_at
        }));
}

export function processTopPages(logs: any[]): any[] {
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

    return Array.from(pageMap.entries()).map(([path, data]) => ({
        path,
        visits: data.visits,
        avgDuration: data.countWithDuration > 0 ? Math.round(data.totalDuration / data.countWithDuration) : 0
    })).sort((a, b) => b.visits - a.visits);
}

export function processUserTime(logs: any[], profileMap: Map<string, any>): any[] {
    const userTimeMap = new Map<string, { totalTime: number; visits: number }>();
    logs.forEach(log => {
        const current = userTimeMap.get(log.user_id) || { totalTime: 0, visits: 0 };
        current.visits++;
        if (log.duration_seconds) {
            current.totalTime += log.duration_seconds;
        }
        userTimeMap.set(log.user_id, current);
    });

    return Array.from(userTimeMap.entries()).map(([userId, data]) => ({
        userId,
        profile: profileMap.get(userId) || null,
        totalTimeSeconds: data.totalTime,
        totalVisits: data.visits
    })).sort((a, b) => b.totalTimeSeconds - a.totalTimeSeconds);
}
