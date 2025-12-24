import { useState, useEffect, useRef } from 'react';
import { useOnlineUsers, OnlineUser, ChatMessage } from '@/hooks/useOnlineUsers';
import { CurrentUser } from '@/types';

export function useSidebarController(currentUser: CurrentUser | null, currentTab: string) {
    const [isOpen, setIsOpen] = useState(false);

    // Existing hook
    const onlineUsersData = useOnlineUsers(currentUser, currentTab);
    const { onlineUsers, messages, joinedUsers, clearJoinedUsers } = onlineUsersData;

    const [searchTerm, setSearchTerm] = useState('');
    const [myCustomStatus, setMyCustomStatus] = useState('');
    const [notifications, setNotifications] = useState<{ id: string, message: string }[]>([]);

    // Chat State
    const [activeChatUser, setActiveChatUser] = useState<OnlineUser | null>(null);
    const [chatInput, setChatInput] = useState('');
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State para rastrear última leitura (Persistência Local)
    const [lastReadMap, setLastReadMap] = useState<Record<string, string>>({});

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
            // O usuário relatou que "aparece total de mensagem que eu mandei". Isso não deve acontecer.
            if (msg.from === currentUser.id) return;

            // Se estou com o chat aberto para esse usuário e a janela está visível, não conta
            // Mas isso é difícil saber. Vamos assumir que se activeChatUser está setado, estamos vendo.
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
        if (activeChatUser && currentUser) {
            // Encontrar mensagem mais recente desse usuário
            const userMsgs = messages.filter(m => m.from === activeChatUser.id || m.to === activeChatUser.id);
            if (userMsgs.length > 0) {
                // Pegar timestamp da última mensagem (mesmo que seja minha, para zerar o contador)
                const lastMsg = userMsgs[userMsgs.length - 1];
                const now = new Date().toISOString();
                // Usamos 'now' ou timestamp da msg? Melhor timestamp da msg + 1s ou 'now'. 
                // Seguranca: usar NOW para garantir futuras msgs sejam capturadas.

                setLastReadMap(prev => {
                    const newMap = { ...prev, [activeChatUser.id]: now };
                    localStorage.setItem(`chat_last_read_${currentUser.id}`, JSON.stringify(newMap));
                    return newMap;
                });
            } else {
                // Se não tem mensagens, marca como lido agora
                setLastReadMap(prev => {
                    const newMap = { ...prev, [activeChatUser.id]: new Date().toISOString() };
                    localStorage.setItem(`chat_last_read_${currentUser.id}`, JSON.stringify(newMap));
                    return newMap;
                });
            }
        }
    }, [activeChatUser, currentUser]); // messages removed to avoid marking as read just by receiving msg while open (wait, actually if chat is open, receiving should mark as read? Yes, handled by effect dependency?)
    // Melhor: quando recebe mensagem e chat está aberto, o effect acima (unread calc) já ignora (activeChatUser?.id === msg.from).
    // Mas precisamos atualizar o LastRead para que quando fechar o chat, ela não apareça como não lida?
    // Sim. O effect de baixo precisa rodar mensagens mudarem SE chat estiver aberto.

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

    // Scroll to bottom
    useEffect(() => {
        if (activeChatUser && chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, activeChatUser]);

    // Notifications
    useEffect(() => {
        if (joinedUsers.length > 0) {
            const newNotifs = joinedUsers.map(u => ({
                id: Math.random().toString(36),
                message: `${u.name?.split(' ')[0]} entrou!`
            }));

            setNotifications(prev => [...prev, ...newNotifs]);
            clearJoinedUsers();

            setTimeout(() => {
                setNotifications(prev => prev.slice(newNotifs.length));
            }, 3000);
        }
    }, [joinedUsers, clearJoinedUsers]);

    // Force tick for time updates
    const [tick, setTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 60000);
        return () => clearInterval(interval);
    }, []);

    const activeMessages = activeChatUser
        ? messages.filter(m => (m.from === activeChatUser.id && m.to === currentUser?.id) || (m.from === currentUser?.id && m.to === activeChatUser.id))
        : [];

    const filteredUsers = onlineUsers.filter((u: OnlineUser) =>
    (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const formatTimeOnline = (dateString: string) => {
        const start = new Date(dateString).getTime();
        const now = new Date().getTime();
        const diff = Math.floor((now - start) / 1000 / 60);

        if (diff < 60) return `${diff}m`;
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;
        return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
    };

    const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeChatUser) return;

        const { uploadFile, sendMessage } = onlineUsersData;
        const upload = await uploadFile(file);

        if (upload) {
            await sendMessage(activeChatUser.id, "", {
                attachments: [upload]
            });
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return {
        isOpen, setIsOpen,
        onlineUsersData,
        searchTerm, setSearchTerm,
        myCustomStatus, setMyCustomStatus,
        notifications,
        activeChatUser, setActiveChatUser,
        chatInput, setChatInput,
        replyingTo, setReplyingTo,
        chatEndRef,
        unreadCounts,
        fileInputRef,
        activeMessages,
        filteredUsers,
        formatTimeOnline,
        totalUnread,
        onlineUsers,
        handleFileUpload
    };
}
