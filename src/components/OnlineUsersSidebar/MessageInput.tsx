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
    <div className="border-t border-slate-200/80 bg-white/95 p-3 select-none dark:border-slate-800/80 dark:bg-slate-950/95">
      {replyingTo && (
        <div className="flex items-center justify-between rounded-t-xl border border-b-0 border-slate-200 bg-slate-50 p-2 text-[10px] font-bold text-slate-500 select-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <div className="flex items-center gap-2 overflow-hidden">
            <Reply size={12} className="shrink-0 text-primary" />
            <span className="truncate max-w-[200px] border-l-2 border-primary/40 pl-2 italic font-mono normal-case">
              {replyingTo.content}
            </span>
          </div>
          <button 
            onClick={() => setReplyingTo(null)} 
            type="button"
            className="rounded p-0.5 transition-colors hover:bg-slate-200/70 focus:outline-none dark:hover:bg-slate-800"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <form 
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
        className={cn('flex items-center gap-2', replyingTo && 'rounded-b-xl border border-t-0 border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900')}
      >
        <button
          type="button"
          className="rounded-xl p-2 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-950 focus:outline-none dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
          onClick={() => fileInputRef.current?.click()}
          title="Enviar Imagem/Arquivo"
        >
          <ImageIcon size={18} />
        </button>
        
        <div className="flex-1 relative">
          <textarea
            className={cn(
              "subtle-scrollbar max-h-24 w-full resize-none rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 pr-2 text-xs text-slate-900 placeholder:text-slate-400 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500",
              "transition-all duration-150 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
          className="shrink-0 rounded-xl bg-blue-600 p-2.5 text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight size={16} className="stroke-[3]" />
        </button>
      </form>
    </div>
  );
}

export const MessageInput = memo(MessageInputComponent);
export default MessageInput;
