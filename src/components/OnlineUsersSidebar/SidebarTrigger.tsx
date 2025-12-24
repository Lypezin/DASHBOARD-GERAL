import { Users } from 'lucide-react';
import { ChevronRight } from 'lucide-react';

interface SidebarTriggerProps {
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    onlineCount: number;
    unreadCount: number;
}

export function SidebarTrigger({ isOpen, setIsOpen, onlineCount, unreadCount }: SidebarTriggerProps) {
    return (
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="fixed right-4 bottom-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-2xl transition-all duration-300 z-[99999] flex items-center justify-center w-14 h-14 hover:scale-105 active:scale-95 border-4 border-white dark:border-slate-900"
            title={isOpen ? "Fechar" : "Ver Usuários Online"}
        >
            {isOpen ? <ChevronRight size={20} /> : (
                <div className="relative flex items-center justify-center w-full h-full">
                    <Users size={22} className="text-white" />

                    {/* Contador de Usuários Online (Bottom-Left) */}
                    <span className="absolute -bottom-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] text-blue-600 font-bold ring-2 ring-gray-100 shadow-sm z-10" title={`${onlineCount} online`}>
                        {onlineCount}
                    </span>

                    {/* Contador de Mensagens não lidas (Top-Right) */}
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[11px] text-white font-extrabold ring-4 ring-white dark:ring-slate-900 shadow-md z-20 animate-in zoom-in duration-300">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}

                    {unreadCount === 0 && (
                        <span className="absolute top-0 right-0 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
                        </span>
                    )}
                </div>
            )}
        </button>
    );
}
