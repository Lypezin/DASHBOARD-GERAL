'use client';

import React from 'react';
import { AnaliseMetricCards } from './analise/components/AnaliseMetricCards';
import { motion, Variants } from 'framer-motion';
import { useAnaliseViewController } from './analise/useAnaliseViewController';
import { AnaliseDetailedCard } from './analise/AnaliseDetailedCard';
import { useDashboardMainData } from '@/hooks/dashboard/useDashboardMainData';
import { useDashboardKeys } from '@/hooks/dashboard/useDashboardKeys';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import type { DashboardFilters, CurrentUser } from '@/types';
import type { FilterPayload } from '@/types/filters';

const AnaliseView = React.memo(function AnaliseView({
  filters,
  filterPayload,
  currentUser,
}: {
  filters: DashboardFilters;
  filterPayload: FilterPayload;
  currentUser: CurrentUser | null;
}) {
  const {
    totals,
    aderenciaDia,
    aderenciaTurno,
    aderenciaSubPraca,
    aderenciaOrigem,
    aderenciaDiaOrigem,
    loading
  } = useDashboardMainData({ filterPayload });

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
    totals || { ofertadas: 0, aceitas: 0, rejeitadas: 0, completadas: 0 },
    aderenciaDia || [],
    aderenciaTurno || [],
    aderenciaSubPraca || [],
    aderenciaOrigem || [],
    aderenciaDiaOrigem || []
  );

  if (loading || !totals) {
    return <DashboardSkeleton contentOnly />;
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

  // Mapear nome do dia para data formatada (ex: "segunda" -> "23/03")
  const dayDateMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    
    // 1. Tentar extrair datas dos próprios itens de aderência
    if (Array.isArray(aderenciaDia)) {
      aderenciaDia.forEach(d => {
        const dayName = d.dia || d.dia_semana || d.dia_da_semana;
        const rawDate = d.data || (d as any).data_do_periodo;
        if (dayName && rawDate && typeof rawDate === 'string') {
          const normalizedKey = dayName.split('-')[0].trim().toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
          const parts = rawDate.split('T')[0].split('-');
          if (parts.length === 3) {
            const [, month, day] = parts;
            map[normalizedKey] = `${day}/${month}`;
          }
        }
      });
    }

    // 2. Se falhou e temos semana específica filtrada, calcular manualmente
    if (Object.keys(map).length === 0 && filterPayload?.p_ano && filterPayload?.p_semana) {
      try {
        const year = Number(filterPayload.p_ano);
        const week = Number(filterPayload.p_semana);
        
        // Regra ISO 8601: Semana 1 é a primeira semana com uma quinta-feira
        // O dia 4 de Janeiro está sempre na Semana 1
        const jan4 = new Date(year, 0, 4);
        const jan4Day = jan4.getDay() || 7; // ISO day 1-7
        const monday1 = new Date(jan4.getTime());
        monday1.setDate(jan4.getDate() - (jan4Day - 1));
        
        const startOfSpecifiedWeek = new Date(monday1.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
        
        const nomes_dias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
        nomes_dias.forEach((nome, i) => {
          const curr = new Date(startOfSpecifiedWeek.getTime() + i * 24 * 60 * 60 * 1000);
          const dStr = String(curr.getDate()).padStart(2, '0');
          const mStr = String(curr.getMonth() + 1).padStart(2, '0');
          map[nome] = `${dStr}/${mStr}`;
        });
      } catch (e) {
        console.error('Erro ao calcular datas da semana:', e);
      }
    }
    
    return map;
  }, [aderenciaDia, filterPayload?.p_ano, filterPayload?.p_semana]);

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
