import { Users, Coffee } from 'lucide-react';

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
        <div className="p-4 border-b border-slate-100 flex flex-col gap-3 bg-slate-50/50 rounded-tl-xl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="bg-blue-100 p-2 rounded-lg shrink-0">
                        <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    {isOpen && (
                        <div className="min-w-0">
                            <h3 className="font-semibold text-slate-800 text-sm truncate">Online</h3>
                            <p className="text-xs text-slate-500 truncate">{onlineCount} usuário(s)</p>
                        </div>
                    )}
                </div>
            </div>

            {isOpen && (
                <div className="space-y-2">
                    <input
                        type="text"
                        placeholder="Buscar usuário..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-400 bg-white"
                    />

                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1.5 px-2">
                        <Coffee size={12} className="text-slate-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Definir status (ex: Almoçando)"
                            value={myCustomStatus}
                            onChange={(e) => setMyCustomStatus(e.target.value)}
                            className="w-full text-[10px] focus:outline-none bg-transparent"
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
