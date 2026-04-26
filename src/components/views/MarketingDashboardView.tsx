'use client';

import React from 'react';
import { MarketingFiltersSection } from './marketing/MarketingFiltersSection';
import { MarketingStatsCards } from './marketing/MarketingStatsCards';
import { MarketingCityCards } from './marketing/MarketingCityCards';
import { useMarketingData } from './marketing/useMarketingData';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { MarketingDashboardError } from './marketing/components/MarketingDashboardError';

const DashboardSectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="flex items-center gap-3 px-2">
    <div className="h-8 w-1.5 rounded-full bg-blue-600 shadow-sm" />
    <div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{title}</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{subtitle}</p>
    </div>
  </div>
);

const MarketingDashboardView = React.memo(function MarketingDashboardView() {
  const { loading, error, totals, citiesData, filters, handleFilterChange } = useMarketingData();

  if (loading) return <DashboardSkeleton contentOnly />;
  if (error) return <MarketingDashboardError error={error} />;

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      <MarketingFiltersSection filters={filters} onFilterChange={handleFilterChange} />

      <div className="space-y-4">
        <DashboardSectionHeader
          title="Visão Geral de Conversão"
          subtitle="Indicadores principais de desempenho do funil"
        />
        <MarketingStatsCards totals={totals} />
      </div>

      <MarketingCityCards citiesData={citiesData} />
    </div>
  );
});

MarketingDashboardView.displayName = 'MarketingDashboardView';

export default MarketingDashboardView;
