import { ChatMessage } from '@/hooks/data/useOnlineUsers';
import { Image as ImageIcon, ChevronRight, Reply, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import React, { memo, useEffect, useRef } from 'react';

interface MessageInputProps {
  chatInput: string;
  setChatInput: (v: string) => void;
  handleSendMessage: () => void;
  replyingTo: ChatMessage | null;
  setReplyingTo: (msg: ChatMessage | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  setTypingTo: (id: string | null) => void;
  activeUserId: string;
}

function MessageInputComponent({
  chatInput, setChatInput, handleSendMessage, replyingTo,
  setReplyingTo, fileInputRef, setTypingTo, activeUserId
}: MessageInputProps) {
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const scheduleTypingUpdate = (value: string) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
      setTypingTo(null);
      return;
    }

    typingTimeoutRef.current = setTimeout(() => {
      setTypingTo(activeUserId);
    }, 180);
  };

  return (
    <div className="p-3 border-t border-border bg-card/95 select-none">
      {replyingTo && (
        <div className="flex items-center justify-between bg-muted border border-border border-b-0 rounded-t-lg p-2 text-[10px] font-bold text-muted-foreground select-none">
          <div className="flex items-center gap-2 overflow-hidden">
            <Reply size={12} className="shrink-0 text-primary" />
            <span className="truncate max-w-[200px] border-l-2 border-primary/40 pl-2 italic font-mono normal-case">
              {replyingTo.content}
            </span>
          </div>
          <button 
            onClick={() => setReplyingTo(null)} 
            type="button"
            className="hover:bg-muted-foreground/10 rounded p-0.5 transition-colors focus:outline-none"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <form 
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
        className={cn('flex gap-2 items-center', replyingTo && 'bg-muted p-2 rounded-b-lg border border-border border-t-0')}
      >
        <button
          type="button"
          className="p-2 text-muted-foreground/60 hover:text-foreground hover:bg-muted rounded-lg transition-all focus:outline-none"
          onClick={() => fileInputRef.current?.click()}
          title="Enviar Imagem/Arquivo"
        >
          <ImageIcon size={18} />
        </button>
        
        <div className="flex-1 relative">
          <textarea
            className={cn(
              "w-full text-xs border border-border rounded-lg px-3 py-2 pr-2 resize-none max-h-24 subtle-scrollbar bg-muted/20 text-foreground placeholder:text-muted-foreground/50",
              "focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all duration-150"
            )}
            placeholder="Digite uma mensagem..."
            rows={1}
            value={chatInput}
            onChange={e => {
              const nextValue = e.target.value;
              setChatInput(nextValue);
              scheduleTypingUpdate(nextValue);
            }}
            onBlur={() => {
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }
              setTypingTo(null);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }
                handleSendMessage();
              }
            }}
          />
        </div>
        
        <button
          type="submit"
          disabled={!chatInput.trim()}
          className="bg-primary text-primary-foreground rounded-lg p-2.5 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 shrink-0"
        >
          <ChevronRight size={16} className="stroke-[3]" />
        </button>
      </form>
    </div>
  );
}

export const MessageInput = memo(MessageInputComponent);
export default MessageInput;
