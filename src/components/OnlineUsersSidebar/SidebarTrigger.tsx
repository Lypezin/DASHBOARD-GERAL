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
            className="fixed right-4 bottom-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-xl transition-all duration-300 z-[99999] flex items-center justify-center w-12 h-12 hover:scale-105"
            title={isOpen ? "Fechar" : "Ver Usuários Online"}
        >
            {isOpen ? <ChevronRight size={16} /> : (
                <div className="relative">
                    <Users size={18} className="text-white" />

                    <span className="absolute -bottom-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] text-blue-600 font-bold ring-2 ring-blue-600 z-10">
                        {onlineCount}
                    </span>

                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold ring-2 ring-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}

                    {unreadCount === 0 && (
                        <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 text-[6px] text-white items-center justify-center"></span>
                        </span>
                    )}
                </div>
            )}
        </button>
    );
}
