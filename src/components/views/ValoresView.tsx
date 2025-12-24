
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
import { motion, Variants } from 'framer-motion';

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
      className="space-y-6 animate-fade-in"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <ValoresHeader
        isExporting={isExporting}
        onExport={handleExport}
        variants={item}
      />

      <motion.div variants={item}>
        <ValoresSearch
          searchTerm={searchTerm}
          isSearching={isSearching}
          totalResults={totalEntregadores}
          onSearchChange={setSearchTerm}
          onClearSearch={() => setSearchTerm('')}
        />
      </motion.div>

      <motion.div variants={item}>
        <ValoresStatsCards
          totalGeral={totalGeral}
          totalEntregadores={totalEntregadores}
          totalCorridas={totalCorridas}
          taxaMediaGeral={taxaMediaGeral}
          formatarReal={formatarReal}
        />
      </motion.div>

      <motion.div variants={item}>
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
