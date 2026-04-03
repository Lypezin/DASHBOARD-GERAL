'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Activity } from 'lucide-react';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { useTabData } from '@/hooks/data/useTabData';
import { useTabDataMapper } from '@/hooks/data/useTabDataMapper';
import type { CurrentUser } from '@/types';
import type { FilterPayload } from '@/types/filters';
import { UtrHeader } from './utr/UtrHeader';
import { UtrContent } from './utr/UtrContent';
import { useUtrView } from './utr/useUtrView';

const UtrView = React.memo(function UtrView({
  filterPayload,
  currentUser,
}: {
  filterPayload: FilterPayload;
  currentUser: CurrentUser | null;
}) {
  const { data: tabData, loading } = useTabData('utr', filterPayload, currentUser);
  const { utrData } = useTabDataMapper({ activeTab: 'utr', tabData });
  const {
    isExporting,
    handleExport,
    porPraca,
    porSubPraca,
    porOrigem,
    porTurno
  } = useUtrView(utrData);

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <TableSkeleton rows={6} columns={4} />
      </div>
    );
  }

  if (!utrData || !utrData.geral) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/75 px-6 py-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <Activity className="h-6 w-6 text-slate-500 dark:text-slate-300" />
        </div>
        <p className="text-lg font-semibold text-slate-900 dark:text-white">Nenhum dado disponivel</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
          Aguarde o carregamento ou ajuste os filtros para visualizar a leitura operacional de UTR.
        </p>
      </div>
    );
  }

  const sectionCount = [porPraca, porSubPraca, porOrigem, porTurno].filter((section) => section.length > 0).length;
  const totalSlices = porPraca.length + porSubPraca.length + porOrigem.length + porTurno.length;

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  };

  return (
    <motion.div
      className="space-y-5 overflow-x-hidden pb-8 lg:space-y-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <UtrHeader
        isExporting={isExporting}
        onExport={handleExport}
        totalSections={sectionCount}
        totalSlices={totalSlices}
        variants={item}
      />

      <UtrContent
        utrData={utrData}
        porPraca={porPraca}
        porSubPraca={porSubPraca}
        porOrigem={porOrigem}
        porTurno={porTurno}
        variants={item}
      />
    </motion.div>
  );
});

UtrView.displayName = 'UtrView';

export default UtrView;
