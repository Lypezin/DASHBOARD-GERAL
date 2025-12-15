import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CurrentUser } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface OnlineUser {
    id: string;
    email: string | null;
    name: string | null;
    avatar_url: string | null;
    online_at: string;
    role?: string;
    current_tab?: string;
    // Novos campos
    device?: 'mobile' | 'desktop';
    is_idle?: boolean;
    custom_status?: string;
    last_typed?: string;
}

export interface ChatMessage {
    id: string;
    from: string; // mapped from from_user
    to: string;   // mapped from to_user
    content: string;
    timestamp: string; // mapped from created_at
}

export function useOnlineUsers(currentUser: CurrentUser | null, currentTab: string) {
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [joinedUsers, setJoinedUsers] = useState<OnlineUser[]>([]); // Queue of new users for notifications
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [isIdle, setIsIdle] = useState(false);
    const [customStatus, setCustomStatus] = useState<string>('');
    const channelRef = useRef<RealtimeChannel | null>(null);
    const chatSubscriptionRef = useRef<RealtimeChannel | null>(null);
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const sessionStartRef = useRef(new Date().toISOString());

    // 1. Fetch User ID on mount/auth change
    useEffect(() => {
        if (!currentUser) return;
        const getUserId = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);
        };
        getUserId();
    }, [currentUser]);

    // 2. Load Chat History
    useEffect(() => {
        if (!userId) return;

        const fetchHistory = async () => {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .or(`from_user.eq.${userId},to_user.eq.${userId}`)
                .order('created_at', { ascending: false })
                .limit(100);

            if (!error && data) {
                const mapped: ChatMessage[] = data.map(m => ({
                    id: m.id,
                    from: m.from_user,
                    to: m.to_user,
                    content: m.content,
                    timestamp: m.created_at
                })).reverse(); // Supabase returns desc, we want asc for display (or handle in UI)

                setMessages(mapped);
            }
        };

        fetchHistory();

        // Subscribe to new messages
        const sub = supabase.channel('chat_db_changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `to_user=eq.${userId}` // Receive messages sent to me
                },
                (payload) => {
                    const newMsg = payload.new;
                    setMessages(prev => [...prev, {
                        id: newMsg.id,
                        from: newMsg.from_user,
                        to: newMsg.to_user,
                        content: newMsg.content,
                        timestamp: newMsg.created_at
                    }]);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `from_user=eq.${userId}` // Receive messages sent by me (multitab/device sync)
                },
                (payload) => {
                    // Check if we already have it (optimistic update might have added it)
                    setMessages(prev => {
                        if (prev.some(m => m.id === payload.new.id)) return prev;
                        return [...prev, {
                            id: payload.new.id,
                            from: payload.new.from_user,
                            to: payload.new.to_user,
                            content: payload.new.content,
                            timestamp: payload.new.created_at
                        }];
                    });
                }
            )
            .subscribe();

        chatSubscriptionRef.current = sub;

        return () => {
            if (chatSubscriptionRef.current) supabase.removeChannel(chatSubscriptionRef.current);
        };
    }, [userId]);


    // 3. Idle Detection Logic
    useEffect(() => {
        const resetIdle = () => {
            setIsIdle(false);
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            // Set new timer for 5 minutes (300000 ms)
            idleTimerRef.current = setTimeout(() => {
                setIsIdle(true);
            }, 5 * 60 * 1000);
        };

        resetIdle();
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => document.addEventListener(event, resetIdle));

        return () => {
            events.forEach(event => document.removeEventListener(event, resetIdle));
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        };
    }, []);

    // Helper: Fetch full presence data (reusable)
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

        return {
            id: user.id,
            email: user.email ?? null,
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
            avatar_url: avatarUrl,
            role: currentUser?.role,
            online_at: sessionStartRef.current,
            current_tab: currentTab,
            device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            is_idle: isIdle,
            custom_status: customStatus
        } as OnlineUser;
    };

    // 4. Presence Logic (Online Users)
    useEffect(() => {
        if (!currentUser || !userId) return;

        // Cleanup previous channel if exists
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }

        const channel = supabase.channel('online-users-presence', {
            config: {
                presence: {
                    key: userId,
                },
            },
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

    // 5. Update Presence on State Change
    useEffect(() => {
        if (!channelRef.current || !userId) return;

        const update = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const p = await getPresenceData(user);

            const channel = channelRef.current;
            if (channel && p) {
                await channel.track(p);
            }
        };
        update();

    }, [currentTab, isIdle, customStatus]);


    const sendMessage = async (toUser: string, content: string) => {
        if (!userId) return;

        // Optimistic update
        const tempId = Math.random().toString();
        const msg = {
            id: tempId,
            from: userId,
            to: toUser,
            content,
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, msg]);

        const { data, error } = await supabase.from('chat_messages').insert({
            from_user: userId,
            to_user: toUser,
            content: content
        }).select().single();

        if (error) {
            console.error("Error sending message:", error);
            // Rollback optimistic update if needed, or show error
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } else if (data) {
            // Replace optimistic with real
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id, timestamp: data.created_at } : m));
        }
    };

    const clearJoinedUsers = () => setJoinedUsers([]);

    return {
        onlineUsers,
        setCustomStatus,
        joinedUsers,
        clearJoinedUsers,
        messages,
        sendMessage
    };
}
