import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ChatMessage } from './types';
import { RealtimeChannel } from '@supabase/supabase-js';
import { chatService } from './services/chatService';

export function useChat(userId: string | null) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const chatSubscriptionRef = useRef<RealtimeChannel | null>(null);

    // Initial Load & Subscription
    useEffect(() => {
        if (!userId) return;

        const loadHistory = async () => {
            try {
                const history = await chatService.fetchHistory(userId);
                setMessages(history);
            } catch (error) {
                console.error('Error fetching chat history:', error);
            }
        };

        loadHistory();

        const handleChanges = (payload: any) => {
            if (payload.eventType === 'INSERT') {
                const newMsg = payload.new;
                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) {
                        return prev.map(m => m.id === newMsg.id ? {
                            ...m,
                            timestamp: newMsg.created_at,
                            reactions: newMsg.reactions || {},
                            isPinned: newMsg.is_pinned
                        } : m);
                    }
                    return [...prev, {
                        id: newMsg.id,
                        from: newMsg.from_user,
                        to: newMsg.to_user,
                        content: newMsg.content,
                        timestamp: newMsg.created_at,
                        replyTo: newMsg.reply_to_id ? { id: newMsg.reply_to_id } : undefined,
                        reactions: newMsg.reactions || {},
                        attachments: newMsg.attachments || [],
                        isPinned: newMsg.is_pinned,
                        type: newMsg.type
                    }];
                });
            } else if (payload.eventType === 'UPDATE') {
                setMessages(prev => prev.map(m => m.id === payload.new.id ? {
                    ...m,
                    reactions: payload.new.reactions || {},
                    isPinned: payload.new.is_pinned
                } : m));
            }
        };

        const sub = supabase.channel('chat_db_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: `to_user=eq.${userId}` }, handleChanges)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: `from_user=eq.${userId}` }, handleChanges)
            .subscribe();

        chatSubscriptionRef.current = sub;

        return () => {
            if (chatSubscriptionRef.current) supabase.removeChannel(chatSubscriptionRef.current);
        };
    }, [userId]);

    const sendMessage = async (toUser: string, content: string, options?: { replyTo?: string, attachments?: any[] }) => {
        if (!userId) return;

        const tempId = Math.random().toString();
        const msg: ChatMessage = {
            id: tempId,
            from: userId,
            to: toUser,
            content,
            timestamp: new Date().toISOString(),
            replyTo: options?.replyTo ? { id: options.replyTo } : undefined,
            attachments: options?.attachments
        };
        setMessages(prev => [...prev, msg]);

        try {
            const data = await chatService.sendMessage(userId, toUser, content, options);
            if (data) {
                setMessages(prev => {
                    const alreadyExists = prev.some(m => m.id === data.id);
                    if (alreadyExists) return prev.filter(m => m.id !== tempId);
                    return prev.map(m => m.id === tempId ? {
                        ...m,
                        id: data.id,
                        timestamp: data.created_at,
                        replyTo: data.reply_to_id ? { id: data.reply_to_id } : undefined
                    } : m);
                });
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    };

    const reactToMessage = async (msgId: string, emoji: string) => {
        if (!userId) return;
        setMessages(prev => prev.map(m => {
            if (m.id === msgId) {
                return { ...m, reactions: { ...m.reactions, [userId]: emoji } };
            }
            return m;
        }));
        try {
            await chatService.reactToMessage(msgId, userId, emoji);
        } catch (error) {
            console.error('Error reacting to message:', error);
        }
    };

    const pinMessage = async (msgId: string, isPinned: boolean) => {
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isPinned } : m));
        try {
            await chatService.pinMessage(msgId, isPinned);
        } catch (error) {
            console.error('Error pinning message:', error);
        }
    };

    const uploadFile = async (file: File) => {
        if (!userId) return null;
        try {
            return await chatService.uploadFile(userId, file);
        } catch (error) {
            console.error('Error uploading file:', error);
            return null;
        }
    };

    return { messages, sendMessage, reactToMessage, pinMessage, uploadFile };
}
