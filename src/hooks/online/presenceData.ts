import { supabase } from '@/lib/supabaseClient';
import { OnlineUser } from './types';
import { CurrentUser } from '@/types';

export async function getPresenceData(
    user: any,
    currentUser: CurrentUser | null,
    currentTab: string,
    isIdle: boolean,
    customStatus: string,
    sessionStart: string
): Promise<OnlineUser | null> {
    if (!user) return null;

    let avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
    try {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single();
        if (profile?.avatar_url) avatarUrl = profile.avatar_url;
    } catch { }

    const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário';

    return {
        id: user.id,
        email: user.email ?? null,
        name,
        avatar_url: avatarUrl,
        role: currentUser?.role,
        online_at: sessionStart,
        current_tab: currentTab,
        device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        is_idle: isIdle,
        custom_status: customStatus
    } as OnlineUser;
}
