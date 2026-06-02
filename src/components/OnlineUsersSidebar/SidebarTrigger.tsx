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
                'group fixed bottom-6 right-5 z-[99999] w-[17rem] max-w-[calc(100vw-2rem)] transform-gpu rounded-2xl border border-slate-200 bg-white/95 text-slate-700 shadow-xl backdrop-blur-sm transition-[transform,opacity,box-shadow,background-color,border-color] duration-500 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.14)] dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-100',
                isOpen && 'pointer-events-none translate-y-4 opacity-0',
                !isOpen && isMinimized && 'translate-x-[calc(100%-3.15rem)] scale-95 opacity-90 hover:translate-x-[calc(100%-4rem)] hover:scale-100 hover:opacity-100'
            )}
        >
            {isMinimized ? (
                <span className="pointer-events-none absolute left-1.5 top-1/2 h-9 w-1.5 -translate-y-1/2 rounded-full bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.12)] dark:bg-blue-500" />
            ) : null}

            {!isMinimized ? (
                <button
                    type="button"
                    onClick={handleMinimize}
                    className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
                    title="Esconder chat"
                    aria-label="Esconder chat"
                >
                    <X size={14} />
                </button>
            ) : null}

            <button
                type="button"
                onClick={handleOpen}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 pr-10 text-left"
                title={isMinimized ? 'Mostrar painel da equipe' : 'Abrir painel da equipe'}
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
        </div>
    );
}
