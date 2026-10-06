import { MessageSquareMore, Users, Wifi, X, ChevronRight } from 'lucide-react';
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
                'group fixed bottom-5 right-5 z-[99999] text-slate-700 transition-[transform,opacity,box-shadow,background-color,border-color] duration-200 ease-out dark:text-slate-100',
                isOpen && 'pointer-events-none translate-y-4 opacity-0',
                isMinimized
                    ? 'w-12'
                    : 'w-[17rem] max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.14)] hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-950'
            )}
        >
            {isMinimized ? (
                <button
                    type="button"
                    onClick={handleOpen}
                    className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.14)] transition-[transform,background-color] hover:scale-[1.03] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
                    title="Mostrar painel da equipe"
                    aria-label="Mostrar painel da equipe"
                >
                    <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors group-hover:bg-blue-700">
                        <MessageSquareMore size={18} aria-hidden="true" />
                        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-950" />
                        {unreadCount > 0 ? (
                            <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold tabular-nums text-white ring-2 ring-white dark:ring-slate-950">
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
                    className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:text-slate-500 dark:hover:bg-slate-900 dark:hover:text-white"
                    title="Esconder chat"
                    aria-label="Esconder chat"
                >
                    <X size={14} />
                </button>

                <button
                    type="button"
                    onClick={handleOpen}
                    className="relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-3 pr-9 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/75"
                    title="Abrir painel da equipe"
                    aria-label="Abrir painel da equipe"
                >
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                        <Users size={18} aria-hidden="true" />
                        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-blue-600" />
                    </div>

                    <div className="min-w-0 text-left">
                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            Chat da equipe
                        </p>
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {onlineCount} online · {unreadCount} não lidas
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                <Wifi size={10} />
                                Abra para encontrar alguém e conversar
                            </span>
                        </div>
                    </div>
                    <ChevronRight className="ml-auto h-4 w-4 text-slate-400" aria-hidden="true" />
                </button>
                </>
            )}
        </div>
    );
}
