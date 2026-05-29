import React, { memo, useMemo } from 'react';
import Image from 'next/image';
import { ChatMessage } from '@/hooks/data/useOnlineUsers';
import { cn } from '@/lib/utils';
import { Smile, Reply, Pin } from 'lucide-react';

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
  replyTargetName
}: MessageItemProps) {
  const formattedTime = useMemo(
    () => new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    [msg.timestamp]
  );

  return (
    <div
      className={cn(
        'flex flex-col max-w-[85%] group relative mb-2.5 transition-all duration-200',
        isMe ? 'ml-auto items-end' : 'mr-auto items-start'
      )}
    >
      {/* Menu flutuante de ações da mensagem */}
      <div className={cn(
        'absolute -top-3.5 flex items-center gap-0.5 bg-card shadow-md border border-border rounded-lg p-0.5 z-20 opacity-0 group-hover:opacity-100 transition-all duration-150 scale-90 group-hover:scale-100',
        isMe ? 'right-2' : 'left-2'
      )}>
        <button 
          onClick={(e) => { e.stopPropagation(); onReact(msg.id, '👍'); }} 
          type="button"
          className="p-1.5 hover:bg-muted text-muted-foreground hover:text-primary rounded-md transition-colors" 
          title="Curtir"
        >
          <Smile size={12} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onReply(msg); }} 
          type="button"
          className="p-1.5 hover:bg-muted text-muted-foreground hover:text-primary rounded-md transition-colors" 
          title="Responder"
        >
          <Reply size={12} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onPin(msg.id, !msg.isPinned); }} 
          type="button"
          className="p-1.5 hover:bg-muted text-muted-foreground hover:text-amber-500 rounded-md transition-colors" 
          title={msg.isPinned ? 'Desafixar' : 'Fixar'}
        >
          <Pin size={12} className={cn(msg.isPinned ? 'fill-amber-500 text-amber-500' : '')} />
        </button>
      </div>

      {/* Caixa de resposta referenciada */}
      {msg.replyTo && (
        <div className={cn(
          'text-[9px] px-2.5 py-1 rounded-t-lg border-x border-t w-full mb-[-1px] opacity-90 select-none font-bold uppercase tracking-wider',
          isMe 
            ? 'bg-primary/20 text-primary-foreground/90 border-primary/30' 
            : 'bg-muted/70 text-muted-foreground border-border/80'
        )}>
          <div className="flex items-center gap-1 opacity-75 mb-0.5">
            <Reply size={8} />
            <span>
              {replyTargetName || 'Mensagem antiga'}
            </span>
          </div>
          <div className="truncate italic opacity-85 font-mono normal-case">
            &quot;{replyTarget?.content || '...mensagem não encontrada'}&quot;
          </div>
        </div>
      )}

      {/* Balão da Mensagem */}
      <div className={cn(
        'px-3 py-2 rounded-lg text-xs break-words shadow-sm relative transition-all duration-150',
        isMe 
          ? 'bg-primary text-primary-foreground font-semibold rounded-br-none' 
          : 'bg-muted/50 border border-border/80 text-foreground font-semibold rounded-bl-none',
        msg.isPinned && 'ring-1 ring-amber-500/50 bg-amber-500/10 dark:bg-amber-500/15'
      )}>
        {msg.attachments?.map((attachment, index) => (
          <div key={`${attachment.url}-${index}`} className="mb-2 rounded-md overflow-hidden bg-black/5 dark:bg-white/5 border border-border/40 max-w-full">
            {attachment.type === 'image' ? (
              <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block max-w-full">
                <Image
                  src={attachment.url}
                  alt={attachment.name ? `Anexo ${attachment.name}` : 'Anexo de imagem'}
                  width={800}
                  height={480}
                  sizes="(max-width: 768px) 80vw, 240px"
                  className="w-full h-auto max-h-48 object-cover hover:opacity-90 transition-opacity"
                />
              </a>
            ) : (
              <a 
                href={attachment.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 p-2 bg-white/5 hover:bg-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition-colors"
              >
                <div className="p-1.5 bg-muted rounded shadow-sm">📄</div>
                <span className="underline opacity-90 truncate text-[10px]">{attachment.name || 'Anexo'}</span>
              </a>
            )}
          </div>
        ))}

        <p className="leading-normal font-sans font-medium whitespace-pre-wrap">{msg.content}</p>
        
        <div className={cn(
          'text-[9px] mt-1.5 text-right flex items-center justify-end gap-1 font-mono select-none opacity-80',
          isMe ? 'text-primary-foreground/75' : 'text-muted-foreground/60'
        )}>
          {msg.isPinned && <Pin size={8} className="fill-current text-amber-500" />}
          {formattedTime}
        </div>
      </div>

      {/* Reações na base da mensagem */}
      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1 -mb-1 z-10 select-none">
          {Object.entries(msg.reactions).map(([uid, emoji]) => (
            <span 
              key={`${uid}-${emoji}`} 
              className="bg-card border border-border/60 shadow-sm rounded-full px-1.5 py-0.5 text-[9px] animate-in zoom-in-50 duration-100"
            >
              {emoji}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

MessageItem.displayName = 'MessageItem';
