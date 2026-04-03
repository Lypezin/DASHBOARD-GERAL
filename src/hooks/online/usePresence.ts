import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { OnlineUser } from './types';
import { CurrentUser } from '@/types';
import { getPresenceData } from './presenceData';

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
    const presenceBaseRef = useRef<OnlineUser | null>(null);

    const clearJoinedUsers = () => setJoinedUsers([]);

    const buildPresencePayload = useCallback(async () => {
        if (!userId || !currentUser) return null;

        if (!presenceBaseRef.current) {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;
            const basePresence = await getPresenceData(user, currentUser, currentTab, isIdle, customStatus, sessionStartRef.current);
            if (!basePresence) return null;
            presenceBaseRef.current = basePresence;
        }

        return {
            ...presenceBaseRef.current,
            current_tab: currentTab,
            is_idle: isIdle,
            custom_status: customStatus
        } as OnlineUser;
    }, [currentTab, currentUser, customStatus, isIdle, userId]);

    // Subscribing to Presence
    useEffect(() => {
        if (!currentUser || !userId) return;
        presenceBaseRef.current = null;
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
                    const p = await buildPresencePayload();
                    if (p) await channel.track(p);
                }
            });

        return () => {
            if (channelRef.current) supabase.removeChannel(channelRef.current);
        };
    }, [buildPresencePayload, currentUser, userId]);

    // Track updates
    useEffect(() => {
        if (!channelRef.current || !userId) return;
        const update = async () => {
            const p = await buildPresencePayload();
            if (channelRef.current && p) await channelRef.current.track(p);
        };
        update();
    }, [buildPresencePayload, currentTab, customStatus, isIdle, userId]);

    const setTypingTo = async (targetUserId: string | null) => {
        if (!channelRef.current || !userId) return;
        const p = await buildPresencePayload();
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
