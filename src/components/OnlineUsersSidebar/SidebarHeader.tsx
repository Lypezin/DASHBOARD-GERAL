import { Users, Coffee, Sparkles, X, BellRing } from 'lucide-react';

interface SidebarHeaderProps {
    isOpen: boolean;
    onlineCount: number;
    availableCount: number;
    unreadCount: number;
    searchTerm: string;
    setSearchTerm: (v: string) => void;
    myCustomStatus: string;
    setMyCustomStatus: (v: string) => void;
    onStatusSubmit: (v: string) => void;
    onClose: () => void;
}

export function SidebarHeader({
    isOpen, onlineCount, availableCount, unreadCount, searchTerm, setSearchTerm,
    myCustomStatus, setMyCustomStatus, onStatusSubmit, onClose
}: SidebarHeaderProps) {
    return (
        <div className="rounded-tl-3xl border-b border-slate-100 bg-[linear-gradient(180deg,rgba(248,250,252,0.98)_0%,rgba(255,255,255,0.96)_100%)] p-4 dark:border-slate-800 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96)_0%,rgba(2,6,23,0.98)_100%)]">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3 overflow-hidden">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_12px_28px_rgba(59,130,246,0.35)]">
                        <Users className="h-5 w-5" />
                    </div>
                    {isOpen && (
                        <div className="min-w-0">
                            <h3 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-50">Equipe e conversas</h3>
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">{onlineCount} online agora</p>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 sm:flex items-center gap-1">
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
                    <div className="grid grid-cols-3 gap-2.5">
                        <div className="rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Online</p>
                            <p className="mt-1 text-2xl font-semibold leading-none text-slate-900 dark:text-slate-100">{onlineCount}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Disponiveis</p>
                            <p className="mt-1 text-2xl font-semibold leading-none text-slate-900 dark:text-slate-100">{availableCount}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                            <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                                <BellRing size={10} />
                                Nao lidas
                            </div>
                            <p className="mt-1 text-2xl font-semibold leading-none text-slate-900 dark:text-slate-100">{unreadCount}</p>
                        </div>
                    </div>

                    <input
                        type="text"
                        placeholder="Buscar nome ou cargo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />

                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                        <Coffee size={13} className="shrink-0 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Seu status rapido"
                            value={myCustomStatus}
                            onChange={(e) => setMyCustomStatus(e.target.value)}
                            className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
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
