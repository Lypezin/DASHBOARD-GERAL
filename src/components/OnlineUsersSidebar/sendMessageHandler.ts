import { toast } from 'sonner';

interface SendMessageHandlerParams {
    chatInput: string;
    activeChatUser: { id: string; name?: string | null } | null;
    replyingTo: { id: string } | null;
    sendMessage: (userId: string, message: string, options?: { replyTo?: string }) => void;
    setChatInput: (value: string) => void;
    setReplyingTo: (value: null) => void;
    clearTyping?: () => void;
}

export function createSendMessageHandler({
    chatInput,
    activeChatUser,
    replyingTo,
    sendMessage,
    setChatInput,
    setReplyingTo,
    clearTyping
}: SendMessageHandlerParams) {
    return () => {
        if (!chatInput.trim() || !activeChatUser) return;

        sendMessage(activeChatUser.id, chatInput, {
            replyTo: replyingTo?.id
        });

        setChatInput('');
        setReplyingTo(null);
        clearTyping?.();

        toast.success(`Mensagem enviada para ${activeChatUser.name?.split(' ')[0]}`);
    };
}
