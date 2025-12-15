import { useState, useEffect, useRef } from 'react';
import { useOnlineUsers, OnlineUser } from '@/hooks/useOnlineUsers';
import { CurrentUser } from '@/types';
import { cn } from '@/lib/utils';
import { Users, ChevronLeft, ChevronRight, User as UserIcon, Monitor, Smartphone, Clock, Coffee } from 'lucide-react';

interface OnlineUsersSidebarProps {
    currentUser: CurrentUser | null;
    currentTab: string;
}

export function OnlineUsersSidebar({ currentUser, currentTab }: OnlineUsersSidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    // Agora o hook retorna um objeto completo
    const { onlineUsers, setCustomStatus, joinedUsers, clearJoinedUsers, messages, sendMessage } = useOnlineUsers(currentUser, currentTab);
    const [searchTerm, setSearchTerm] = useState('');
    const [myCustomStatus, setMyCustomStatus] = useState('');
    const [notifications, setNotifications] = useState<{ id: string, message: string }[]>([]);

    // Chat State
    const [activeChatUser, setActiveChatUser] = useState<OnlineUser | null>(null);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const prevMessagesLengthRef = useRef(messages.length);

    // Track unread messages
    useEffect(() => {
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

    const handleSendMessage = async () => {
        if (!chatInput.trim() || !activeChatUser) return;
        await sendMessage(activeChatUser.id, chatInput);
        setChatInput('');
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
                "fixed right-0 top-20 z-40 h-[calc(100vh-6rem)] transition-transform duration-300 ease-in-out bg-white shadow-lg border-l border-slate-200 rounded-l-xl flex flex-col w-80",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}
        >
            {/* Chat Window (Popup to the left of sidebar) */}
            {activeChatUser && (
                <div className="absolute top-0 -left-64 w-60 h-80 bg-white shadow-xl border border-slate-200 rounded-lg flex flex-col z-50 overflow-hidden animate-in slide-in-from-right-5">
                    {/* Chat Header */}
                    <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <span className={cn("absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white", activeChatUser.is_idle ? "bg-amber-400" : "bg-emerald-500")} />
                                {activeChatUser.avatar_url ? (
                                    <img src={activeChatUser.avatar_url} alt="Avatar" className="w-6 h-6 rounded-full" />
                                ) : <UserIcon className="w-6 h-6 p-1 bg-slate-200 rounded-full" />}
                            </div>
                            <span className="text-xs font-semibold truncate max-w-[100px]">{activeChatUser.name?.split(' ')[0]}</span>
                        </div>
                        <button onClick={() => setActiveChatUser(null)} className="text-slate-400 hover:text-slate-600">×</button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50/30">
                        {activeMessages.length === 0 && (
                            <p className="text-[10px] text-center text-slate-400 mt-4">Envie um &quot;Olá&quot; 👋</p>
                        )}
                        {activeMessages.map((msg, i) => (
                            <div key={i} className={cn("flex flex-col max-w-[85%]", msg.from === currentUser.id ? "ml-auto items-end" : "mr-auto items-start")}>
                                <div className={cn("px-2 py-1 rounded-lg text-xs break-words",
                                    msg.from === currentUser.id ? "bg-blue-500 text-white rounded-br-none" : "bg-white border border-slate-200 text-slate-700 rounded-bl-none"
                                )}>
                                    {msg.content}
                                </div>
                                <span className="text-[9px] text-slate-300 mt-0.5">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-2 border-t border-slate-100 bg-white">
                        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-1">
                            <input
                                className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                                placeholder="Digite..."
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                            />
                            <button type="submit" className="bg-blue-500 text-white rounded p-1 hover:bg-blue-600">
                                <ChevronRight size={14} />
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

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute -left-10 top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-l-lg p-2 shadow-sm hover:bg-slate-50 transition-colors z-50 flex items-center justify-center w-10 h-10"
                title={isOpen ? "Fechar" : "Ver Usuários Online"}
            >
                {isOpen ? <ChevronRight size={16} /> : (
                    <div className="relative">
                        <Users size={18} className="text-blue-600" />
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
                                                            className="p-1 hover:bg-slate-100 rounded-full text-slate-300 hover:text-blue-500 transition-colors"
                                                            title="Enviar mensagem"
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
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
            {isOpen && (
                <div className="p-2 text-center border-t border-slate-100 text-[10px] text-slate-300 bg-slate-50/50 rounded-bl-xl">
                    Atualizado em tempo real
                </div>
            )}
        </div>
    );
}
