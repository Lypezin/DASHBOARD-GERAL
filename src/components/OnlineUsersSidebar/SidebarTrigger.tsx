import { MessageSquareMore, Users, Wifi } from 'lucide-react';
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
                'fixed bottom-6 right-6 z-[99999] flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 px-3 py-3 text-slate-700 shadow-xl backdrop-blur-sm transition-[transform,opacity,box-shadow,background-color,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.14)] dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-100',
                isOpen && 'pointer-events-none translate-y-4 opacity-0'
            )}
            title="Abrir painel da equipe"
            aria-label="Abrir painel da equipe"
        >
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
                <Users size={18} />
                <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-blue-600" />
            </div>

            <div className="min-w-0 text-left">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                    Equipe
                </p>
                <p className="truncate text-sm font-semibold">
                    Pessoas online
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <Wifi size={10} />
                        {onlineCount} online
                    </span>

                    <span className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        unreadCount > 0
                            ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    )}>
                        <MessageSquareMore size={10} />
                        {unreadCount} nao lidas
                    </span>
                </div>
            </div>
        </button>
    );
}
