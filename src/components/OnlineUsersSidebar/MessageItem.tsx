import React, { memo, useMemo } from 'react';
import Image from 'next/image';
import { ChatMessage } from '@/hooks/data/useOnlineUsers';
import { cn } from '@/lib/utils';
import { Smile, Reply, Pin, Paperclip } from 'lucide-react';

interface MessageItemProps {
  msg: ChatMessage;
  isMe: boolean;
  onReact: (id: string, emoji: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onReply: (msg: ChatMessage) => void;
  replyTarget?: ChatMessage;
  replyTargetName?: string;
}

export const MessageItem = memo(function MessageItem({
  msg,
  isMe,
  onReact,
  onPin,
  onReply,
  replyTarget,
  replyTargetName,
}: MessageItemProps) {
  const formattedTime = useMemo(
    () => new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    [msg.timestamp]
  );

  return (
    <div
      className={cn(
        'group relative mb-3 flex max-w-[86%] flex-col transition-all duration-200',
        isMe ? 'ml-auto items-end' : 'mr-auto items-start'
      )}
    >
      <div className={cn(
        'absolute -top-4 z-20 flex scale-95 items-center gap-0.5 rounded-xl border border-slate-200/80 bg-white/95 p-0.5 opacity-0 shadow-lg transition-all duration-150 group-hover:scale-100 group-hover:opacity-100 dark:border-slate-800/80 dark:bg-slate-950/95',
        isMe ? 'right-2' : 'left-2'
      )}>
        <button
          onClick={(e) => { e.stopPropagation(); onReact(msg.id, '👍'); }}
          type="button"
          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-900"
          title="Curtir"
        >
          <Smile size={12} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onReply(msg); }}
          type="button"
          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-900"
          title="Responder"
        >
          <Reply size={12} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onPin(msg.id, !msg.isPinned); }}
          type="button"
          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-amber-500 dark:text-slate-400 dark:hover:bg-slate-900"
          title={msg.isPinned ? 'Desafixar' : 'Fixar'}
        >
          <Pin size={12} className={cn(msg.isPinned ? 'fill-amber-500 text-amber-500' : '')} />
        </button>
      </div>

      {msg.replyTo ? (
        <div className={cn(
          'mb-[-1px] w-full rounded-t-2xl border-x border-t px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] opacity-95',
          isMe
            ? 'border-blue-400/30 bg-blue-500/15 text-blue-100'
            : 'border-slate-200/80 bg-slate-100/80 text-slate-500 dark:border-slate-800/80 dark:bg-slate-900/80 dark:text-slate-400'
        )}>
          <div className="mb-0.5 flex items-center gap-1 opacity-80">
            <Reply size={9} />
            <span>{replyTargetName || 'Mensagem antiga'}</span>
          </div>
          <div className="truncate font-mono normal-case opacity-85">
            &quot;{replyTarget?.content || 'mensagem não encontrada'}&quot;
          </div>
        </div>
      ) : null}

      <div className={cn(
        'relative rounded-2xl px-3 py-2 text-xs shadow-sm transition-all duration-150',
        isMe
          ? 'rounded-br-md bg-blue-600 text-white'
          : 'rounded-bl-md border border-slate-200/80 bg-white/90 text-slate-800 dark:border-slate-800/80 dark:bg-slate-900/80 dark:text-slate-100',
        msg.isPinned && 'ring-1 ring-amber-500/50'
      )}>
        {msg.attachments?.map((attachment, index) => (
          <div key={`${attachment.url}-${index}`} className="mb-2 max-w-full overflow-hidden rounded-xl border border-slate-200/40 bg-black/5 dark:border-white/10 dark:bg-white/5">
            {attachment.type === 'image' ? (
              <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block max-w-full">
                <Image
                  src={attachment.url}
                  alt={attachment.name ? `Anexo ${attachment.name}` : 'Anexo de imagem'}
                  width={800}
                  height={480}
                  sizes="(max-width: 768px) 80vw, 240px"
                  className="h-auto max-h-48 w-full object-cover transition-opacity hover:opacity-90"
                />
              </a>
            ) : (
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 transition-colors hover:bg-white/10"
              >
                <span className="rounded-lg bg-white/15 p-1.5 shadow-sm">
                  <Paperclip className="h-3.5 w-3.5" />
                </span>
                <span className="truncate text-[10px] underline opacity-90">{attachment.name || 'Anexo'}</span>
              </a>
            )}
          </div>
        ))}

        <p className="whitespace-pre-wrap break-words font-sans font-medium leading-normal">{msg.content}</p>

        <div className={cn(
          'mt-1.5 flex items-center justify-end gap-1 text-right font-mono text-[9px] opacity-75',
          isMe ? 'text-white' : 'text-slate-500 dark:text-slate-400'
        )}>
          {msg.isPinned ? <Pin size={8} className="fill-current text-amber-400" /> : null}
          {formattedTime}
        </div>
      </div>

      {msg.reactions && Object.keys(msg.reactions).length > 0 ? (
        <div className="z-10 mt-1 flex flex-wrap gap-1 select-none">
          {Object.entries(msg.reactions).map(([uid, emoji]) => (
            <span
              key={`${uid}-${emoji}`}
              className="rounded-full border border-slate-200/80 bg-white/95 px-1.5 py-0.5 text-[9px] shadow-sm animate-in zoom-in-50 duration-100 dark:border-slate-800/80 dark:bg-slate-950/95"
            >
              {emoji}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
});

MessageItem.displayName = 'MessageItem';
