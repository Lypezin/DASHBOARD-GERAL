import { ActivityLog, UserProfile } from './types';

const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

function getActivityTimestamp(log: ActivityLog) {
    return new Date(log.last_seen || log.entered_at).getTime();
}

function getResolvedDurationSeconds(log: ActivityLog) {
    if (typeof log.duration_seconds === 'number' && log.duration_seconds > 0) {
        return log.duration_seconds;
    }

    const enteredAt = new Date(log.entered_at).getTime();
    const finishedAt = log.exited_at
        ? new Date(log.exited_at).getTime()
        : getActivityTimestamp(log);

    if (Number.isNaN(enteredAt) || Number.isNaN(finishedAt) || finishedAt <= enteredAt) {
        return 0;
    }

    return Math.round((finishedAt - enteredAt) / 1000);
}

export function processActiveUsers(logs: ActivityLog[], profileMap: Map<string, UserProfile>) {
    const activeThreshold = Date.now() - ACTIVE_WINDOW_MS;
    const latestActivity = new Map<string, ActivityLog>();

    logs.forEach(log => {
        const existing = latestActivity.get(log.user_id);
        if (!existing || getActivityTimestamp(log) > getActivityTimestamp(existing)) {
            latestActivity.set(log.user_id, log);
        }
    });

    return Array.from(latestActivity.values())
        .filter(log => getActivityTimestamp(log) >= activeThreshold && !log.exited_at)
        .map(log => ({
            userId: log.user_id,
            profile: profileMap.get(log.user_id) || null,
            currentPath: log.path,
            lastSeen: log.last_seen || log.entered_at
        }))
        .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
}

export function processTopPages(logs: ActivityLog[]) {
    const pageMap = new Map<string, { visits: number; totalDuration: number; countWithDuration: number }>();

    logs.forEach(log => {
        if (!log.path) return;

        const current = pageMap.get(log.path) || { visits: 0, totalDuration: 0, countWithDuration: 0 };
        current.visits++;

        const duration = getResolvedDurationSeconds(log);
        if (duration > 0) {
            current.totalDuration += duration;
            current.countWithDuration++;
        }

        pageMap.set(log.path, current);
    });

    return Array.from(pageMap.entries())
        .map(([path, data]) => ({
            path,
            visits: data.visits,
            avgDuration: data.countWithDuration > 0 ? Math.round(data.totalDuration / data.countWithDuration) : 0
        }))
        .sort((a, b) => b.visits - a.visits);
}

export function processUserTime(logs: ActivityLog[], profileMap: Map<string, UserProfile>) {
    const userTimeMap = new Map<string, { totalTime: number; visits: number }>();

    logs.forEach(log => {
        const current = userTimeMap.get(log.user_id) || { totalTime: 0, visits: 0 };
        current.visits++;
        current.totalTime += getResolvedDurationSeconds(log);
        userTimeMap.set(log.user_id, current);
    });

    return Array.from(userTimeMap.entries())
        .map(([userId, data]) => ({
            userId,
            profile: profileMap.get(userId) || null,
            totalTimeSeconds: data.totalTime,
            totalVisits: data.visits
        }))
        .sort((a, b) => b.totalTimeSeconds - a.totalTimeSeconds);
}
