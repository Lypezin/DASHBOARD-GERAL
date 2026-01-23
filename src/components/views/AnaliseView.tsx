
import React from 'react';
import { Totals, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import { AnaliseMetricCards } from './analise/components/AnaliseMetricCards';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

import { useAnaliseViewController } from './analise/useAnaliseViewController';
import { AnaliseDetailedCard } from './analise/AnaliseDetailedCard';

const AnaliseView = React.memo(function AnaliseView({
  totals,
  aderenciaDia,
  aderenciaTurno,
  aderenciaSubPraca,
  aderenciaOrigem,
}: {
  totals: Totals;
  aderenciaDia: AderenciaDia[];
  aderenciaTurno: AderenciaTurno[];
  aderenciaSubPraca: AderenciaSubPraca[];
  aderenciaOrigem: AderenciaOrigem[];
}) {
  const {
    activeTable,
    isExporting,
    handleExport,
    handleTableChange,
    taxaAceitacao,
    taxaCompletude,
    taxaRejeicao,
    tableData,
    labelColumn,
    totalHoras
  } = useAnaliseViewController(
    totals,
    aderenciaDia,
    aderenciaTurno,
    aderenciaSubPraca,
    aderenciaOrigem
  );

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
      className="space-y-8 pb-8 w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div className="flex justify-end" variants={item}>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isExporting}
          className="gap-2 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm transition-all hover:shadow-md"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Exportando...' : 'Exportar Excel'}
        </Button>
      </motion.div>

      <motion.div variants={item}>
        <AnaliseMetricCards
          totals={totals}
          taxaAceitacao={taxaAceitacao}
          taxaCompletude={taxaCompletude}
          taxaRejeicao={taxaRejeicao}
          totalHorasEntregues={totalHoras}
        />
      </motion.div>

      {/* Análise Detalhada - Tabelas */}
      <motion.div variants={item}>
        <AnaliseDetailedCard
          activeTable={activeTable}
          onTableChange={handleTableChange}
          tableData={tableData}
          labelColumn={labelColumn}
        />
      </motion.div>
    </motion.div>
  );
});

AnaliseView.displayName = 'AnaliseView';

export default AnaliseView;
