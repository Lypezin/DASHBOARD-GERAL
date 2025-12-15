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
}

export function useOnlineUsers(currentUser: CurrentUser | null, currentTab: string) {
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);

    // 1. Fetch User ID on mount/auth change
    useEffect(() => {
        if (!currentUser) return;

        const getUserId = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);
        };
        getUserId();
    }, [currentUser]);

    // 2. Connect to Channel (Dependent on userId)
    useEffect(() => {
        if (!currentUser || !userId || channelRef.current) return;

        const channel = supabase.channel('online-users', {
            config: {
                presence: {
                    key: userId, // Agora temos o ID único garantido
                },
            },
        });

        channelRef.current = channel;

        // Função auxiliar para buscar metadados
        const getFullUserData = async () => {
            // ... (lógica existente mantida, mas agora usando userId do escopo ou buscando de novo)
            // Como já temos userId, podemos otimizar, mas vamos manter a busca segura
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
            } catch { } // ignore errors

            return {
                id: user.id,
                email: user.email ?? null,
                name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
                avatar_url: avatarUrl,
                role: currentUser.role,
                online_at: new Date().toISOString(),
                current_tab: currentTab
            } as OnlineUser;
        };

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState<OnlineUser>();
                const users: OnlineUser[] = [];

                for (const key in newState) {
                    const presences = newState[key];
                    if (presences && presences.length > 0) {
                        users.push(presences[0]);
                    }
                }

                users.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                setOnlineUsers(users);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    const presence = await getFullUserData();
                    if (presence) {
                        await channel.track(presence);
                    }
                }
            });

        return () => {
            // Cleanup logic handled in unmount effect
        };

    }, [userId, currentUser?.organization_id, currentTab, currentUser?.role]);


    // 3. Update Tracking on Tab Change
    useEffect(() => {
        if (!currentUser || !userId || !channelRef.current) return;

        const update = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
            try {
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('avatar_url')
                    .eq('id', user.id)
                    .single();
                if (profile?.avatar_url) avatarUrl = profile.avatar_url;
            } catch { }

            const presence: OnlineUser = {
                id: user.id,
                email: user.email ?? null,
                name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
                avatar_url: avatarUrl,
                role: currentUser.role,
                online_at: new Date().toISOString(),
                current_tab: currentTab
            };

            // Ensure channel is subscribed
            if (channelRef.current) {
                await channelRef.current.track(presence);
            }
        };

        update();
    }, [currentTab, currentUser?.role, userId]);

    // 4. Final Cleanup
    useEffect(() => {
        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, []);

    return onlineUsers;
}
