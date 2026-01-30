import { supabase } from '@/lib/supabaseClient';
import { ChatMessage } from '../types';

export const chatService = {
    async fetchHistory(userId: string) {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('id, from_user, to_user, content, created_at, reply_to_id, reactions, attachments, is_pinned, type')
            .or(`from_user.eq.${userId},to_user.eq.${userId}`)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error || !data) throw error;

        return data.map(m => ({
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
    },

    async sendMessage(userId: string, toUser: string, content: string, options?: { replyTo?: string, attachments?: any[] }) {
        const { data, error } = await supabase.from('chat_messages').insert({
            from_user: userId,
            to_user: toUser,
            content: content,
            reply_to_id: options?.replyTo,
            attachments: options?.attachments || []
        }).select().single();

        if (error) throw error;
        return data;
    },

    async reactToMessage(msgId: string, userId: string, emoji: string) {
        const { error } = await supabase.rpc('toggle_chat_reaction', {
            message_id: msgId,
            emoji: emoji
        });

        if (error) throw error;
    },

    async pinMessage(msgId: string, isPinned: boolean) {
        await supabase.from('chat_messages').update({ is_pinned: isPinned }).eq('id', msgId);
    },

    async uploadFile(userId: string, file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
        return { url: publicUrl, name: file.name, type: file.type.startsWith('image/') ? 'image' : 'file' };
    }
};
