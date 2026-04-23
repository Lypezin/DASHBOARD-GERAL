import { Users, Coffee, Sparkles, X, BellRing } from 'lucide-react';

interface SidebarHeaderProps {
    isOpen: boolean;
    onlineCount: number;
    unreadCount: number;
    searchTerm: string;
    setSearchTerm: (v: string) => void;
    myCustomStatus: string;
    setMyCustomStatus: (v: string) => void;
    onStatusSubmit: (v: string) => void;
    onClose: () => void;
}

export function SidebarHeader({
    isOpen, onlineCount, unreadCount, searchTerm, setSearchTerm,
    myCustomStatus, setMyCustomStatus, onStatusSubmit, onClose
}: SidebarHeaderProps) {
    return (
        <div className="rounded-tl-3xl border-b border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3 overflow-hidden">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                        <Users className="h-5 w-5" />
                    </div>
                    {isOpen && (
                        <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">Equipe e conversas</h3>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{onlineCount} online agora</p>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 sm:flex items-center gap-1">
                        <Sparkles size={10} />
                        Live
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        aria-label="Fechar painel da equipe"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {isOpen && (
                <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Online</p>
                            <p className="mt-1 text-lg font-semibold text-slate-800 dark:text-slate-100">{onlineCount}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
                            <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                                <BellRing size={10} />
                                Nao lidas
                            </div>
                            <p className="mt-1 text-lg font-semibold text-slate-800 dark:text-slate-100">{unreadCount}</p>
                        </div>
                    </div>

                    <input
                        type="text"
                        placeholder="Buscar nome ou cargo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-400 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                    />

                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-950">
                        <Coffee size={13} className="shrink-0 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Seu status rapido"
                            value={myCustomStatus}
                            onChange={(e) => setMyCustomStatus(e.target.value)}
                            className="w-full bg-transparent text-[11px] focus:outline-none"
                            onBlur={() => onStatusSubmit(myCustomStatus)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onStatusSubmit(myCustomStatus);
                                    e.currentTarget.blur();
                                }
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
