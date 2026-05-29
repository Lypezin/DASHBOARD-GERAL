export interface Badge {
    slug: string;
    name: string;
    description: string;
    icon: string;
    unlocked_at?: string;
    category?: string;
}

export interface LeaderboardEntry {
    rank: number;
    user_name: string;
    avatar_url?: string;
    pracas?: string;
    total_badges: number;
    badges_list: { name: string; icon: string; slug: string; category?: string; description?: string }[];
    current_streak: number;
}
