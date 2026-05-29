import { Users, Coffee, Sparkles, X, BellRing } from 'lucide-react';
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
  isOpen, onlineCount, availableCount, unreadCount, searchTerm, setSearchTerm,
  myCustomStatus, setMyCustomStatus, onStatusSubmit, onClose
}: SidebarHeaderProps) {
  return (
    <div className="rounded-tl-2xl border-b border-border bg-card p-4 select-none">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 overflow-hidden">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Users className="h-5 w-5" />
          </div>
          {isOpen && (
            <div className="min-w-0 flex flex-col">
              <h3 className="truncate text-base font-black tracking-tight text-foreground font-outfit">
                Equipe e conversas
              </h3>
              <p className="truncate text-xs font-semibold text-muted-foreground/80">
                {onlineCount} online agora
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 sm:flex items-center gap-1 uppercase tracking-wider">
            <Sparkles size={10} className="animate-pulse" />
            Live
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors focus:outline-none"
            aria-label="Fechar painel da equipe"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 space-y-3.5 animate-in fade-in-50 duration-200">
          {/* Bento Grid dos Contadores */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-lg border border-border/80 bg-muted/20 px-3 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-colors">
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 truncate font-outfit">Online</p>
              <p className="mt-1 text-xl font-black leading-none text-foreground font-mono">{onlineCount}</p>
            </div>
            <div className="rounded-lg border border-border/80 bg-muted/20 px-3 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-colors">
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 truncate font-outfit">Disponíveis</p>
              <p className="mt-1 text-xl font-black leading-none text-foreground font-mono">{availableCount}</p>
            </div>
            <div className="rounded-lg border border-border/80 bg-muted/20 px-3 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-colors">
              <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 truncate font-outfit">
                <BellRing size={9} className="text-primary/70 shrink-0" />
                Mensagens
              </div>
              <p className="mt-1 text-xl font-black leading-none text-foreground font-mono">{unreadCount}</p>
            </div>
          </div>

          {/* Campo de Busca */}
          <input
            type="text"
            placeholder="Buscar nome ou cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full h-[38px] rounded-lg border border-border bg-muted/20 px-3.5 py-1.5 text-xs font-semibold text-foreground placeholder:text-muted-foreground/50 shadow-[0_1px_2px_rgba(0,0,0,0.01)]",
              "focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-150"
            )}
          />

          {/* Status Rápido */}
          <div className={cn(
            "flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-all duration-150",
            "focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-card/45"
          )}>
            <Coffee size={14} className="shrink-0 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Seu status rápido"
              value={myCustomStatus}
              onChange={(e) => setMyCustomStatus(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
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
