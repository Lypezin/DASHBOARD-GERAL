
'use client';

import React, { useState, useCallback } from 'react';
import { ValoresEntregador } from '@/types';
import { ValoresStatsCards } from './valores/ValoresStatsCards';
import { ValoresTable } from './valores/ValoresTable';
import { ValoresSearch } from './valores/ValoresSearch';
import { useValoresData } from './valores/useValoresData';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { exportarValoresParaExcel } from './valores/ValoresExcelExport';
import { safeLog } from '@/lib/errorHandler';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInItem } from '@/utils/animations';

import { ValoresHeader } from './valores/ValoresHeader';
import { ValoresError, ValoresEmpty } from './valores/ValoresStates';

import { ValoresBreakdownDisplay } from './valores/ValoresBreakdownDisplay';

const ValoresView = React.memo(function ValoresView({
  valoresData,
  loading,
  filters,
  setFilters,
}: {
  valoresData: ValoresEntregador[];
  loading: boolean;
  filters?: any;
  setFilters?: any;
}) {
  const [isExporting, setIsExporting] = useState(false);

  const {
    sortedValores,
    sortField,
    sortDirection,
    searchTerm,
    isSearching,
    error,
    totalGeral,
    totalCorridas,
    taxaMediaGeral,
    totalEntregadores,
    setSearchTerm,
    handleSort,
    formatarReal,
    loadMore,
    hasMore,
    isLoadingMore,
    breakdownData,
    loadingBreakdown
  } = useValoresData(valoresData, loading, filters);

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);
      await exportarValoresParaExcel(sortedValores);
    } catch (err) {
      safeLog.error('Erro export valores', err);
    } finally {
      setIsExporting(false);
    }
  }, [sortedValores]);

  if (loading && !valoresData) {
    return <DashboardSkeleton contentOnly />;
  }

  if (error && !valoresData) {
    return <ValoresError error={error} />;
  }

  if (!valoresData || !Array.isArray(valoresData)) {
    // Allow empty array to render table (it handles empty state)
    // but if null/undefined, show empty/loading
    if (!loading) return <ValoresEmpty />;
    return <DashboardSkeleton contentOnly />;
  }

  return (
    <motion.div
      className="space-y-6 animate-fade-in w-full max-w-[1800px] mx-auto pb-10"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeInItem}>
        <ValoresStatsCards
          totalGeral={totalGeral}
          totalEntregadores={totalEntregadores}
          totalCorridas={totalCorridas}
          taxaMediaGeral={taxaMediaGeral}
          formatarReal={formatarReal}
        />
      </motion.div>

      <div className="space-y-4">
        <ValoresHeader
          isExporting={isExporting}
          onExport={handleExport}
          variants={fadeInItem}
          isDetailed={filters?.detailed}
          onToggleDetailed={(checked) => setFilters?.({ ...filters, detailed: checked })}
        />

        <motion.div variants={fadeInItem}>
          <ValoresSearch
            searchTerm={searchTerm}
            isSearching={isSearching}
            totalResults={totalEntregadores}
            onSearchChange={setSearchTerm}
            onClearSearch={() => setSearchTerm('')}
          />
        </motion.div>

        <motion.div variants={fadeInItem}>
          <ValoresTable
            sortedValores={sortedValores}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            formatarReal={formatarReal}
            isDetailed={filters?.detailed}
            onLoadMore={loadMore}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
          />
        </motion.div>

        {/* Breakdown Display below Table */}
        {(filters?.detailed || breakdownData) && (
          <ValoresBreakdownDisplay
            data={breakdownData}
            loading={loadingBreakdown}
            formatarReal={formatarReal}
          />
        )}
      </div>
    </motion.div>
  );
});

ValoresView.displayName = 'ValoresView';

export default ValoresView;
