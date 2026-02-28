
import { useState, useEffect, useRef } from 'react';
import { useOnlineUsers, OnlineUser, ChatMessage } from '@/hooks/data/useOnlineUsers';
import { CurrentUser } from '@/types';
import { useChatPersistence } from './hooks/useChatPersistence';
import { formatTimeOnline } from './utils';

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
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Persistence Hook
    const { unreadCounts } = useChatPersistence(currentUser, messages, activeChatUser);

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
        isOpen, setIsOpen, onlineUsersData, searchTerm, setSearchTerm, myCustomStatus, setMyCustomStatus, notifications, activeChatUser, setActiveChatUser,
        chatInput, setChatInput, replyingTo, setReplyingTo, chatEndRef, unreadCounts, fileInputRef, activeMessages, filteredUsers, formatTimeOnline,
        totalUnread, onlineUsers, handleFileUpload
    };
}
