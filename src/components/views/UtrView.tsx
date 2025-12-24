
import React from 'react';
import { UtrData } from '@/types';
import { motion, Variants } from 'framer-motion';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { Activity } from 'lucide-react';

import { useUtrView } from './utr/useUtrView';
import { UtrHeader } from './utr/UtrHeader';
import { UtrContent } from './utr/UtrContent';

const UtrView = React.memo(function UtrView({
  utrData,
  loading,
}: {
  utrData: UtrData | null;
  loading: boolean;
}) {
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
      <div className="space-y-6 animate-fade-in">
        <TableSkeleton rows={6} columns={4} />
      </div>
    );
  }

  if (!utrData || !utrData.geral) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl border-dashed border-slate-300 dark:border-slate-700">
        <Activity className="h-10 w-10 text-slate-400 mb-3" />
        <p className="text-lg font-medium text-slate-900 dark:text-white">Nenhum dado disponível</p>
        <p className="text-sm text-slate-500">Aguarde o carregamento ou ajuste os filtros.</p>
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
      <UtrHeader
        isExporting={isExporting}
        onExport={handleExport}
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
