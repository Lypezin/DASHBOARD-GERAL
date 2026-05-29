import type { User } from '@supabase/supabase-js';
import { OnlineUser } from './types';
import { CurrentUser } from '@/types';

export async function getPresenceData(
    user: User | null,
    currentUser: CurrentUser | null,
    currentTab: string,
    isIdle: boolean,
    customStatus: string,
    sessionStart: string,
    avatarUrl?: string | null
): Promise<OnlineUser | null> {
    if (!user) return null;

    const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario';

    return {
        id: user.id,
        email: user.email ?? null,
        name,
        avatar_url: avatarUrl || user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        role: currentUser?.role,
        online_at: sessionStart,
        current_tab: currentTab,
        device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        is_idle: isIdle,
        custom_status: customStatus
    } as OnlineUser;
}
