import { Bell, Coffee, Search, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  isOpen,
  onlineCount,
  availableCount,
  unreadCount,
  searchTerm,
  setSearchTerm,
  myCustomStatus,
  setMyCustomStatus,
  onStatusSubmit,
  onClose,
}: SidebarHeaderProps) {
  return (
    <div className="border-b border-slate-200 bg-white px-4 pb-4 pt-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Users className="h-[18px] w-[18px]" aria-hidden="true" />
          </div>
          {isOpen ? (
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-bold tracking-tight text-slate-950 dark:text-white">Equipe</h3>
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                {availableCount}{availableCount === 1 ? ' disponível' : ' disponíveis'} de {onlineCount} online
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {unreadCount > 0 ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-blue-700 dark:bg-blue-400/10 dark:text-blue-200"
              title={`${unreadCount} mensagens não lidas`}
            >
              <Bell size={12} aria-hidden="true" />
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
            aria-label="Fechar painel da equipe"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="mt-4 space-y-2.5 animate-in fade-in-50 duration-200">
          <label className={cn(
            'flex h-10 items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-400 transition-colors dark:border-slate-800 dark:bg-slate-900/70',
            'focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/15'
          )}>
            <Search size={15} aria-hidden="true" />
            <input
              type="search"
              aria-label="Buscar pessoas da equipe"
              placeholder="Buscar por nome ou cargo"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-xs font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </label>

          <label className={cn(
            'flex h-9 items-center gap-2.5 rounded-lg border border-slate-200/80 px-3 text-slate-400 transition-colors dark:border-slate-800',
            'focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/15'
          )}>
            <Coffee size={14} className="shrink-0" aria-hidden="true" />
            <input
              type="text"
              aria-label="Seu status rápido"
              placeholder="Defina seu status"
              value={myCustomStatus}
              onChange={(e) => setMyCustomStatus(e.target.value)}
              className="w-full bg-transparent text-xs font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
              onBlur={() => onStatusSubmit(myCustomStatus)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onStatusSubmit(myCustomStatus);
                  e.currentTarget.blur();
                }
              }}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
