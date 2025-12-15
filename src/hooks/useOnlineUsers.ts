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


export function useOnlineUsers(currentUser: CurrentUser | null, currentTab: string) {
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [joinedUsers, setJoinedUsers] = useState<OnlineUser[]>([]); // Queue of new users for notifications
    const [messages, setMessages] = useState<{ from: string, to: string, content: string, timestamp: string }[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [isIdle, setIsIdle] = useState(false);
    const [customStatus, setCustomStatus] = useState<string>('');
    const channelRef = useRef<RealtimeChannel | null>(null);
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 1. Fetch User ID on mount/auth change
    useEffect(() => {
        if (!currentUser) return;

        const getUserId = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);
        };
        getUserId();
    }, [currentUser]);

    // 1.1 Idle Detection Logic
    useEffect(() => {
        const resetIdle = () => {
            setIsIdle(false);
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            // Set new timer for 5 minutes (300000 ms)
            idleTimerRef.current = setTimeout(() => {
                setIsIdle(true);
            }, 5 * 60 * 1000);
        };

        // Initial timer
        resetIdle();

        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => document.addEventListener(event, resetIdle));

        return () => {
            events.forEach(event => document.removeEventListener(event, resetIdle));
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        };
    }, []);

    // 2. Connect to Channel (Dependent on userId)
    useEffect(() => {
        if (!currentUser || !userId || channelRef.current) return;

        const channel = supabase.channel('online-users', {
            config: {
                presence: {
                    key: userId,
                },
            },
        });

        channelRef.current = channel;

        // Helper para detectar dispositivo
        const getDeviceType = (): 'mobile' | 'desktop' => {
            if (typeof navigator === 'undefined') return 'desktop';
            const ua = navigator.userAgent;
            if (/android/i.test(ua) || /iphone/i.test(ua) || /ipad/i.test(ua)) {
                return 'mobile';
            }
            return 'desktop';
        };

        // Função auxiliar para buscar metadados e construir o objeto de presença
        const getPresenceData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
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
                role: currentUser.role,
                online_at: sessionStartRef.current,
                current_tab: currentTab,
                device: getDeviceType(),
                is_idle: isIdle,
                custom_status: customStatus
            } as OnlineUser;
        };

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState<OnlineUser>();
                const users: OnlineUser[] = [];

                for (const key in newState) {
                    const presences = newState[key];
                    if (presences && presences.length > 0) {
                        // Pega o update mais recente
                        users.push(presences[0]);
                    }
                }
                // Ordenar
                users.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

                setOnlineUsers(prev => {
                    // Detect new users only if we had a previous list (avoid initial load spam)
                    if (prev.length > 0) {
                        const prevIds = new Set(prev.map(u => u.id));
                        const newJoiners = users.filter(u => !prevIds.has(u.id) && u.id !== userId); // Don't notify about self
                        if (newJoiners.length > 0) {
                            setJoinedUsers(last => [...last, ...newJoiners]);
                        }
                    }
                    return users;
                });
            })
            .on('broadcast', { event: 'chat' }, (payload) => {
                const msg = payload.payload;
                // Guard: verify structure
                if (!msg || !msg.from || !msg.content) return;

                // We need to access the current userId here. 
                // However, userId is in closure. It should be fine as effect depends on userId.
                // But wait, if userId changes, effect re-runs.
                if (userId && (msg.to === userId || msg.to === 'all')) {
                    setMessages(prev => {
                        // Avoid duplicates if we optimistically added it?
                        // Simple check: compare timestamps or IDs? 
                        // For now, simple append.
                        return [...prev, msg].slice(-50);
                    });
                }
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    const presence = await getPresenceData();
                    if (presence) {
                        await channel.track(presence);
                    }
                }
            });

        return () => {
            // Cleanup handled in unmount effect
        };

        // Dependências: apenas as de inicialização
    }, [userId, currentUser?.organization_id]);


    // Ref para guardar o início da sessão e não resetar "Tempo Online" a cada update
    const sessionStartRef = useRef(new Date().toISOString());

    // 3. Update Tracking on State Changes (Tab, Idle, Status)
    useEffect(() => {
        if (!currentUser || !userId || !channelRef.current) return;

        const update = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
            try {
                const { data: profile } = await supabase.from('user_profiles').select('avatar_url').eq('id', user.id).single();
                if (profile?.avatar_url) avatarUrl = profile.avatar_url;
            } catch { }

            const getDeviceType = (): 'mobile' | 'desktop' => {
                if (typeof navigator === 'undefined') return 'desktop';
                return /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
            };

            const presence: OnlineUser = {
                id: user.id,
                email: user.email ?? null,
                name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
                avatar_url: avatarUrl,
                role: currentUser.role,
                online_at: sessionStartRef.current, // Mantém data original
                current_tab: currentTab,
                device: getDeviceType(),
                is_idle: isIdle,
                custom_status: customStatus
            };

            if (channelRef.current) {
                await channelRef.current.track(presence);
            }
        };

        update();
    }, [currentTab, currentUser?.role, userId, isIdle, customStatus]); // Atualiza quando qualquer um mudar

    const clearJoinedUsers = () => setJoinedUsers([]);

    // 4. Final Cleanup
    useEffect(() => {
        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, []);

    // Exportar setter de status para a UI usar
    return {
        onlineUsers,
        setCustomStatus,
        joinedUsers,
        clearJoinedUsers,
        messages,
        sendMessage
    };
}
