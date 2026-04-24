import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { OnlineUser } from './types';
import { CurrentUser } from '@/types';
import { getPresenceData } from './presenceData';
import { useAppBootstrap } from '@/contexts/AppBootstrapContext';

const JOIN_NOTIFICATION_COOLDOWN_MS = 15000;

export function usePresence(
    userId: string | null,
    currentUser: CurrentUser | null,
    currentTab: string,
    isIdle: boolean,
    enabled: boolean
) {
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [joinedUsers, setJoinedUsers] = useState<OnlineUser[]>([]);
    const [customStatus, setCustomStatus] = useState<string>('');
    const channelRef = useRef<RealtimeChannel | null>(null);
    const sessionStartRef = useRef(new Date().toISOString());
    const presenceBaseRef = useRef<OnlineUser | null>(null);
    const recentJoinNotificationsRef = useRef<Map<string, number>>(new Map());
    const { authUser, avatarUrl } = useAppBootstrap();

    const clearJoinedUsers = useCallback(() => setJoinedUsers([]), []);

    const buildPresencePayload = useCallback(async () => {
        if (!enabled || !userId || !currentUser || !authUser) return null;

        if (!presenceBaseRef.current) {
            const basePresence = await getPresenceData(
                authUser,
                currentUser,
                currentTab,
                isIdle,
                customStatus,
                sessionStartRef.current,
                avatarUrl
            );

            if (!basePresence) return null;
            presenceBaseRef.current = basePresence;
        }

        return {
            ...presenceBaseRef.current,
            current_tab: currentTab,
            is_idle: isIdle,
            custom_status: customStatus
        } as OnlineUser;
    }, [authUser, avatarUrl, currentTab, currentUser, customStatus, enabled, isIdle, userId]);

    useEffect(() => {
        if (!enabled) {
            setOnlineUsers([]);
            setJoinedUsers([]);
            presenceBaseRef.current = null;
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
            return;
        }

        if (!currentUser || !userId) return;

        presenceBaseRef.current = null;
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }

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

                setOnlineUsers((prev) => {
                    if (prev.length > 0) {
                        const prevIds = new Set(prev.map((user) => user.id));
                        const now = Date.now();
                        const newJoiners = users.filter((user) => {
                            if (user.id === userId || prevIds.has(user.id)) return false;

                            const lastNotifiedAt = recentJoinNotificationsRef.current.get(user.id) ?? 0;
                            if (now - lastNotifiedAt < JOIN_NOTIFICATION_COOLDOWN_MS) return false;

                            recentJoinNotificationsRef.current.set(user.id, now);
                            return true;
                        });

                        if (newJoiners.length > 0) {
                            setJoinedUsers((last) => [...last, ...newJoiners]);
                        }
                    }

                    return users;
                });
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    const payload = await buildPresencePayload();
                    if (payload) {
                        await channel.track(payload);
                    }
                }
            });

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [buildPresencePayload, currentUser, enabled, userId]);

    useEffect(() => {
        if (!enabled || !channelRef.current || !userId) return;

        const updatePresence = async () => {
            const payload = await buildPresencePayload();
            if (channelRef.current && payload) {
                await channelRef.current.track(payload);
            }
        };

        void updatePresence();
    }, [buildPresencePayload, currentTab, customStatus, enabled, isIdle, userId]);

    const setTypingTo = async (targetUserId: string | null) => {
        if (!enabled || !channelRef.current || !userId) return;

        const payload = await buildPresencePayload();
        if (payload) {
            await channelRef.current.track({
                ...payload,
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
