export interface ActivityLog {
    id: string;
    user_id: string;
    path: string;
    entered_at: string;
    exited_at: string | null;
    duration_seconds: number | null;
    last_seen?: string;
}

export interface UserProfile {
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
