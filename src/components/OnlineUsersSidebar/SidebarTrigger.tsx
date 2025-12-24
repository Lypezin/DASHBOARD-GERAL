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
            className="fixed right-4 bottom-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all duration-300 z-[99999] flex items-center justify-center w-14 h-14 hover:scale-110 active:scale-95 shadow-2xl border-[3px] border-white dark:border-slate-800"
            title={isOpen ? "Fechar" : "Ver Usuários Online"}
        >
            {isOpen ? <ChevronRight size={24} /> : (
                <div className="relative w-full h-full flex items-center justify-center">
                    <Users size={24} className="text-white drop-shadow-md" />

                    {/* Contador de Usuários Online (Bottom-Left - Pequeno e discreto) */}
                    <div className="absolute -bottom-2 -left-2 flex flex-col items-center">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] text-blue-600 font-bold ring-4 ring-transparent shadow-lg transform transition-transform hover:scale-110">
                            {onlineCount}
                        </span>
                    </div>

                    {/* Contador de Mensagens não lidas (Top-Right - Maior e chamativo) */}
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-[12px] text-white font-extrabold ring-[3px] ring-white dark:ring-slate-900 shadow-xl z-20 animate-bounce-slow">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}

                    {unreadCount === 0 && (
                        <span className="absolute top-0 right-0 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-white"></span>
                        </span>
                    )}
                </div>
            )}
        </button>
    );
}
