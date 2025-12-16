import { useState, useEffect, useRef } from 'react';
import { useOnlineUsers, OnlineUser, ChatMessage } from '@/hooks/useOnlineUsers';
import { CurrentUser } from '@/types';
import { cn } from '@/lib/utils';
import { Users, ChevronLeft, ChevronRight, User as UserIcon, Monitor, Smartphone, Clock, Coffee, Smile, Pin, Reply, MoreHorizontal, Image, X } from 'lucide-react';

interface OnlineUsersSidebarProps {
    currentUser: CurrentUser | null;
    currentTab: string;
}

export function OnlineUsersSidebar({ currentUser, currentTab }: OnlineUsersSidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    // Hook updated with new functions
    const { onlineUsers, setCustomStatus, joinedUsers, clearJoinedUsers, messages, sendMessage, setTypingTo, reactToMessage, pinMessage, uploadFile } = useOnlineUsers(currentUser, currentTab);
    const [searchTerm, setSearchTerm] = useState('');
    const [myCustomStatus, setMyCustomStatus] = useState('');
    const [notifications, setNotifications] = useState<{ id: string, message: string }[]>([]);

    // Chat State
    const [activeChatUser, setActiveChatUser] = useState<OnlineUser | null>(null);
    const [chatInput, setChatInput] = useState('');
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const prevMessagesLengthRef = useRef(messages.length);
    const initialLoadRef = useRef(true);

    // Track unread messages
    useEffect(() => {
        // Skip the initial load of messages (history) to prevent ghost notifications on F5
        if (initialLoadRef.current && messages.length > 0) {
            prevMessagesLengthRef.current = messages.length;
            initialLoadRef.current = false;
            return;
        }

        if (messages.length > prevMessagesLengthRef.current) {
            const newMsgs = messages.slice(prevMessagesLengthRef.current);
            newMsgs.forEach(msg => {
                // Se a mensagem não fui eu que mandei E (o chat não está aberto OU está aberto com outra pessoa)
                if (msg.from !== currentUser?.id && (activeChatUser?.id !== msg.from)) {
                    setUnreadCounts(prev => ({
                        ...prev,
                        [msg.from]: (prev[msg.from] || 0) + 1
                    }));

                    // Opcional: Tocar um som
                }
            });
        }
        prevMessagesLengthRef.current = messages.length;
    }, [messages, activeChatUser, currentUser?.id]);

    // Clear unread when opening chat
    useEffect(() => {
        if (activeChatUser) {
            setUnreadCounts(prev => {
                const newCounts = { ...prev };
                delete newCounts[activeChatUser.id];
                return newCounts;
            });
        }
    }, [activeChatUser]);

    // Scroll to bottom of chat
    useEffect(() => {
        if (activeChatUser && chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, activeChatUser]);

    // Effect to process joinedUsers
    useEffect(() => {
        if (joinedUsers.length > 0) {
            const newNotifs = joinedUsers.map(u => ({
                id: Math.random().toString(36),
                message: `${u.name?.split(' ')[0]} entrou!`
            }));

            setNotifications(prev => [...prev, ...newNotifs]);
            clearJoinedUsers();

            // Auto-dismiss logic
            setTimeout(() => {
                setNotifications(prev => prev.slice(newNotifs.length));
            }, 3000);
        }
    }, [joinedUsers, clearJoinedUsers]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeChatUser) return;

        // Optimistically show uploading? For now just await
        const upload = await uploadFile(file);

        if (upload) {
            await sendMessage(activeChatUser.id, "", {
                attachments: [upload]
            });
        }

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim() || !activeChatUser) return;
        await sendMessage(activeChatUser.id, chatInput, {
            replyTo: replyingTo?.id
        });
        setChatInput('');
        setReplyingTo(null);
    };

    // Filter messages for active chat
    const activeMessages = activeChatUser
        ? messages.filter(m => (m.from === activeChatUser.id && m.to === currentUser?.id) || (m.from === currentUser?.id && m.to === activeChatUser.id))
        : [];

    // 1. Filter and Group Users
    const filteredUsers = onlineUsers.filter((u: OnlineUser) =>
    (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const groupedUsers = {
        admin: filteredUsers.filter((u: OnlineUser) => u.role === 'admin' || u.role === 'master'),
        marketing: filteredUsers.filter((u: OnlineUser) => u.role === 'marketing'),
        user: filteredUsers.filter((u: OnlineUser) => u.role === 'user' || !u.role || (u.role !== 'admin' && u.role !== 'master' && u.role !== 'marketing'))
    };

    const hasUsers = filteredUsers.length > 0;

    // Helper para formatar tempo online
    const formatTimeOnline = (dateString: string) => {
        const start = new Date(dateString).getTime();
        const now = new Date().getTime();
        const diff = Math.floor((now - start) / 1000 / 60); // minutos

        if (diff < 60) return `${diff}m`;
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;
        return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
    };

    const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

    // Forçar re-render a cada minuto para atualizar os contadores de tempo
    const [_, setTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 60000);
        return () => clearInterval(interval);
    }, []);

    if (!currentUser) return null;

    return (
        <div
            className={cn(
                "fixed right-0 top-20 z-[100] h-[calc(100vh-6rem)] transition-transform duration-300 ease-in-out bg-white shadow-lg border-l border-slate-200 rounded-l-xl flex flex-col w-80",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}
        >
            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
            />

            {/* Chat Window (Popup to the left of sidebar) */}
            {activeChatUser && (
                <div className="absolute top-0 -left-80 w-80 h-[500px] bg-white shadow-xl border border-slate-200 rounded-lg flex flex-col z-[120] overflow-hidden animate-in slide-in-from-right-5 font-sans">
                    {/* Chat Header */}
                    <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm z-10">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <span className={cn("absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white", activeChatUser.is_idle ? "bg-amber-400" : "bg-emerald-500")} />
                                {activeChatUser.avatar_url ? (
                                    <img src={activeChatUser.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                                ) : <UserIcon className="w-8 h-8 p-1.5 bg-slate-100 rounded-full text-slate-500" />}
                            </div>
                            <div className="leading-tight">
                                <span className="text-sm font-bold text-slate-800 block">{activeChatUser.name?.split(' ')[0]}</span>
                                <span className="text-[10px] text-slate-500 block">
                                    {activeChatUser.typing_to === currentUser.id ? <span className="text-blue-500 animate-pulse font-medium">digitando...</span> : (activeChatUser.is_idle ? 'Ausente' : 'Online')}
                                </span>
                            </div>
                        </div>
                        <button onClick={() => setActiveChatUser(null)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors"><X size={16} /></button>
                    </div>

                    {/* Pinned Messages Header (if any) */}
                    {activeMessages.some(m => m.isPinned) && (
                        <div className="bg-yellow-50 px-3 py-1 border-b border-yellow-100 flex items-center gap-2 text-[10px] text-yellow-700">
                            <Pin size={10} className="fill-yellow-600 text-yellow-600" />
                            <span className="truncate flex-1 font-medium">Mensagens fixadas</span>
                        </div>
                    )}

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50">
                        {activeMessages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                                <div className="p-3 bg-slate-100 rounded-full">
                                    <Smile size={24} className="text-slate-300" />
                                </div>
                                <p className="text-xs">Inicie a conversa!</p>
                            </div>
                        )}
                        {activeMessages.map((msg, i) => {
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
                                        <button
                                            onClick={(e) => { e.stopPropagation(); reactToMessage(msg.id, '👍'); }}
                                            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 hover:text-blue-500 transition-colors"
                                            title="Curtir"
                                        >
                                            <Smile size={12} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); }}
                                            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 hover:text-blue-500 transition-colors"
                                            title="Responder"
                                        >
                                            <Reply size={12} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); pinMessage(msg.id, !msg.isPinned); }}
                                            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 hover:text-blue-500 transition-colors"
                                            title={msg.isPinned ? "Desafixar" : "Fixar"}
                                        >
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
                                        {/* Attachment Rendering */}
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
                                        {/* Timestamp & Checks */}
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

                    {/* Input Area */}
                    <div className="p-3 border-t border-slate-100 bg-white">
                        {/* Reply Preview */}
                        {replyingTo && (
                            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 border-b-0 rounded-t-lg p-2 text-xs text-slate-600">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Reply size={12} className="shrink-0 text-blue-500" />
                                    <span className="truncate max-w-[200px] border-l-2 border-blue-300 pl-2 italic">
                                        {replyingTo.content}
                                    </span>
                                </div>
                                <button onClick={() => setReplyingTo(null)} className="hover:bg-slate-200 rounded p-0.5"><X size={12} /></button>
                            </div>
                        )}

                        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className={cn("flex gap-2 items-end", replyingTo && "bg-slate-50 p-2 rounded-b-lg border border-slate-200 border-t-0")}>
                            <button
                                type="button"
                                className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                                title="Enviar Imagem/Arquivo"
                            >
                                <Image size={18} />
                            </button>
                            <div className="flex-1 relative">
                                <textarea
                                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 pr-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none max-h-24 scrollbar-hide bg-slate-50/50"
                                    placeholder="Digite uma mensagem..."
                                    rows={1}
                                    value={chatInput}
                                    onChange={e => {
                                        setChatInput(e.target.value);
                                        setTypingTo(activeChatUser.id);
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!chatInput.trim()}
                                className="bg-blue-600 text-white rounded-lg p-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Notifications (Toast) */}
            <div className="absolute top-4 left-0 -translate-x-full pr-4 flex flex-col gap-2 pointer-events-none">
                {notifications.map(n => (
                    <div key={n.id} className="bg-slate-800 text-white text-xs px-3 py-2 rounded shadow-lg animate-in fade-in slide-in-from-right-5 whitespace-nowrap">
                        {n.message} 🥳
                    </div>
                ))}
            </div>

            {/* Toggle Button - Fixed position for better visibility */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed right-4 bottom-20 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-xl transition-all duration-300 z-[100] flex items-center justify-center w-12 h-12 hover:scale-105"
                title={isOpen ? "Fechar" : "Ver Usuários Online"}
            >
                {isOpen ? <ChevronRight size={16} /> : (
                    <div className="relative">
                        <Users size={18} className="text-blue-600" />

                        {/* Global Count Badge */}
                        <span className="absolute -bottom-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] text-white font-bold ring-2 ring-white z-10">
                            {onlineUsers.length}
                        </span>
                        {/* Red Dot (Total Unread) */}
                        {totalUnread > 0 && (
                            <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold ring-2 ring-white">
                                {totalUnread > 9 ? '9+' : totalUnread}
                            </span>
                        )}
                        {/* Pulse dot if no unread but open? No. Original pulse was here */}
                        {totalUnread === 0 && (
                            <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 text-[6px] text-white items-center justify-center"></span>
                            </span>
                        )}
                    </div>
                )}
            </button>

            {/* Header & Search */}
            <div className="p-4 border-b border-slate-100 flex flex-col gap-3 bg-slate-50/50 rounded-tl-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="bg-blue-100 p-2 rounded-lg shrink-0">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        {isOpen && (
                            <div className="min-w-0">
                                <h3 className="font-semibold text-slate-800 text-sm truncate">Online</h3>
                                <p className="text-xs text-slate-500 truncate">{onlineUsers.length} usuário(s)</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Search Bar & Status - Only visible when open */}
                {isOpen && (
                    <div className="space-y-2">
                        {/* Search */}
                        <input
                            type="text"
                            placeholder="Buscar usuário..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-400 bg-white"
                        />

                        {/* Status Setter */}
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1.5 px-2">
                            <Coffee size={12} className="text-slate-400 shrink-0" />
                            <input
                                type="text"
                                placeholder="Definir status (ex: Almoçando)"
                                value={myCustomStatus}
                                onChange={(e) => setMyCustomStatus(e.target.value)}
                                className="w-full text-[10px] focus:outline-none bg-transparent"
                                onBlur={() => setCustomStatus(myCustomStatus)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setCustomStatus(myCustomStatus);
                                        e.currentTarget.blur();
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">

                {/* Groups */}
                {['admin', 'marketing', 'user'].map((group) => {
                    const usersInGroup = groupedUsers[group as keyof typeof groupedUsers];
                    if (usersInGroup.length === 0) return null;

                    return (
                        <div key={group} className="space-y-2">
                            {/* Header do Grupo */}
                            {isOpen && usersInGroup.length > 0 && (
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase px-2 tracking-wider">
                                    {group === 'user' ? 'Geral' : group} ({usersInGroup.length})
                                </h4>
                            )}

                            {usersInGroup.map((user: OnlineUser) => (
                                <div
                                    key={user.id}
                                    className={cn(
                                        "group flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100",
                                        !isOpen && "justify-center px-0 py-3"
                                    )}
                                >
                                    {/* Avatar & Status */}
                                    <div className="relative shrink-0">
                                        {user.avatar_url ? (
                                            <img
                                                src={user.avatar_url}
                                                alt={user.name || 'User'}
                                                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm">
                                                <UserIcon className="w-5 h-5 text-slate-400" />
                                            </div>
                                        )}

                                        {/* Status Dot */}
                                        <span
                                            className={cn(
                                                "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white",
                                                user.is_idle ? "bg-amber-400" : "bg-emerald-500"
                                            )}
                                            title={user.is_idle ? "Ausente (Inativo)" : "Online"}
                                        />

                                        {/* Unread Badge (Individual) */}
                                        {unreadCounts[user.id] > 0 && (
                                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold ring-2 ring-white animate-bounce">
                                                {unreadCounts[user.id] > 9 ? '9+' : unreadCounts[user.id]}
                                            </span>
                                        )}
                                    </div>

                                    {/* Info Area (Visible only when open) */}
                                    {isOpen && (
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium text-sm text-slate-700 truncate" title={user.name || ''}>
                                                    {user.name}
                                                </p>
                                                <div className="flex items-center gap-1">
                                                    {/* Chat Button - Only show for others */}
                                                    {user.id !== currentUser.id && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setActiveChatUser(user); setIsOpen(true); }}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md transition-colors text-xs font-medium"
                                                            title="Enviar mensagem"
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                                                            Chat
                                                        </button>
                                                    )}

                                                    <div className="text-slate-300">
                                                        {user.device === 'mobile' ? (
                                                            <span title="Mobile">
                                                                <Smartphone size={14} className="text-slate-400" />
                                                            </span>
                                                        ) : (
                                                            <span title="Desktop">
                                                                <Monitor size={14} className="text-slate-400" />
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Role & Status Label */}
                                            <div className="flex items-center gap-2 mt-1">
                                                {user.custom_status ? (
                                                    <span className="text-xs text-slate-500 italic truncate flex items-center gap-1">
                                                        <Coffee size={10} /> {user.custom_status}
                                                    </span>
                                                ) : (
                                                    <span className={cn("text-xs truncate", user.is_idle ? "text-amber-500" : "text-emerald-600")}>
                                                        {user.is_idle ? 'Ausente' : 'Disponível'}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Location (Tab) */}
                                            {user.current_tab && (
                                                <div className="flex items-center gap-1 mt-1 text-xs text-blue-500">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                                    <span className="truncate">
                                                        {user.current_tab.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Time Online */}
                                            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 ml-0.5">
                                                <Clock size={10} />
                                                <span>{formatTimeOnline(user.online_at)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                })}

                {!hasUsers && isOpen && (
                    <div className="text-center p-4 text-slate-400 text-sm">
                        Ninguém encontrado... 👻
                    </div>
                )}
            </div>

            {/* Footer info */}
            {
                isOpen && (
                    <div className="p-2 text-center border-t border-slate-100 text-[10px] text-slate-300 bg-slate-50/50 rounded-bl-xl">
                        Atualizado em tempo real
                    </div>
                )
            }
        </div >
    );
}
