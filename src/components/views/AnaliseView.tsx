'use client';

import React from 'react';
import { Totals, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem, AderenciaDiaOrigem } from '@/types';
import { AnaliseMetricCards } from './analise/components/AnaliseMetricCards';
import { motion, Variants } from 'framer-motion';
import { useAnaliseViewController } from './analise/useAnaliseViewController';
import { AnaliseDetailedCard } from './analise/AnaliseDetailedCard';
import type { FilterPayload } from '@/types/filters';

const AnaliseView = React.memo(function AnaliseView({
  totals,
  aderenciaDia = [],
  aderenciaTurno = [],
  aderenciaSubPraca = [],
  aderenciaOrigem = [],
  aderenciaDiaOrigem = [],
  filterPayload,
}: {
  totals: Totals;
  aderenciaDia?: AderenciaDia[];
  aderenciaTurno?: AderenciaTurno[];
  aderenciaSubPraca?: AderenciaSubPraca[];
  aderenciaOrigem?: AderenciaOrigem[];
  aderenciaDiaOrigem?: AderenciaDiaOrigem[];
  filterPayload?: FilterPayload;
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
    aderenciaOrigem,
    aderenciaDiaOrigem
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

  // Mapear nome do dia para data formatada (ex: "Segunda" -> "23/03")
  const dayDateMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    if (Array.isArray(aderenciaDia)) {
      aderenciaDia.forEach(d => {
        const dayName = d.dia || d.dia_semana || d.dia_da_semana;
        const rawDate = d.data || (d as any).data_do_periodo;
        if (dayName && rawDate && typeof rawDate === 'string') {
          // Normalizar nome do dia para o mapa (remover -feira, lowercase)
          const normalizedKey = dayName.split('-')[0].trim().toLowerCase();
          const parts = rawDate.split('T')[0].split('-');
          if (parts.length === 3) {
            const [, month, day] = parts;
            map[normalizedKey] = `${day}/${month}`;
          }
        }
      });
    }
    return map;
  }, [aderenciaDia]);

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
          aderenciaDiaOrigem={aderenciaDiaOrigem || []}
          dayDateMap={dayDateMap}
        />
      </motion.div>
    </motion.div>
  );
});

AnaliseView.displayName = 'AnaliseView';

export default AnaliseView;
