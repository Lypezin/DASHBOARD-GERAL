import { ChevronRight, Users, MessageSquare } from 'lucide-react';
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
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
                'fixed right-0 top-1/2 -translate-y-1/2 z-[99999] flex items-center gap-3 rounded-l-2xl border border-r-0 border-slate-200 bg-white/95 px-3 py-3 text-slate-700 shadow-2xl backdrop-blur-sm transition-all duration-300 hover:pr-4 dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-100',
                isOpen && 'translate-x-[1px]'
            )}
            title={isOpen ? 'Fechar painel de pessoas' : 'Abrir painel de pessoas'}
        >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg">
                {isOpen ? <ChevronRight size={18} /> : <Users size={18} />}

                <span className="absolute -bottom-2 -left-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-blue-600 shadow ring-2 ring-white dark:bg-slate-950 dark:ring-slate-900">
                    {onlineCount}
                </span>

                {unreadCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white shadow ring-2 ring-white dark:ring-slate-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </div>

            <div className="hidden min-w-0 text-left sm:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Equipe
                </p>
                <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">
                        {isOpen ? 'Fechar painel' : 'Pessoas online'}
                    </span>
                    {unreadCount > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                            <MessageSquare size={10} />
                            {unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
}
