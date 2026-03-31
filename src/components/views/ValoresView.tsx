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

import { useTabData } from '@/hooks/data/useTabData';
import { useTabDataMapper } from '@/hooks/data/useTabDataMapper';
import type { CurrentUser } from '@/types';
import type { FilterPayload } from '@/types/filters';

const ValoresView = React.memo(function ValoresView({ 
  filters, 
  setFilters, 
  filterPayload, 
  currentUser 
}: { 
  filters: any; 
  setFilters: any; 
  filterPayload: FilterPayload; 
  currentUser: CurrentUser | null; 
}) {
  const { data: tabData, loading } = useTabData('valores', filterPayload, currentUser);
  const { valoresData } = useTabDataMapper({ activeTab: 'valores', tabData });
  const [isExporting, setIsExporting] = useState(false);

  const {
    sortedValores, paginatedValores, sortField, sortDirection, searchTerm, isSearching, error,
    totalGeral, totalCorridas, taxaMediaGeral, totalEntregadores, loadMore, hasMore, isLoadingMore,
    breakdownData, loadingBreakdown, setSearchTerm, handleSort, formatarReal
  } = useValoresData(valoresData, loading, filters);

  const handleExport = useCallback(async () => {
    try { setIsExporting(true); await exportarValoresParaExcel(sortedValores); }
    catch (err) { safeLog.error('Erro export valores', err); }
    finally { setIsExporting(false); }
  }, [sortedValores]);

  if (loading && !valoresData) return <DashboardSkeleton contentOnly />;
  if (error && !valoresData) return <ValoresError error={error} />;

  if (!valoresData || !Array.isArray(valoresData)) {
    if (!loading) return <ValoresEmpty />;
    return <DashboardSkeleton contentOnly />;
  }

  return (
    <motion.div className="space-y-6 animate-fade-in w-full max-w-[1800px] mx-auto pb-10" variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={fadeInItem}>
        <ValoresStatsCards totalGeral={totalGeral} totalEntregadores={totalEntregadores} totalCorridas={totalCorridas} taxaMediaGeral={taxaMediaGeral} formatarReal={formatarReal} />
      </motion.div>

      <div className="space-y-4">
        <ValoresHeader isExporting={isExporting} onExport={handleExport} variants={fadeInItem} isDetailed={filters?.detailed} onToggleDetailed={(checked) => setFilters?.({ ...filters, detailed: checked })} />

        <motion.div variants={fadeInItem}>
          <ValoresSearch searchTerm={searchTerm} isSearching={isSearching} totalResults={totalEntregadores} onSearchChange={setSearchTerm} onClearSearch={() => setSearchTerm('')} />
        </motion.div>

        <motion.div variants={fadeInItem}>
          <ValoresTable sortedValores={paginatedValores} sortField={sortField} sortDirection={sortDirection} onSort={handleSort} formatarReal={formatarReal} isDetailed={filters?.detailed} onLoadMore={loadMore} hasMore={hasMore} isLoadingMore={isLoadingMore} />
        </motion.div>

        {(filters?.detailed || breakdownData) && (
          <ValoresBreakdownDisplay data={breakdownData} loading={loadingBreakdown} formatarReal={formatarReal} />
        )}
      </div>
    </motion.div>
  );
});

ValoresView.displayName = 'ValoresView';
export default ValoresView;
