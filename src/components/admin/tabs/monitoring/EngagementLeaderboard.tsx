import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, MousePointerClick } from 'lucide-react';
import { SaasPanel, SaasPanelHeader } from '@/components/views/shared/SaasPrimitives';
import { formatDuration } from './monitoringUtils';

interface EngagementLeaderboardProps {
  userTime: Array<{
    userId: string;
    profile: {
      full_name?: string;
      avatar_url?: string;
    } | null;
    totalTimeSeconds: number;
    totalVisits: number;
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

export function EngagementLeaderboard({ userTime }: EngagementLeaderboardProps) {
  return (
    <SaasPanel>
      <SaasPanelHeader
        eyebrow="Engajamento"
        title="Tempo por usuário"
        description="Usuários com maior tempo online nas últimas 24 horas."
        icon={Clock}
        tone="slate"
      />
      <div className="p-4">
        {userTime.length === 0 ? (
          <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 text-center text-sm font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
            Nenhum dado de engajamento nas últimas 24h.
          </div>
        ) : (
          <div className="subtle-scrollbar overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:border-slate-800">
                  <th className="px-3 py-3">Usuário</th>
                  <th className="px-3 py-3 text-center">Visitas</th>
                  <th className="px-3 py-3 text-right">Tempo total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {userTime.slice(0, 10).map((stat, index) => {
                  const name = stat.profile?.full_name || 'Usuário desconhecido';

                  return (
                    <tr key={stat.userId} className="transition-colors duration-200 hover:bg-slate-50/90 dark:hover:bg-slate-900/60">
                      <td className="px-3 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-mono text-xs font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                            {String(index + 1).padStart(2, '0')}
                          </div>
                          <Avatar className="h-9 w-9 shrink-0 border border-white shadow-sm dark:border-slate-800">
                            <AvatarImage src={stat.profile?.avatar_url} alt={name} />
                            <AvatarFallback className="bg-blue-50 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                              {getInitials(name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="min-w-0 truncate font-semibold text-slate-950 dark:text-slate-50" title={name}>
                            {name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 font-mono text-xs font-semibold tabular-nums text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
                          <MousePointerClick className="h-3.5 w-3.5" />
                          {stat.totalVisits.toLocaleString('pt-BR')}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold tabular-nums text-slate-950 dark:text-slate-50">
                        {formatDuration(stat.totalTimeSeconds)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SaasPanel>
  );
}
