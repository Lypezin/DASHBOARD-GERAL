
import { useState, useEffect } from 'react';
import { ChatMessage, OnlineUser } from '@/hooks/useOnlineUsers';
import { CurrentUser } from '@/types';

export function useChatPersistence(
    currentUser: CurrentUser | null,
    messages: ChatMessage[],
    activeChatUser: OnlineUser | null
) {
    const [lastReadMap, setLastReadMap] = useState<Record<string, string>>({});
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

    // Carregar lastReadMap quando o usuário for identificado
    useEffect(() => {
        if (currentUser?.id) {
            const saved = localStorage.getItem(`chat_last_read_${currentUser.id}`);
            if (saved) {
                try {
                    setLastReadMap(JSON.parse(saved));
                } catch (e) {
                    console.error('Erro ao ler chat_last_read:', e);
                }
            }
        }
    }, [currentUser?.id]);

    // Recalcular Unread Counts
    useEffect(() => {
        if (!currentUser?.id) return;

        const counts: Record<string, number> = {};

        messages.forEach(msg => {
            // CRÍTICO: Ignorar mensagens enviadas por MIM
            if (msg.from === currentUser.id) return;

            // Se estou com o chat aberto para esse usuário
            if (activeChatUser?.id === msg.from) return;

            const lastRead = lastReadMap[msg.from] || '1970-01-01T00:00:00Z';

            // Comparação de datas segura
            if (new Date(msg.timestamp) > new Date(lastRead)) {
                counts[msg.from] = (counts[msg.from] || 0) + 1;
            }
        });

        setUnreadCounts(counts);
    }, [messages, lastReadMap, currentUser?.id, activeChatUser?.id]);

    // Ao abrir chat, marcar como lido e salvar no storage
    useEffect(() => {
        if (activeChatUser && currentUser && messages.length > 0) {
            const userMsgs = messages.filter(m => m.from === activeChatUser.id || m.to === activeChatUser.id);

            // Só atualiza se tiver mensagens
            if (userMsgs.length > 0) {
                const now = new Date().toISOString();

                setLastReadMap(prev => {
                    const newMap = { ...prev, [activeChatUser.id]: now };
                    localStorage.setItem(`chat_last_read_${currentUser.id}`, JSON.stringify(newMap));
                    return newMap;
                });
            } else {
                // Se não tem mensagens, marca como lido agora (abriu chat vazio)
                setLastReadMap(prev => {
                    const newMap = { ...prev, [activeChatUser.id]: new Date().toISOString() };
                    localStorage.setItem(`chat_last_read_${currentUser.id}`, JSON.stringify(newMap));
                    return newMap;
                });
            }
        }
    }, [activeChatUser, currentUser]);

    // Update read status when new messages arrive while chat is open
    useEffect(() => {
        if (activeChatUser && currentUser && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            // Só atualiza se a última msg for desse papo
            if (lastMsg.from === activeChatUser.id || lastMsg.to === activeChatUser.id) {
                setLastReadMap(prev => {
                    const newMap = { ...prev, [activeChatUser.id]: new Date().toISOString() };
                    localStorage.setItem(`chat_last_read_${currentUser.id}`, JSON.stringify(newMap));
                    return newMap;
                });
            }
        }
    }, [messages, activeChatUser, currentUser]);

    return {
        unreadCounts,
        lastReadMap
    };
}
