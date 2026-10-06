import { ChatMessage } from '@/hooks/data/useOnlineUsers';
import { Paperclip, Send, Reply, X } from 'lucide-react';
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
    <div className="border-t border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-950">
      {replyingTo && (
        <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <div className="flex items-center gap-2 overflow-hidden">
            <Reply size={12} className="shrink-0 text-primary" />
            <span className="max-w-[230px] truncate border-l-2 border-primary/40 pl-2 italic">
              {replyingTo.content}
            </span>
          </div>
          <button 
            onClick={() => setReplyingTo(null)} 
            type="button"
            className="rounded-md p-1 transition-colors hover:bg-slate-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:hover:bg-slate-800"
            aria-label="Cancelar resposta"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <form 
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
        className={cn('flex items-end gap-2', replyingTo && 'rounded-b-lg border border-t-0 border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900')}
      >
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
          onClick={() => fileInputRef.current?.click()}
          title="Anexar imagem ou arquivo"
          aria-label="Anexar imagem ou arquivo"
        >
          <Paperclip size={17} aria-hidden="true" />
        </button>
        
        <div className="flex-1 relative">
          <textarea
            className={cn(
              "subtle-scrollbar min-h-10 max-h-28 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] leading-5 text-slate-900 placeholder:text-slate-400 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500",
              "transition-colors duration-150 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            )}
            aria-label="Escreva uma mensagem"
            placeholder="Escreva uma mensagem..."
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
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-[background-color,transform] hover:bg-primary/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          aria-label="Enviar mensagem"
        >
          <Send size={16} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}

export const MessageInput = memo(MessageInputComponent);
export default MessageInput;
