import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ChatMessage } from './types';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useChat(userId: string | null) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const chatSubscriptionRef = useRef<RealtimeChannel | null>(null);

    // Initial Load & Subscription
    useEffect(() => {
        if (!userId) return;

        const fetchHistory = async () => {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .or(`from_user.eq.${userId},to_user.eq.${userId}`)
                .order('created_at', { ascending: false })
                .limit(100);

            if (!error && data) {
                const mapped: ChatMessage[] = data.map(m => ({
                    id: m.id,
                    from: m.from_user,
                    to: m.to_user,
                    content: m.content,
                    timestamp: m.created_at,
                    replyTo: m.reply_to_id ? { id: m.reply_to_id } : undefined,
                    reactions: m.reactions || {},
                    attachments: m.attachments || [],
                    isPinned: m.is_pinned,
                    type: m.type
                })).reverse();
                setMessages(mapped);
            }
        };

        fetchHistory();

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
                        replyTo: newMsg.reply_to_id ? { id: newMsg.reply_to_id } : undefined, // Simplification
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

        const { data, error } = await supabase.from('chat_messages').insert({
            from_user: userId,
            to_user: toUser,
            content: content,
            reply_to_id: options?.replyTo,
            attachments: options?.attachments || []
        }).select().single();

        if (error) {
            console.error("Error sending message:", error);
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } else if (data) {
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
    };

    const reactToMessage = async (msgId: string, emoji: string) => {
        setMessages(prev => prev.map(m => {
            if (m.id === msgId) {
                return { ...m, reactions: { ...m.reactions, [userId!]: emoji } };
            }
            return m;
        }));
        const { data: currentMsg } = await supabase.from('chat_messages').select('reactions').eq('id', msgId).single();
        const updatedReactions = { ...currentMsg?.reactions, [userId!]: emoji };
        await supabase.from('chat_messages').update({ reactions: updatedReactions }).eq('id', msgId);
    };

    const pinMessage = async (msgId: string, isPinned: boolean) => {
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isPinned } : m));
        await supabase.from('chat_messages').update({ is_pinned: isPinned }).eq('id', msgId);
    };

    const uploadFile = async (file: File) => {
        if (!userId) return null;
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(filePath, file);
        if (uploadError) {
            console.error('Error uploading file:', uploadError);
            return null;
        }

        const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
        return { url: publicUrl, name: file.name, type: file.type.startsWith('image/') ? 'image' : 'file' };
    };

    return { messages, sendMessage, reactToMessage, pinMessage, uploadFile };
}
