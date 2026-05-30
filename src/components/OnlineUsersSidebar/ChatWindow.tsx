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
    <div className="absolute top-0 -left-[340px] z-[9999] flex h-[520px] w-[330px] flex-col overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white/95 font-sans shadow-[0_28px_90px_-36px_rgba(15,23,42,0.48)] backdrop-blur-xl transition-all duration-200 animate-in fade-in-50 slide-in-from-right-4 dark:border-slate-800/80 dark:bg-slate-950/95 dark:shadow-black/50">
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

export const ChatWindow = memo(ChatWindowComponent);
export default ChatWindow;
