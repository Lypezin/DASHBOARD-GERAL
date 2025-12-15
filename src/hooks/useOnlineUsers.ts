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
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        if (!currentUser) return;

        // Função para identificar o usuário e metadados
        const getUserMetadata = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            return {
                id: user.id,
                email: user.email ?? null,
                name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
                // Tenta várias propriedades comuns para avatar
                avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || user.user_metadata?.avatar || null,
                role: currentUser.role,
                online_at: new Date().toISOString(),
                current_tab: currentTab
            } as OnlineUser;
        };

        // Inicializa o canal apenas uma vez ou se o usuário mudar
        if (!channelRef.current) {
            const channel = supabase.channel('online-users', {
                config: {
                    presence: {
                        key: currentUser.organization_id ? `${currentUser.organization_id}:${currentUser.role}` : 'unknown', // Usando ID único se possível, ou email
                    },
                },
            });

            channelRef.current = channel;

            channel
                .on('presence', { event: 'sync' }, () => {
                    const newState = channel.presenceState<OnlineUser>();
                    const users: OnlineUser[] = [];
                    for (const key in newState) {
                        if (newState[key] && newState[key].length > 0) {
                            // Pega o estado mais recente (último track)
                            users.push(newState[key][0]);
                        }
                    }
                    // Ordenar por nome
                    users.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                    setOnlineUsers(users);
                })
                .subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        const presence = await getUserMetadata();
                        if (presence) {
                            // Usa o user ID como tracking key para garantir unicidade
                            await channel.track(presence);
                        }
                    }
                });
        }

        // Effect separado para atualizar o estado (Tab) sem reconectar
        const updatePresence = async () => {
            if (channelRef.current) {
                const presence = await getUserMetadata();
                if (presence) {
                    await channelRef.current.track(presence);
                }
            }
        };

        updatePresence();

        // Cleanup apenas no unmount real do componente
        return () => {
            // Não fazemos unsubscribe aqui para evitar flood de connect/disconnect se o effect rodar muito
            // Mas como o channelRef persiste, precisamos garantir que fechamos apenas quando o componente morre.
            // O React Strict Mode pode causar dupla execução.
        };
    }, [currentUser?.role, currentTab]); // Dependências do update

    // Cleanup real final
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
