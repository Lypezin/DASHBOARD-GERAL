import React from 'react';
import { Car, MapPin, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { AderenciaSemanal, Totals } from '@/types';

interface DashboardOverviewStatsProps {
  totals: Totals | null;
  adherence?: AderenciaSemanal;
  plazaCount: number;
  selectedPlaza: string | null;
}

export const DashboardOverviewStats = React.memo(function DashboardOverviewStats({
  totals,
  adherence,
  plazaCount,
  selectedPlaza,
}: DashboardOverviewStatsProps) {
  const metrics = [
    {
      label: 'Corridas ofertadas',
      value: totals?.ofertadas.toLocaleString('pt-BR') ?? '—',
      detail: 'No período selecionado',
      Icon: Car,
    },
    {
      label: 'Aderência geral',
      value: adherence ? `${adherence.aderencia_percentual.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '—',
      detail: 'Entregue sobre planejado',
      Icon: Target,
    },
    {
      label: 'Praças',
      value: String(selectedPlaza ? 1 : plazaCount),
      detail: selectedPlaza || 'Disponíveis para sua organização',
      Icon: MapPin,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map(({ label, value, detail, Icon }) => (
        <Card key={label} className="rounded-xl border-border bg-card shadow-none">
          <CardContent className="flex min-h-[148px] items-center gap-4 p-4 sm:p-5">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-accent text-primary sm:h-20 sm:w-20">
              <Icon className="h-8 w-8" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <p className="mt-1 truncate text-4xl font-bold leading-tight tracking-tight text-primary" title={value}>
                {value}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground" title={detail}>{detail}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

DashboardOverviewStats.displayName = 'DashboardOverviewStats';
