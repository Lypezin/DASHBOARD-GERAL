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
    const prevMessagesLengthRef = useRef(messages.length);
    const initialLoadRef = useRef(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Track unread messages
    useEffect(() => {
        if (initialLoadRef.current && messages.length > 0) {
            prevMessagesLengthRef.current = messages.length;
            initialLoadRef.current = false;
            return;
        }

        if (messages.length > prevMessagesLengthRef.current) {
            const newMsgs = messages.slice(prevMessagesLengthRef.current);
            newMsgs.forEach(msg => {
                if (msg.from !== currentUser?.id && (activeChatUser?.id !== msg.from)) {
                    setUnreadCounts(prev => ({
                        ...prev,
                        [msg.from]: (prev[msg.from] || 0) + 1
                    }));
                }
            });
        }
        prevMessagesLengthRef.current = messages.length;
    }, [messages, activeChatUser, currentUser?.id]);

    // Clear unread when opening chat
    useEffect(() => {
        if (activeChatUser) {
            setUnreadCounts(prev => {
                const newCounts = { ...prev };
                delete newCounts[activeChatUser.id];
                return newCounts;
            });
        }
    }, [activeChatUser]);

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
