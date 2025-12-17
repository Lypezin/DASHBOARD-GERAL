export interface OnlineUser {
    id: string;
    email: string | null;
    name: string | null;
    avatar_url: string | null;
    online_at: string;
    role?: string;
    current_tab?: string;
    device?: 'mobile' | 'desktop';
    is_idle?: boolean;
    custom_status?: string;
    last_typed?: string;
    typing_to?: string | null;
}

export interface ChatMessage {
    id: string;
    from: string;
    to: string;
    content: string;
    timestamp: string;
    replyTo?: { id: string, content?: string, fromName?: string };
    reactions?: Record<string, string>;
    attachments?: { url: string, type: 'image' | 'video' | 'file', name: string }[];
    isPinned?: boolean;
    type?: 'text' | 'task_request' | 'system';
}
