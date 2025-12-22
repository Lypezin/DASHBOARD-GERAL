'use client';

import React from 'react';
import { MarketingFiltersSection } from './marketing/MarketingFiltersSection';
import { MarketingStatsCards } from './marketing/MarketingStatsCards';
import { MarketingCityCards } from './marketing/MarketingCityCards';
import { useMarketingData } from './marketing/useMarketingData';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { motion, Variants } from 'framer-motion';

const MarketingDashboardView = React.memo(function MarketingDashboardView() {
  const {
    loading,
    error,
    totals,
    citiesData,
    filters,
    handleFilterChange
  } = useMarketingData();

  if (loading) {
    return <DashboardSkeleton contentOnly />;
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="max-w-md mx-auto rounded-xl border border-rose-200 bg-white p-6 text-center shadow-xl dark:border-rose-900 dark:bg-slate-900">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-lg font-bold text-rose-900 dark:text-rose-100">Erro ao carregar dados</p>
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }


  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div
      className="space-y-6 pb-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Filtros de Data */}
      <motion.div variants={item}>
        <MarketingFiltersSection
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      </motion.div>

      {/* Cartões Principais */}
      <motion.div variants={item}>
        <MarketingStatsCards totals={totals} />
      </motion.div>

      {/* Cartões de Cidade */}
      <motion.div variants={item}>
        <MarketingCityCards citiesData={citiesData} />
      </motion.div>
    </motion.div>
  );
});

MarketingDashboardView.displayName = 'MarketingDashboardView';

export default MarketingDashboardView;
