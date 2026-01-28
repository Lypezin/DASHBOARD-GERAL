import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CurrentUser } from '@/types';
import { useIdleDetection } from '@/hooks/online/useIdleDetection';
import { usePresence } from '@/hooks/online/usePresence';
import { useChat } from '@/hooks/online/useChat';
import { OnlineUser, ChatMessage } from '@/hooks/online/types';

export type { OnlineUser, ChatMessage };

export function useOnlineUsers(currentUser: CurrentUser | null, currentTab: string) {
    const [userId, setUserId] = useState<string | null>(null);
    const isIdle = useIdleDetection();

    // Fetch User ID
    useEffect(() => {
        if (!currentUser) return;
        const getUserId = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);
        };
        getUserId();
    }, [currentUser]);

    const presence = usePresence(userId, currentUser, currentTab, isIdle);
    const chat = useChat(userId);

    return {
        // Presence
        onlineUsers: presence.onlineUsers,
        joinedUsers: presence.joinedUsers,
        clearJoinedUsers: presence.clearJoinedUsers,
        setCustomStatus: presence.setCustomStatus,
        setTypingTo: presence.setTypingTo,

        // Chat
        messages: chat.messages,
        sendMessage: chat.sendMessage,
        reactToMessage: chat.reactToMessage,
        pinMessage: chat.pinMessage,
        uploadFile: chat.uploadFile
    };
}
