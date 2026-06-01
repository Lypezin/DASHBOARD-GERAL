import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart3, MapPin } from 'lucide-react';
import { SaasPanel, SaasPanelHeader } from '@/components/views/shared/SaasPrimitives';
import { formatDuration, getPathName } from './monitoringUtils';

interface TopPagesCardProps {
  topPages: Array<{
    path: string;
    visits: number;
    avgDuration: number;
  }>;
}

export function TopPagesCard({ topPages }: TopPagesCardProps) {
  const maxVisits = Math.max(...topPages.map((page) => page.visits), 1);

  return (
    <SaasPanel className="h-full">
      <SaasPanelHeader
        eyebrow="Rotas"
        title="Páginas mais acessadas"
        description="Ranking das visitas registradas nas últimas 24 horas."
        icon={MapPin}
        tone="blue"
      />
      <div className="p-4">
        <ScrollArea className="h-[360px] pr-3">
          {topPages.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 text-center text-sm font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
              Nenhum acesso registrado nas últimas 24h.
            </div>
          ) : (
            <div className="space-y-3">
              {topPages.map((page, index) => {
                const pathName = getPathName(page.path);
                const progress = Math.max(6, Math.round((page.visits / maxVisits) * 100));

                return (
                  <div
                    key={page.path}
                    className="rounded-2xl border border-slate-200/70 bg-white/90 p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-blue-900/60"
                  >
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-mono text-sm font-semibold text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900/60">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50" title={pathName}>
                            {pathName}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <BarChart3 className="h-3.5 w-3.5" />
                            Tempo médio: {formatDuration(page.avgDuration)}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-mono text-lg font-semibold tabular-nums text-slate-950 dark:text-slate-50">
                          {page.visits.toLocaleString('pt-BR')}
                        </div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">visitas</div>
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
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
