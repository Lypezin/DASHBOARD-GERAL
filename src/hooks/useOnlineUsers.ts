import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CurrentUser } from '@/types';

export interface OnlineUser {
    id: string;
    email: string | null;
    name: string | null;
    online_at: string;
    role?: string;
}

export function useOnlineUsers(currentUser: CurrentUser | null) {
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

    useEffect(() => {
        // Se não tiver usuário logado, não conectar
        if (!currentUser) return;

        // Função para iniciar tracking
        const trackPresence = async () => {
            // Pequeno delay para garantir que auth state está pronto e evitar race conditions
            // e também para não bloquear renderização inicial

            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            // Define info do usuário atual para compartilhar
            const myPresence: OnlineUser = {
                id: user.id,
                email: user.email ?? null,
                name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
                role: currentUser.role,
                online_at: new Date().toISOString(),
            };

            const channel = supabase.channel('online-users', {
                config: {
                    presence: {
                        key: user.id,
                    },
                },
            });

            channel
                .on('presence', { event: 'sync' }, () => {
                    const newState = channel.presenceState<OnlineUser>();

                    // Flatten presence state
                    const users: OnlineUser[] = [];
                    for (const key in newState) {
                        // Cada chave pode ter múltiplos registros (se user tiver múltiplas abas)
                        // Pegamos o mais recente ou apenas o primeiro
                        if (newState[key] && newState[key].length > 0) {
                            users.push(newState[key][0]);
                        }
                    }

                    // Ordenar por nome
                    users.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                    setOnlineUsers(users);
                })
                .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                    // O sync já deve tratar, mas logs podem ajudar debug
                    // console.log('User joined:', key, newPresences);
                })
                .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                    // console.log('User left:', key, leftPresences);
                })
                .subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        await channel.track(myPresence);
                    }
                });

            return () => {
                supabase.removeChannel(channel);
            };
        };

        const cleanupPromise = trackPresence();

        return () => {
            cleanupPromise.then(cleanup => cleanup && cleanup());
        };
    }, [currentUser]);

    return onlineUsers;
}
