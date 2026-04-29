import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { OnlineUser } from './types';
import { CurrentUser } from '@/types';
import { getPresenceData } from './presenceData';
import { useAppBootstrap } from '@/contexts/AppBootstrapContext';
import { normalizePresenceUsers, isSameOnlineUsers } from './presenceHelpers';

const JOIN_NOTIFICATION_COOLDOWN_MS = 15000;

export function usePresence(
    userId: string | null,
    currentUser: CurrentUser | null,
    currentTab: string,
    isIdle: boolean,
    enabled: boolean
) {
    const { authUser, avatarUrl } = useAppBootstrap();
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [joinedUsers, setJoinedUsers] = useState<OnlineUser[]>([]);
    const [customStatus, setCustomStatus] = useState<string>('');
    const channelRef = useRef<RealtimeChannel | null>(null);
    const sessionStartRef = useRef(new Date().toISOString());
    const presenceBaseRef = useRef<OnlineUser | null>(null);
    const recentJoinNotificationsRef = useRef<Map<string, number>>(new Map());
    const authUserRef = useRef(authUser);
    const currentUserRef = useRef(currentUser);
    const currentTabRef = useRef(currentTab);
    const isIdleRef = useRef(isIdle);
    const customStatusRef = useRef(customStatus);
    const avatarUrlRef = useRef(avatarUrl);

    const clearJoinedUsers = useCallback(() => setJoinedUsers([]), []);

    useEffect(() => {
        authUserRef.current = authUser;
        currentUserRef.current = currentUser;
        currentTabRef.current = currentTab;
        isIdleRef.current = isIdle;
        customStatusRef.current = customStatus;
        avatarUrlRef.current = avatarUrl;
    }, [authUser, avatarUrl, currentTab, currentUser, customStatus, isIdle]);

    useEffect(() => {
        presenceBaseRef.current = null;
    }, [authUser?.id, avatarUrl, currentUser?.id, userId]);

    const buildPresencePayload = useCallback(async () => {
        const resolvedAuthUser = authUserRef.current;
        const resolvedCurrentUser = currentUserRef.current;

        if (!enabled || !userId || !resolvedCurrentUser || !resolvedAuthUser) return null;

        if (!presenceBaseRef.current) {
            const basePresence = await getPresenceData(
                resolvedAuthUser,
                resolvedCurrentUser,
                currentTabRef.current,
                isIdleRef.current,
                customStatusRef.current,
                sessionStartRef.current,
                avatarUrlRef.current
            );

            if (!basePresence) return null;
            presenceBaseRef.current = basePresence;
        }

        return {
            ...presenceBaseRef.current,
            current_tab: currentTabRef.current,
            is_idle: isIdleRef.current,
            custom_status: customStatusRef.current
        } as OnlineUser;
    }, [enabled, userId]);

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

        if (!userId) return;

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
                const users = normalizePresenceUsers(newState);

                setOnlineUsers((prev) => {
                    if (isSameOnlineUsers(prev, users)) {
                        return prev;
                    }

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
    }, [buildPresencePayload, enabled, userId]);

    useEffect(() => {
        if (!enabled || !channelRef.current || !userId) return;

        const updatePresence = async () => {
            const payload = await buildPresencePayload();
            if (channelRef.current && payload) {
                await channelRef.current.track(payload);
            }
        };

        void updatePresence();
    }, [avatarUrl, buildPresencePayload, currentTab, currentUser?.id, customStatus, enabled, isIdle, userId]);

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
