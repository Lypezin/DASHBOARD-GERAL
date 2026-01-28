import { ChatMessage, OnlineUser } from '@/hooks/data/useOnlineUsers';
import { CurrentUser } from '@/types';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface ChatWindowProps {
    currentUser: CurrentUser;
    activeChatUser: OnlineUser;
    setActiveChatUser: (u: OnlineUser | null) => void;
    messages: ChatMessage[];
    onReact: (id: string, emoji: string) => void;
    onPin: (id: string, pinned: boolean) => void;
    onReply: (msg: ChatMessage | null) => void;
    chatEndRef: React.RefObject<HTMLDivElement>;
    chatInput: string;
    setChatInput: (v: string) => void;
    handleSendMessage: () => void;
    replyingTo: ChatMessage | null;
    fileInputRef: React.RefObject<HTMLInputElement>;
    onlineUsers: OnlineUser[];
    setTypingTo: (id: string) => void;
}

export function ChatWindow({
    currentUser, activeChatUser, setActiveChatUser, messages,
    onReact, onPin, onReply, chatEndRef,
    chatInput, setChatInput, handleSendMessage, replyingTo,
    fileInputRef, onlineUsers, setTypingTo
}: ChatWindowProps) {
    if (!activeChatUser) return null;

    return (
        <div className="absolute top-0 -left-80 w-80 h-[500px] bg-white shadow-xl border border-slate-200 rounded-lg flex flex-col z-[120] overflow-hidden animate-in slide-in-from-right-5 font-sans">
            <ChatHeader activeChatUser={activeChatUser} currentUser={currentUser} onClose={() => setActiveChatUser(null)} />

            <MessageList
                messages={messages}
                currentUser={currentUser}
                onReact={onReact}
                onPin={onPin}
                onReply={onReply}
                onlineUsers={onlineUsers}
                chatEndRef={chatEndRef}
            />

            <MessageInput
                chatInput={chatInput}
                setChatInput={setChatInput}
                handleSendMessage={handleSendMessage}
                replyingTo={replyingTo}
                setReplyingTo={onReply}
                fileInputRef={fileInputRef}
                setTypingTo={setTypingTo}
                activeUserId={activeChatUser.id}
            />
        </div>
    );
}
