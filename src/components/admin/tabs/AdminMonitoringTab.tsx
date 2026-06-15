import React from 'react';
import { useMonitoringData } from '@/hooks/admin/useMonitoringData';
import { Activity, AlertCircle, Radio, RefreshCcw, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SaasPanel, SaasPanelHeader } from '@/components/views/shared/SaasPrimitives';

import { ActiveUsersCard } from './monitoring/ActiveUsersCard';
import { EngagementLeaderboard } from './monitoring/EngagementLeaderboard';
import { MonitoringStatsGrid } from './monitoring/MonitoringStatsGrid';
import { TopPagesCard } from './monitoring/TopPagesCard';

export function AdminMonitoringTab() {
  const { stats, loading, refreshing, error, lastUpdated, refresh } = useMonitoringData();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 rounded-[1.65rem]" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="rounded-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Falha ao carregar monitoramento</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <SaasPanel className="overflow-visible">
        <SaasPanelHeader
          eyebrow="Admin"
          title="Monitoramento em tempo quase real"
          description="Acompanhe usuários ativos, páginas mais acessadas e engajamento das últimas 24 horas sem expor tabelas protegidas no browser."
          icon={Activity}
          tone="emerald"
          actions={(
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Badge className="h-9 rounded-full border-emerald-200 bg-emerald-50 px-3 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Radio className={`mr-2 h-3.5 w-3.5 ${refreshing ? 'animate-pulse' : ''}`} />
                {refreshing ? 'Atualizando' : 'Auto-refresh 2min'}
              </Badge>
              <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing} className="h-9 rounded-full">
                <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          )}
        />
        <div className="grid gap-3 p-4 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Sem 403 no cliente
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Leitura feita por API interna validada como admin.</p>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="font-semibold text-slate-900 dark:text-white">Janela ativa</div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Online = último sinal nos últimos 5 minutos.</p>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="font-semibold text-slate-900 dark:text-white">Última atualização</div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {lastUpdated ? new Date(lastUpdated).toLocaleString('pt-BR') : 'Ainda não sincronizado'}
            </p>
          </div>
        </div>
      </SaasPanel>

      <MonitoringStatsGrid stats={stats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ActiveUsersCard activeUsers={stats.activeUsers} />
        <TopPagesCard topPages={stats.topPages} />
      </div>

      <EngagementLeaderboard userTime={stats.userTime} />
    </div>
  );
}
