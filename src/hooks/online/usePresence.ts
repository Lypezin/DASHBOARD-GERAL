import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { OnlineUser } from './types';
import { CurrentUser } from '@/types';

export function usePresence(
    userId: string | null,
    currentUser: CurrentUser | null,
    currentTab: string,
    isIdle: boolean
) {
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [joinedUsers, setJoinedUsers] = useState<OnlineUser[]>([]);
    const [customStatus, setCustomStatus] = useState<string>('');
    const channelRef = useRef<RealtimeChannel | null>(null);
    const sessionStartRef = useRef(new Date().toISOString());

    const clearJoinedUsers = () => setJoinedUsers([]);

    const getPresenceData = async (user: any) => {
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
            online_at: sessionStartRef.current,
            current_tab: currentTab,
            device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            is_idle: isIdle,
            custom_status: customStatus
        } as OnlineUser;
    };

    // Subscribing to Presence
    useEffect(() => {
        if (!currentUser || !userId) return;
        if (channelRef.current) supabase.removeChannel(channelRef.current);

        const channel = supabase.channel('online-users-presence', {
            config: { presence: { key: userId } }
        });
        channelRef.current = channel;

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState<OnlineUser>();
                const users: OnlineUser[] = [];
                for (const key in newState) {
                    const presences = newState[key];
                    if (presences && presences.length > 0) users.push(presences[0]);
                }
                users.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

                setOnlineUsers(prev => {
                    if (prev.length > 0) {
                        const prevIds = new Set(prev.map(u => u.id));
                        const newJoiners = users.filter(u => !prevIds.has(u.id) && u.id !== userId);
                        if (newJoiners.length > 0) setJoinedUsers(last => [...last, ...newJoiners]);
                    }
                    return users;
                });
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    const { data: { user } } = await supabase.auth.getUser();
                    const p = await getPresenceData(user);
                    if (p) await channel.track(p);
                }
            });

        return () => {
            if (channelRef.current) supabase.removeChannel(channelRef.current);
        };
    }, [userId, currentUser?.organization_id]);

    // Track updates
    useEffect(() => {
        if (!channelRef.current || !userId) return;
        const update = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const p = await getPresenceData(user);
            if (channelRef.current && p) await channelRef.current.track(p);
        };
        update();
    }, [currentTab, isIdle, customStatus]);

    const setTypingTo = async (targetUserId: string | null) => {
        if (!channelRef.current || !userId) return;
        const { data: { user } } = await supabase.auth.getUser();
        const p = await getPresenceData(user);
        if (p) {
            await channelRef.current.track({
                ...p,
                typing_to: targetUserId,
                last_typed: targetUserId ? new Date().toISOString() : undefined
            });
        }
    };

    return {
        onlineUsers,
        joinedUsers,
        clearJoinedUsers,
        customStatus,
        setCustomStatus,
        setTypingTo
    };
}
