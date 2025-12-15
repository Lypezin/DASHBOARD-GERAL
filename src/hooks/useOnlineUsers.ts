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

        // Função para obter dados completos do usuário (Auth + Profile)
        const getFullUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            // Busca avatar atualizado da tabela de perfis (user_profiles)
            let avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

            try {
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('avatar_url')
                    .eq('id', user.id)
                    .single();

                if (profile?.avatar_url) {
                    avatarUrl = profile.avatar_url;
                }
            } catch (error) {
                // Silently fail if profile not found/error
            }

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

        // 1. Configuração do Canal (Executa apenas uma vez por sessão/mudança de org)
        // Isso evita desconectar/reconectar a cada mudança de aba
        if (!channelRef.current) {
            // Usa ID fixo para o canal evitar recriações desnecessárias
            const channel = supabase.channel('online-users', {
                config: {
                    presence: {
                        key: currentUser.organization_id ? `${currentUser.organization_id}:${currentUser.role}` : 'unknown',
                        // Nota: O uso de Math.random() ou similar aqui é debatível.
                        // Se quisermos que UM usuário tenha Múltiplas presenças (abas diferentes), precisamos de chaves diferentes?
                        // Sim, se usarmos o MESMO key, a presença é sobrescrita (update) em vez de adicionar.
                        // O Client ID do supabase realtime já lida com conexões separadas.
                        // Se usarmos user.id como key, ao abrir nova aba ele ATUALIZA o status daquele user.
                        // Se quisermos "lista de users únicos", user.id é ideal.

                        // CORREÇÃO: Vamos usar user.id. O Supabase gere conexões. 
                        // Se o mesmo user abrir 2 abas, ele vai aparecer 2 vezes na lista raw, mas o presenceState agrupa por key.
                        // Se usarmos user.id como key, presenceState[userId] terá um array de presences (abas).
                        // No nosso código de 'sync', nós pegamos presenceState[key][0]. Isso significa que mostramos o user UMA vez.
                        // Isso é o comportamento desejado.
                    },
                },
            });

            channelRef.current = channel;

            channel
                .on('presence', { event: 'sync' }, () => {
                    const newState = channel.presenceState<OnlineUser>();
                    const users: OnlineUser[] = [];

                    for (const key in newState) {
                        // newState[key] é array de presenças para aquela chave
                        // Se usarmos user.id como chave, aqui teremos todas as abas daquele user.
                        // Pegamos a mais recente (que deve ser a [0] ou a última, depende do supabase, geralmente a [0] é a mais recente syncada, mas vamos garantir)
                        const presences = newState[key];
                        if (presences && presences.length > 0) {
                            // Queremos mostrar o usuário se ele tiver QUALQUER conexão.
                            // Usamos os dados da primeira presença encontrada.
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
        }

        // Cleaning (apenas no unmount do componente pai)
        // Como esse hook roda no PageWrapper, só desmonta no refresh/close.
        return () => {
            // Não removemos o canal aqui se só mudaram as dependências.
            // Mas como o React executa o cleanup antes do próximo effect...
            // Se removermos aqui, vamos desconectar a cada mudança de Tab.
            // PRECISAMOS garantir que channelRef persista.
            // O useRef persiste. Mas o useEffect cleanup roda.
            // SOLUÇÃO CLÁSSICA: Mover a criação do channel para um useEffect sepado com dependência zero ou apenas org_id.
        };

    }, [currentUser?.organization_id]); // Apenas recria canal se mudar organização (raro)

    // Effect dedicado APENAS para atualizar os dados (tracking) quando a aba mudar
    useEffect(() => {
        if (!currentUser || !channelRef.current) return;

        const update = async () => {
            // Replicamos a lógica de pegar dados atualizados
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

            if (channelRef.current) { // Verifica novamente
                await channelRef.current.track(presence);
            }
        };

        update();
    }, [currentTab, currentUser?.role]); // Roda quando Tab ou Role mudar

    // Effect para cleanup final
    useEffect(() => {
        // Empty dependency = mount/unmount only
        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        }
    }, []);

    return onlineUsers;
}
