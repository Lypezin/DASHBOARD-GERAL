import React from 'react';
import { Activity, BarChart3, Clock, Users } from 'lucide-react';
import { SaasMetric } from '@/components/views/shared/SaasPrimitives';
import { formatDuration } from './monitoringUtils';

interface MonitoringStatsGridProps {
  stats: {
    summary: {
      totalVisits: number;
      totalTimeSeconds: number;
      uniqueUsers24h: number;
      activeUsersNow: number;
      monitoredPages: number;
    };
  };
}

export const MonitoringStatsGrid = React.memo(function MonitoringStatsGrid({
  stats,
}: MonitoringStatsGridProps) {
  const { summary } = stats;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SaasMetric
        label="Usuários online"
        value={summary.activeUsersNow.toLocaleString('pt-BR')}
        meta="Ativos nos últimos 5 min"
        icon={Activity}
        tone="emerald"
        size="lg"
        className="p-4"
      />
      <SaasMetric
        label="Usuários 24h"
        value={summary.uniqueUsers24h.toLocaleString('pt-BR')}
        meta="Usuários distintos monitorados"
        icon={Users}
        tone="blue"
        size="lg"
        className="p-4"
      />
      <SaasMetric
        label="Visitas 24h"
        value={summary.totalVisits.toLocaleString('pt-BR')}
        meta="Visualizações de página"
        icon={BarChart3}
        tone="amber"
        size="lg"
        className="p-4"
      />
      <SaasMetric
        label="Tempo total"
        value={formatDuration(summary.totalTimeSeconds)}
        meta={`${summary.monitoredPages.toLocaleString('pt-BR')} páginas monitoradas`}
        icon={Clock}
        tone="slate"
        size="lg"
        className="p-4"
      />
    </div>
  );
});
