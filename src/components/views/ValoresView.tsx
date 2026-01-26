
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

const ValoresView = React.memo(function ValoresView({
  valoresData,
  loading,
}: {
  valoresData: ValoresEntregador[];
  loading: boolean;
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
    formatarReal
  } = useValoresData(valoresData, loading);

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

  if (loading) {
    return <DashboardSkeleton contentOnly />;
  }

  if (error) {
    return <ValoresError error={error} />;
  }

  if (!valoresData || !Array.isArray(valoresData) || valoresData.length === 0) {
    return <ValoresEmpty />;
  }



  return (
    <motion.div
      className="space-y-6 animate-fade-in w-full max-w-[1800px] mx-auto"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      <ValoresHeader
        isExporting={isExporting}
        onExport={handleExport}
        variants={fadeInItem}
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
        <ValoresStatsCards
          totalGeral={totalGeral}
          totalEntregadores={totalEntregadores}
          totalCorridas={totalCorridas}
          taxaMediaGeral={taxaMediaGeral}
          formatarReal={formatarReal}
        />
      </motion.div>

      <motion.div variants={fadeInItem}>
        <ValoresTable
          sortedValores={sortedValores}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          formatarReal={formatarReal}
        />
      </motion.div>
    </motion.div>
  );
});

ValoresView.displayName = 'ValoresView';

export default ValoresView;
