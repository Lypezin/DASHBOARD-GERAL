import { MessageSquareMore, Users, Wifi, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarTriggerProps {
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    onlineCount: number;
    unreadCount: number;
    isMinimized?: boolean;
    setIsMinimized?: (v: boolean) => void;
}

export function SidebarTrigger({
    isOpen,
    setIsOpen,
    onlineCount,
    unreadCount,
    isMinimized = false,
    setIsMinimized,
}: SidebarTriggerProps) {
    const handleOpen = () => {
        setIsMinimized?.(false);
        setIsOpen(true);
    };

    const handleMinimize = () => {
        setIsOpen(false);
        setIsMinimized?.(true);
    };

    return (
        <div
            className={cn(
                'group fixed bottom-6 z-[99999] transform-gpu text-slate-700 transition-[transform,opacity,box-shadow,background-color,border-color] duration-500 ease-out dark:text-slate-100',
                isOpen && 'pointer-events-none translate-y-4 opacity-0',
                isMinimized
                    ? 'right-0 w-[4.85rem] translate-x-3 opacity-90 hover:translate-x-0 hover:opacity-100'
                    : 'right-5 w-[17rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur-sm hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.14)] dark:border-slate-800 dark:bg-slate-900/95'
            )}
        >
            {isMinimized ? (
                <button
                    type="button"
                    onClick={handleOpen}
                    className="relative flex h-[4.65rem] w-full items-center justify-start overflow-hidden rounded-l-2xl border border-r-0 border-slate-200 bg-white/95 pl-2.5 pr-4 shadow-xl backdrop-blur-sm transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-slate-800 dark:bg-slate-900/95 dark:hover:bg-slate-900"
                    title="Mostrar painel da equipe"
                    aria-label="Mostrar painel da equipe"
                >
                    <span className="absolute left-0 top-1/2 h-10 w-1 -translate-y-1/2 rounded-r-full bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.12)] dark:bg-blue-500" />
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg transition-transform duration-300 group-hover:scale-105">
                        <Users size={18} />
                        <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-blue-600" />
                        {unreadCount > 0 ? (
                            <span className="absolute -bottom-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white ring-2 ring-white dark:ring-slate-900">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        ) : null}
                    </div>
                </button>
            ) : (
                <>
                <button
                    type="button"
                    onClick={handleMinimize}
                    className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-500 opacity-80 shadow-sm transition-[opacity,transform,background-color,color] hover:scale-105 hover:bg-slate-50 hover:text-slate-950 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
                    title="Esconder chat"
                    aria-label="Esconder chat"
                >
                    <X size={14} />
                </button>

                <button
                    type="button"
                    onClick={handleOpen}
                    className="relative flex w-full items-center gap-3 overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_12%_18%,rgba(37,99,235,0.10),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] px-3 py-3 pr-10 text-left transition-colors dark:bg-[radial-gradient(circle_at_12%_18%,rgba(37,99,235,0.20),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.94))]"
                    title="Abrir painel da equipe"
                    aria-label="Abrir painel da equipe"
                >
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg transition-transform duration-300 group-hover:scale-105">
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
                </>
            )}
        </div>
    );
}
