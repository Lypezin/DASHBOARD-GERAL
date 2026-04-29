import { useState, useEffect, useMemo } from 'react';
import { useOnlineUsers, OnlineUser } from '@/hooks/data/useOnlineUsers';
import { CurrentUser } from '@/types';
import { useChatPersistence } from './hooks/useChatPersistence';
import { formatTimeOnline } from './utils';
import { useSidebarAvatars } from './useSidebarAvatars';
import { useSidebarChat } from './useSidebarChat';

export function useSidebarController(
    currentUser: CurrentUser | null,
    currentTab: string,
    initialOpen = false,
    preloadRealtime = false
) {
    const [isOpen, setIsOpen] = useState(initialOpen);
    const [hasActivatedRealtime, setHasActivatedRealtime] = useState(initialOpen || preloadRealtime);

    const onlineUsersData = useOnlineUsers(currentUser, currentTab, hasActivatedRealtime, isOpen);
    const { onlineUsers, messages, joinedUsers, clearJoinedUsers } = onlineUsersData;

    const [searchTerm, setSearchTerm] = useState('');
    const [myCustomStatus, setMyCustomStatus] = useState('');

    const { hydratedOnlineUsers } = useSidebarAvatars(onlineUsers);

    const {
        activeChatUser,
        setActiveChatUser,
        chatInput,
        setChatInput,
        replyingTo,
        setReplyingTo,
        chatEndRef,
        fileInputRef,
        activeMessages
    } = useSidebarChat(hydratedOnlineUsers, messages, currentUser);

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
        if (joinedUsers.length === 0) return;
        clearJoinedUsers();
    }, [joinedUsers, clearJoinedUsers]);

    const [, setTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTick((tick) => tick + 1), 60000);
        return () => clearInterval(interval);
    }, []);

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
