'use client';

import React from 'react';
import { MarketingFiltersSection } from './marketing/MarketingFiltersSection';
import { MarketingStatsCards } from './marketing/MarketingStatsCards';
import { MarketingCityCards } from './marketing/MarketingCityCards';
import { useMarketingData } from './marketing/useMarketingData';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { MarketingDashboardError } from './marketing/components/MarketingDashboardError';
import { ViewTransition } from '@/components/ui/view-transition';

const DashboardSectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="flex items-center gap-3 px-2">
    <div className="h-8 w-1.5 rounded-full bg-blue-600 shadow-sm" />
    <div>
      <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{title}</h2>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  </div>
);

const MarketingDashboardView = React.memo(function MarketingDashboardView() {
  const { loading, error, totals, citiesData, filters, handleFilterChange } = useMarketingData();
  const hasMarketingData = citiesData.length > 0 || Object.values(totals).some((value) => Number(value) > 0);

  if (loading && !hasMarketingData) {
    return (
      <ViewTransition stateKey="marketing-dashboard-loading">
        <DashboardSkeleton contentOnly />
      </ViewTransition>
    );
  }

  if (error) {
    return (
      <ViewTransition stateKey="marketing-dashboard-error">
        <MarketingDashboardError error={error} />
      </ViewTransition>
    );
  }

  return (
    <ViewTransition stateKey="marketing-dashboard-content">
      <div className="space-y-6 pb-8 animate-fade-in">
        <MarketingFiltersSection filters={filters} onFilterChange={handleFilterChange} />

        {loading ? (
          <div className="rounded-2xl border border-blue-200/70 bg-blue-50/80 px-4 py-3 text-sm font-semibold text-blue-800 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/25 dark:text-blue-200">
            Atualizando dados de marketing...
          </div>
        ) : null}

        <div className="space-y-4">
          <DashboardSectionHeader
            title="Visão geral de conversão"
            subtitle="Indicadores principais de desempenho do funil"
          />
          <MarketingStatsCards totals={totals} />
        </div>

        <MarketingCityCards citiesData={citiesData} />
      </div>
    </ViewTransition>
  );
});

MarketingDashboardView.displayName = 'MarketingDashboardView';

export default MarketingDashboardView;
