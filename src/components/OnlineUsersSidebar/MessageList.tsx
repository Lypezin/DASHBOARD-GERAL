import { ChatMessage, OnlineUser } from '@/hooks/data/useOnlineUsers';
import { CurrentUser } from '@/types';
import { cn } from '@/lib/utils';
import { Smile, Reply, Pin } from 'lucide-react';

interface MessageListProps {
    messages: ChatMessage[];
    currentUser: CurrentUser;
    onReact: (id: string, emoji: string) => void;
    onPin: (id: string, pinned: boolean) => void;
    onReply: (msg: ChatMessage | null) => void;
    onlineUsers: OnlineUser[];
    chatEndRef: React.RefObject<HTMLDivElement>;
}

export function MessageList({ messages, currentUser, onReact, onPin, onReply, onlineUsers, chatEndRef }: MessageListProps) {
    return (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                    <div className="p-3 bg-slate-100 rounded-full">
                        <Smile size={24} className="text-slate-300" />
                    </div>
                    <p className="text-xs">Inicie a conversa!</p>
                </div>
            )}

            {messages.some(m => m.isPinned) && (
                <div className="bg-yellow-50 px-3 py-1 border-b border-yellow-100 flex items-center gap-2 text-[10px] text-yellow-700 sticky top-0 z-10 mb-2 rounded shadow-sm">
                    <Pin size={10} className="fill-yellow-600 text-yellow-600" />
                    <span className="truncate flex-1 font-medium">Mensagens fixadas</span>
                </div>
            )}

            {messages.map((msg, i) => {
                const isMe = msg.from === currentUser.id;

                return (
                    <div
                        key={i}
                        className={cn("flex flex-col max-w-[85%] group relative mb-2", isMe ? "ml-auto items-end" : "mr-auto items-start")}
                    >
                        {/* Action Buttons (CSS Hover) */}
                        <div className={cn(
                            "absolute -top-3 flex items-center gap-0.5 bg-white shadow-sm border border-slate-200 rounded-full p-0.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                            isMe ? "right-0" : "left-0"
                        )}>
                            <button onClick={(e) => { e.stopPropagation(); onReact(msg.id, '👍'); }} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 hover:text-blue-500 transition-colors" title="Curtir">
                                <Smile size={12} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onReply(msg); }} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 hover:text-blue-500 transition-colors" title="Responder">
                                <Reply size={12} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onPin(msg.id, !msg.isPinned); }} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 hover:text-blue-500 transition-colors" title={msg.isPinned ? "Desafixar" : "Fixar"}>
                                <Pin size={12} className={cn(msg.isPinned ? "fill-orange-400 text-orange-400" : "")} />
                            </button>
                        </div>

                        {/* Reply Context */}
                        {msg.replyTo && (
                            <div className={cn("text-[9px] px-2 py-1 rounded-t-lg border-x border-t w-full mb-[-1px] opacity-80",
                                isMe ? "bg-blue-600 text-blue-100 border-blue-500" : "bg-slate-200 text-slate-600 border-slate-300"
                            )}>
                                <div className="flex items-center gap-1 opacity-75 mb-0.5">
                                    <Reply size={8} />
                                    <span className="font-bold">
                                        {(() => {
                                            const replyTarget = messages.find(m => m.id === msg.replyTo?.id);
                                            return replyTarget?.from === currentUser.id ? "Você" :
                                                (replyTarget ? (onlineUsers.find(u => u.id === replyTarget.from)?.name?.split(' ')[0] || "Alguém") : "Mensagem antiga");
                                        })()}
                                    </span>
                                </div>
                                <div className="truncate italic opacity-90">
                                    &quot;{messages.find(m => m.id === msg.replyTo?.id)?.content || "...mensagem não encontrada"}&quot;
                                </div>
                            </div>
                        )}

                        {/* Message Bubble */}
                        <div className={cn("px-3 py-2 rounded-lg text-xs break-words shadow-sm relative",
                            isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-white border border-slate-200 text-slate-700 rounded-bl-none",
                            msg.isPinned && "ring-1 ring-yellow-400 bg-yellow-50/50"
                        )}>
                            {msg.attachments?.map((att, idx) => (
                                <div key={idx} className="mb-2 rounded-md overflow-hidden bg-black/5">
                                    {att.type === 'image' ? (
                                        <a href={att.url} target="_blank" rel="noopener noreferrer">
                                            <img src={att.url} alt="attachment" className="w-full h-auto max-h-48 object-cover hover:opacity-90 transition-opacity" />
                                        </a>
                                    ) : (
                                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-white/10 hover:bg-white/20 transition-colors">
                                            <div className="p-1.5 bg-white/20 rounded">📄</div>
                                            <span className="underline opacity-90 truncate">{att.name || 'Anexo'}</span>
                                        </a>
                                    )}
                                </div>
                            ))}

                            {msg.content}
                            <div className={cn("text-[9px] mt-1 text-right flex items-center justify-end gap-1", isMe ? "text-blue-100" : "text-slate-400")}>
                                {msg.isPinned && <Pin size={8} className="fill-current" />}
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>

                        {/* Reactions */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 -mb-1 z-10">
                                {Object.entries(msg.reactions).map(([uid, emoji], idx) => (
                                    <span key={idx} className="bg-white border border-slate-100 shadow-sm rounded-full px-1 py-0.5 text-[9px]">{emoji}</span>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
            <div ref={chatEndRef} />
        </div>
    );
}
