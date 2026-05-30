import { Users, Coffee, Sparkles, X, BellRing } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ElementType } from 'react';

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
  myCustomStatus, setMyCustomStatus, onStatusSubmit, onClose,
}: SidebarHeaderProps) {
  return (
    <div className="select-none rounded-tl-[2rem] border-b border-slate-200/80 bg-white/90 p-4 dark:border-slate-800/80 dark:bg-slate-950/90">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 overflow-hidden">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_18px_34px_-22px_rgba(37,99,235,0.8)]">
            <Users className="h-5 w-5" />
          </div>
          {isOpen ? (
            <div className="flex min-w-0 flex-col">
              <h3 className="truncate font-outfit text-base font-black tracking-tight text-slate-950 dark:text-white">
                Equipe e conversas
              </h3>
              <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                {onlineCount} online agora
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 sm:flex">
            <Sparkles size={10} className="animate-pulse" />
            Live
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 focus:outline-none dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
            aria-label="Fechar painel da equipe"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="mt-4 space-y-3.5 animate-in fade-in-50 duration-200">
          <div className="grid grid-cols-3 gap-2.5">
            <CounterTile label="Online" value={onlineCount} />
            <CounterTile label={'Dispon\u00edveis'} value={availableCount} />
            <CounterTile label="Mensagens" value={unreadCount} icon={BellRing} />
          </div>

          <input
            type="text"
            placeholder="Buscar nome ou cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              'h-[40px] w-full rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-1.5 text-xs font-semibold text-slate-900 shadow-sm placeholder:text-slate-400 dark:border-slate-800/80 dark:bg-slate-900/65 dark:text-slate-100 dark:placeholder:text-slate-500',
              'transition-all duration-150 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
            )}
          />

          <div className={cn(
            'flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 shadow-sm transition-all duration-150 dark:border-slate-800/80 dark:bg-slate-900/65',
            'focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20'
          )}>
            <Coffee size={14} className="shrink-0 text-slate-400" />
            <input
              type="text"
              placeholder={'Seu status r\u00e1pido'}
              value={myCustomStatus}
              onChange={(e) => setMyCustomStatus(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
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
      ) : null}
    </div>
  );
}

function CounterTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon?: ElementType;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/65">
      <div className="flex min-w-0 items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {Icon ? <Icon size={9} className="shrink-0 text-blue-500" /> : null}
        <p className="truncate font-outfit">{label}</p>
      </div>
      <p className="mt-1 font-mono text-xl font-black leading-none text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
