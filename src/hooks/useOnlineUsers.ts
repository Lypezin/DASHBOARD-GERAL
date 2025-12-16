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
    typing_to?: string | null; // ID of the user they are typing to
}

export interface ChatMessage {
    id: string;
    from: string;
    to: string;
    content: string;
    timestamp: string;
    replyTo?: { id: string, content?: string, fromName?: string };
    reactions?: Record<string, string>; // userId: emoji
    attachments?: { url: string, type: 'image' | 'video' | 'file', name: string }[];
    isPinned?: boolean;
    type?: 'text' | 'task_request' | 'system';
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

        // Subscribe to chat changes (INSERT and UPDATE)
        const sub = supabase.channel('chat_db_changes')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT and UPDATE
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `to_user=eq.${userId}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newMsg = payload.new;
                        setMessages(prev => [...prev, {
                            id: newMsg.id,
                            from: newMsg.from_user,
                            to: newMsg.to_user,
                            content: newMsg.content,
                            timestamp: newMsg.created_at,
                            replyTo: newMsg.reply_to_id ? { id: newMsg.reply_to_id } as any : undefined, // Simplify for now, need to fetch full reply often
                            reactions: newMsg.reactions || {},
                            attachments: newMsg.attachments || [],
                            isPinned: newMsg.is_pinned,
                            type: newMsg.type
                        }]);
                    } else if (payload.eventType === 'UPDATE') {
                        setMessages(prev => prev.map(m => m.id === payload.new.id ? {
                            ...m,
                            reactions: payload.new.reactions || {},
                            isPinned: payload.new.is_pinned
                        } : m));
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `from_user=eq.${userId}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        // Check if we already have it (optimistic update might have added it)
                        setMessages(prev => {
                            if (prev.some(m => m.id === payload.new.id)) {
                                return prev.map(m => m.id === payload.new.id ? {
                                    ...m,
                                    timestamp: payload.new.created_at,
                                    // Ensure server values take precedence
                                    reactions: payload.new.reactions || {},
                                    isPinned: payload.new.is_pinned
                                } : m);
                            }
                            return [...prev, {
                                id: payload.new.id,
                                from: payload.new.from_user,
                                to: payload.new.to_user,
                                content: payload.new.content,
                                timestamp: payload.new.created_at,
                                replyTo: payload.new.reply_to_id,
                                reactions: payload.new.reactions || {},
                                attachments: payload.new.attachments || [],
                                isPinned: payload.new.is_pinned,
                                type: payload.new.type
                            }];
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        setMessages(prev => prev.map(m => m.id === payload.new.id ? {
                            ...m,
                            reactions: payload.new.reactions || {},
                            isPinned: payload.new.is_pinned
                        } : m));
                    }
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

    // 6. Typing Logic
    const setTypingTo = async (targetUserId: string | null) => {
        if (!channelRef.current || !userId) return;

        // We update our own presence to indicate we are typing to someone
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

    const sendMessage = async (toUser: string, content: string, options?: { replyTo?: string, attachments?: any[] }) => {
        if (!userId) return;

        const tempId = Math.random().toString();
        const msg: ChatMessage = {
            id: tempId,
            from: userId,
            to: toUser,
            content,
            timestamp: new Date().toISOString(),
            replyTo: options?.replyTo ? { id: options.replyTo } : undefined,
            attachments: options?.attachments
        };
        setMessages(prev => [...prev, msg]);

        const { data, error } = await supabase.from('chat_messages').insert({
            from_user: userId,
            to_user: toUser,
            content: content,
            reply_to_id: options?.replyTo,
            attachments: options?.attachments || []
        }).select().single();

        if (error) {
            console.error("Error sending message:", error);
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } else if (data) {
            setMessages(prev => {
                // Logic to avoid duplication if Realtime INSERT arrived first
                const alreadyExists = prev.some(m => m.id === data.id);
                if (alreadyExists) {
                    // Remove optimistic, keep real
                    return prev.filter(m => m.id !== tempId);
                }
                // Replace optimistic with real
                return prev.map(m => m.id === tempId ? {
                    ...m,
                    id: data.id,
                    timestamp: data.created_at,
                    replyTo: data.reply_to_id ? { id: data.reply_to_id } : undefined
                } : m);
            });
        }
    };

    const reactToMessage = async (msgId: string, emoji: string) => {
        // Optimistic
        setMessages(prev => prev.map(m => {
            if (m.id === msgId) {
                const newReactions = { ...m.reactions, [userId!]: emoji };
                return { ...m, reactions: newReactions };
            }
            return m;
        }));

        // Fetch current reactions first to merge (concurrency handling is basic here)
        const { data: currentMsg } = await supabase.from('chat_messages').select('reactions').eq('id', msgId).single();
        const updatedReactions = { ...currentMsg?.reactions, [userId!]: emoji };

        await supabase.from('chat_messages').update({ reactions: updatedReactions }).eq('id', msgId);
    };

    const pinMessage = async (msgId: string, isPinned: boolean) => {
        // Optimistic
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isPinned } : m));
        await supabase.from('chat_messages').update({ is_pinned: isPinned }).eq('id', msgId);
    };

    const clearJoinedUsers = () => setJoinedUsers([]);

    return {
        onlineUsers,
        setCustomStatus,
        setTypingTo,
        joinedUsers,
        clearJoinedUsers,
        messages,
        sendMessage,
        reactToMessage,
        pinMessage
    };
}
