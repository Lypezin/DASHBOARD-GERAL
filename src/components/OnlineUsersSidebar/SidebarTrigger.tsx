import { MessageSquareMore, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarTriggerProps {
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    onlineCount: number;
    unreadCount: number;
}

export function SidebarTrigger({ isOpen, setIsOpen, onlineCount, unreadCount }: SidebarTriggerProps) {
    return (
        <button
            onClick={() => setIsOpen(true)}
            className={cn(
                'fixed bottom-6 right-6 z-[99999] flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 px-3 py-3 text-slate-700 shadow-2xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,0.16)] dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-100',
                isOpen && 'pointer-events-none translate-y-4 opacity-0'
            )}
            title="Abrir painel da equipe"
            aria-label="Abrir painel da equipe"
        >
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
                <Users size={18} />

                <span className="absolute -bottom-2 -left-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-blue-600 shadow ring-2 ring-white dark:bg-slate-950 dark:ring-slate-900">
                    {onlineCount}
                </span>

                {unreadCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white shadow ring-2 ring-white dark:ring-slate-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </div>

            <div className="min-w-0 text-left">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                    Equipe
                </p>
                <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">
                        Pessoas online
                    </span>
                    {unreadCount > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                            <MessageSquareMore size={10} />
                            {unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
}
