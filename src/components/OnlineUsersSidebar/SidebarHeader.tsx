import { Users, Coffee, Sparkles } from 'lucide-react';

interface SidebarHeaderProps {
    isOpen: boolean;
    onlineCount: number;
    searchTerm: string;
    setSearchTerm: (v: string) => void;
    myCustomStatus: string;
    setMyCustomStatus: (v: string) => void;
    onStatusSubmit: (v: string) => void;
}

export function SidebarHeader({
    isOpen, onlineCount, searchTerm, setSearchTerm,
    myCustomStatus, setMyCustomStatus, onStatusSubmit
}: SidebarHeaderProps) {
    return (
        <div className="rounded-tl-2xl border-b border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                        <Users className="h-5 w-5" />
                    </div>
                    {isOpen && (
                        <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">Pessoas e conversas</h3>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{onlineCount} usuario(s) online agora</p>
                        </div>
                    )}
                </div>

                <div className="hidden rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 sm:flex items-center gap-1">
                    <Sparkles size={10} />
                    Live
                </div>
            </div>

            {isOpen && (
                <div className="mt-3 space-y-2">
                    <input
                        type="text"
                        placeholder="Buscar nome ou cargo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-400 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                    />

                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-950">
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
