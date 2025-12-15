import React, { useState } from 'react';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { CurrentUser } from '@/types';
import { Users, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn utility exists, usually common in shadcn structure

interface OnlineUsersSidebarProps {
    currentUser: CurrentUser | null;
}

export function OnlineUsersSidebar({ currentUser }: OnlineUsersSidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const onlineUsers = useOnlineUsers(currentUser);

    // Se não estiver logado, não mostra nada
    if (!currentUser) return null;

    return (
        <>
            {/* Botão Flutuante (quando fechado) */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-white dark:bg-slate-800 border-l border-t border-b border-slate-200 dark:border-slate-700 shadow-lg p-2 rounded-l-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex flex-col items-center gap-1 group"
                    title="Usuários Online"
                >
                    <div className="relative">
                        <Users className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {onlineUsers.length}
                    </span>
                    <ChevronLeft className="w-3 h-3 text-slate-400 mt-1" />
                </button>
            )}

            {/* Sidebar (quando aberta) */}
            <div
                className={cn(
                    "fixed right-0 top-0 h-full w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-lg">
                            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Online</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{onlineUsers.length} usuário(s)</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {onlineUsers.map((user) => (
                        <div
                            key={user.id}
                            className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                        >
                            <div className="relative flex-shrink-0">
                                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                    <User className="w-4 h-4" />
                                </div>
                                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 bg-emerald-500" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                                    {user.name}
                                </p>
                                <div className="flex items-center gap-1.5">
                                    {user.role && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wide border border-slate-200 dark:border-slate-700">
                                            {user.role}
                                        </span>
                                    )}
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate flex items-center gap-1">
                                        Online
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {onlineUsers.length === 0 && (
                        <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                            Ninguém online... espere, você deve estar online!
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-[10px] text-center text-slate-400">
                    Atualizado em tempo real
                </div>
            </div>
        </>
    );
}
