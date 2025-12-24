
import { useState } from 'react';
import { ChatMessage } from './types';
import { chatService } from './services/chatService';
import { useChatSubscription } from './useChatSubscription';

export function useChat(userId: string | null) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    // Initial Load & Subscription Logic extracted
    useChatSubscription({ userId, setMessages });

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
