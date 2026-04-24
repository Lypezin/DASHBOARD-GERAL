import { useState, useEffect, useRef, useMemo } from 'react';
import { useOnlineUsers, OnlineUser, ChatMessage } from '@/hooks/data/useOnlineUsers';
import { CurrentUser } from '@/types';
import { useChatPersistence } from './hooks/useChatPersistence';
import { formatTimeOnline } from './utils';
import { supabase } from '@/lib/supabaseClient';

const NOTIFICATION_LIFETIME_MS = 3000;

export function useSidebarController(
    currentUser: CurrentUser | null,
    currentTab: string,
    initialOpen = false,
    preloadRealtime = false
) {
    const [isOpen, setIsOpen] = useState(initialOpen);
    const [hasActivatedRealtime, setHasActivatedRealtime] = useState(initialOpen || preloadRealtime);

    const onlineUsersData = useOnlineUsers(currentUser, currentTab, hasActivatedRealtime);
    const { onlineUsers, messages, joinedUsers, clearJoinedUsers } = onlineUsersData;

    const [searchTerm, setSearchTerm] = useState('');
    const [myCustomStatus, setMyCustomStatus] = useState('');
    const [notifications, setNotifications] = useState<{ id: string, message: string }[]>([]);
    const [avatarOverrides, setAvatarOverrides] = useState<Record<string, string>>({});

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
        if (preloadRealtime && !hasActivatedRealtime) {
            setHasActivatedRealtime(true);
        }
    }, [hasActivatedRealtime, preloadRealtime]);

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

    useEffect(() => {
        const missingAvatarUserIds = onlineUsers
            .filter((user) => !user.avatar_url && !avatarOverrides[user.id])
            .map((user) => user.id);

        if (missingAvatarUserIds.length === 0) {
            return;
        }

        let isCancelled = false;

        const hydrateMissingAvatars = async () => {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('id, avatar_url')
                .in('id', missingAvatarUserIds)
                .not('avatar_url', 'is', null);

            if (isCancelled || error || !data?.length) {
                return;
            }

            setAvatarOverrides((prev) => {
                const next = { ...prev };
                let hasChanges = false;

                for (const profile of data) {
                    if (profile.avatar_url && next[profile.id] !== profile.avatar_url) {
                        next[profile.id] = profile.avatar_url;
                        hasChanges = true;
                    }
                }

                return hasChanges ? next : prev;
            });
        };

        void hydrateMissingAvatars();

        return () => {
            isCancelled = true;
        };
    }, [avatarOverrides, onlineUsers]);

    const hydratedOnlineUsers = useMemo(() => (
        onlineUsers.map((user) => {
            const hydratedAvatarUrl = avatarOverrides[user.id];
            if (!hydratedAvatarUrl || user.avatar_url) {
                return user;
            }

            return {
                ...user,
                avatar_url: hydratedAvatarUrl,
            };
        })
    ), [avatarOverrides, onlineUsers]);

    useEffect(() => {
        if (!activeChatUser || activeChatUser.avatar_url) {
            return;
        }

        const hydratedActiveUser = hydratedOnlineUsers.find((user) => user.id === activeChatUser.id);
        if (!hydratedActiveUser?.avatar_url) {
            return;
        }

        setActiveChatUser((prev) => (
            prev && prev.id === hydratedActiveUser.id
                ? { ...prev, avatar_url: hydratedActiveUser.avatar_url }
                : prev
        ));
    }, [activeChatUser, hydratedOnlineUsers]);

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
        return hydratedOnlineUsers.filter((user: OnlineUser) =>
            user.name?.toLowerCase().includes(normalizedSearch) ||
            user.role?.toLowerCase().includes(normalizedSearch)
        );
    }, [hydratedOnlineUsers, searchTerm]);

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
        onlineUsers: hydratedOnlineUsers,
        handleFileUpload
    };
}
