import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock3, MapPin, Users } from 'lucide-react';
import { SaasPanel, SaasPanelHeader } from '@/components/views/shared/SaasPrimitives';
import { getPathName } from './monitoringUtils';

interface ActiveUsersCardProps {
  activeUsers: Array<{
    userId: string;
    profile: {
      full_name?: string;
      email?: string;
      avatar_url?: string;
    } | null;
    currentPath: string;
    lastSeen: string;
  }>;
}

function getInitials(name?: string) {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function ActiveUsersCard({ activeUsers }: ActiveUsersCardProps) {
  return (
    <SaasPanel className="h-full">
      <SaasPanelHeader
        eyebrow="Online"
        title="Usuários ativos agora"
        description="Sessões com sinal recebido nos últimos 5 minutos."
        icon={Users}
        tone="emerald"
      />
      <div className="p-4">
        <ScrollArea className="h-[360px] pr-3">
          {activeUsers.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 text-center text-sm font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
              Nenhum usuário ativo no momento.
            </div>
          ) : (
            <div className="space-y-3">
              {activeUsers.map((user) => {
                const name = user.profile?.full_name || 'Usuário desconhecido';
                const pathName = getPathName(user.currentPath);

                return (
                  <div
                    key={user.userId}
                    className="group flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white/90 p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-emerald-900/60"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative shrink-0">
                        <Avatar className="h-10 w-10 border border-white shadow-sm dark:border-slate-800">
                          <AvatarImage src={user.profile?.avatar_url} alt={name} />
                          <AvatarFallback className="bg-emerald-50 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            {getInitials(name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-950" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50" title={name}>
                          {name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400" title={user.profile?.email || undefined}>
                          {user.profile?.email || 'Sem e-mail cadastrado'}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-slate-400">
                          <Clock3 className="h-3 w-3" />
                          Visto às {new Date(user.lastSeen).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="min-w-0 max-w-[170px] shrink-0 rounded-full border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                      title={pathName}
                    >
                      <MapPin className="mr-1 h-3 w-3 shrink-0" />
                      <span className="truncate">{pathName}</span>
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </SaasPanel>
  );
}
