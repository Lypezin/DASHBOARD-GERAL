import { useState, useEffect, useRef, useMemo } from 'react';
import { useOnlineUsers, OnlineUser, ChatMessage } from '@/hooks/data/useOnlineUsers';
import { CurrentUser } from '@/types';
import { useChatPersistence } from './hooks/useChatPersistence';
import { formatTimeOnline } from './utils';

const NOTIFICATION_LIFETIME_MS = 3000;

export function useSidebarController(currentUser: CurrentUser | null, currentTab: string) {
    const [isOpen, setIsOpen] = useState(false);
    const [hasActivatedRealtime, setHasActivatedRealtime] = useState(false);

    const onlineUsersData = useOnlineUsers(currentUser, currentTab, hasActivatedRealtime);
    const { onlineUsers, messages, joinedUsers, clearJoinedUsers } = onlineUsersData;

    const [searchTerm, setSearchTerm] = useState('');
    const [myCustomStatus, setMyCustomStatus] = useState('');
    const [notifications, setNotifications] = useState<{ id: string, message: string }[]>([]);

    const [activeChatUser, setActiveChatUser] = useState<OnlineUser | null>(null);
    const [chatInput, setChatInput] = useState('');
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const notificationTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const { unreadCounts } = useChatPersistence(currentUser, messages, activeChatUser);

    useEffect(() => {
        if (isOpen && !hasActivatedRealtime) {
            setHasActivatedRealtime(true);
        }
    }, [hasActivatedRealtime, isOpen]);

    useEffect(() => {
        if (activeChatUser && chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, activeChatUser]);

    useEffect(() => {
        if (joinedUsers.length === 0) return;

        const newNotifications = joinedUsers.map((user) => ({
            id: `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            message: `${user.name?.split(' ')[0]} entrou!`
        }));

        setNotifications((prev) => [...prev, ...newNotifications]);
        clearJoinedUsers();

        newNotifications.forEach((notification) => {
            const timeout = setTimeout(() => {
                setNotifications((prev) => prev.filter((item) => item.id !== notification.id));
                notificationTimeoutsRef.current.delete(notification.id);
            }, NOTIFICATION_LIFETIME_MS);

            notificationTimeoutsRef.current.set(notification.id, timeout);
        });
    }, [joinedUsers, clearJoinedUsers]);

    useEffect(() => {
        const activeTimeouts = notificationTimeoutsRef.current;
        return () => {
            activeTimeouts.forEach((timeout) => clearTimeout(timeout));
            activeTimeouts.clear();
        };
    }, []);

    const [, setTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTick((tick) => tick + 1), 60000);
        return () => clearInterval(interval);
    }, []);

    const activeMessages = useMemo(() => (
        activeChatUser
            ? messages.filter((message) =>
                (message.from === activeChatUser.id && message.to === currentUser?.id) ||
                (message.from === currentUser?.id && message.to === activeChatUser.id)
            )
            : []
    ), [activeChatUser, currentUser?.id, messages]);

    const filteredUsers = useMemo(() => {
        const normalizedSearch = searchTerm.toLowerCase();
        return onlineUsers.filter((user: OnlineUser) =>
            user.name?.toLowerCase().includes(normalizedSearch) ||
            user.role?.toLowerCase().includes(normalizedSearch)
        );
    }, [onlineUsers, searchTerm]);

    const totalUnread = useMemo(() => Object.values(unreadCounts).reduce((a, b) => a + b, 0), [unreadCounts]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeChatUser) return;

        const { uploadFile, sendMessage } = onlineUsersData;
        const upload = await uploadFile(file);

        if (upload) {
            await sendMessage(activeChatUser.id, '', {
                attachments: [upload]
            });
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return {
        isOpen,
        setIsOpen,
        hasActivatedRealtime,
        onlineUsersData,
        searchTerm,
        setSearchTerm,
        myCustomStatus,
        setMyCustomStatus,
        notifications,
        activeChatUser,
        setActiveChatUser,
        chatInput,
        setChatInput,
        replyingTo,
        setReplyingTo,
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
