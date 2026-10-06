import { memo } from 'react';
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
  setTypingTo: (id: string | null) => void;
}

function ChatWindowComponent({
  currentUser, activeChatUser, setActiveChatUser, messages,
  onReact, onPin, onReply, chatEndRef,
  chatInput, setChatInput, handleSendMessage, replyingTo,
  fileInputRef, onlineUsers, setTypingTo
}: ChatWindowProps) {
  if (!activeChatUser) return null;

  return (
    <section aria-label={`Conversa com ${activeChatUser.name || 'pessoa da equipe'}`} className="absolute inset-0 z-[9999] flex min-h-0 flex-col overflow-hidden border border-slate-200 bg-white font-sans shadow-[-12px_0_38px_rgba(15,23,42,0.14)] motion-safe:animate-in motion-safe:fade-in-50 motion-safe:duration-200 motion-reduce:animate-none dark:border-slate-800 dark:bg-slate-950 lg:inset-y-0 lg:left-[calc(-22rem-0.75rem)] lg:right-auto lg:h-full lg:w-[22rem] lg:rounded-2xl">
      <ChatHeader 
        activeChatUser={activeChatUser} 
        currentUser={currentUser} 
        onClose={() => setActiveChatUser(null)} 
      />

      <MessageList
        messages={messages}
        currentUser={currentUser}
        onReact={onReact}
        onPin={onPin}
        onReply={onReply}
        onlineUsers={onlineUsers}
        chatEndRef={chatEndRef}
        conversationName={activeChatUser.name?.split(' ')[0] || 'esta pessoa'}
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
    </section>
  );
}

export const ChatWindow = memo(ChatWindowComponent);
export default ChatWindow;
