
import React from 'react';
import { Totals, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import { AnaliseMetricCards } from './analise/components/AnaliseMetricCards';
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
      className="flex flex-col gap-10 pb-8 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* KPI Cards Section */}
      <motion.div variants={item}>
        <AnaliseMetricCards
          totals={totals}
          taxaAceitacao={taxaAceitacao}
          taxaCompletude={taxaCompletude}
          taxaRejeicao={taxaRejeicao}
          totalHorasEntregues={totalHoras}
        />
      </motion.div>

      {/* Análise Detalhada - Tabelas com Exportar integrado */}
      <motion.div variants={item}>
        <AnaliseDetailedCard
          activeTable={activeTable}
          onTableChange={handleTableChange}
          tableData={tableData}
          labelColumn={labelColumn}
          isExporting={isExporting}
          onExport={handleExport}
        />
      </motion.div>
    </motion.div>
  );
});

AnaliseView.displayName = 'AnaliseView';

export default AnaliseView;
