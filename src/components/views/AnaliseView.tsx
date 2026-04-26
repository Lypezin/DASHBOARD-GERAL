'use client';

import React from 'react';
import { AnaliseMetricCards } from './analise/components/AnaliseMetricCards';
import { useAnaliseViewController } from './analise/useAnaliseViewController';
import { AnaliseDetailedCard } from './analise/AnaliseDetailedCard';
import type {
  DashboardFilters, CurrentUser, Totals, AderenciaDia, AderenciaTurno,
  AderenciaSubPraca, AderenciaOrigem, AderenciaDiaOrigem
} from '@/types';
import type { FilterPayload } from '@/types/filters';

const AnaliseView = React.memo(function AnaliseView({
  filterPayload,
  totals,
  aderenciaDia,
  aderenciaTurno,
  aderenciaSubPraca,
  aderenciaOrigem,
  aderenciaDiaOrigem,
}: {
  filters: DashboardFilters;
  filterPayload: FilterPayload;
  currentUser: CurrentUser | null;
  totals: Totals | null;
  aderenciaDia: AderenciaDia[];
  aderenciaTurno: AderenciaTurno[];
  aderenciaSubPraca: AderenciaSubPraca[];
  aderenciaOrigem: AderenciaOrigem[];
  aderenciaDiaOrigem: AderenciaDiaOrigem[];
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
    totals || { ofertadas: 0, aceitas: 0, rejeitadas: 0, completadas: 0 },
    aderenciaDia || [],
    aderenciaTurno || [],
    aderenciaSubPraca || [],
    aderenciaOrigem || [],
    aderenciaDiaOrigem || []
  );

  const dayDateMap = React.useMemo(() => {
    const map: Record<string, string> = {};

    if (Array.isArray(aderenciaDia)) {
      aderenciaDia.forEach((dia) => {
        const dayName = dia.dia || dia.dia_semana || dia.dia_da_semana;
        const rawDate = dia.data || (dia as any).data_do_periodo;
        if (dayName && rawDate && typeof rawDate === 'string') {
          const normalizedKey = dayName.split('-')[0].trim().toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

          const parts = rawDate.split('T')[0].split('-');
          if (parts.length === 3) {
            const [, month, day] = parts;
            map[normalizedKey] = `${day}/${month}`;
          }
        }
      });
    }

    if (Object.keys(map).length === 0 && filterPayload?.p_ano && filterPayload?.p_semana) {
      try {
        const year = Number(filterPayload.p_ano);
        const week = Number(filterPayload.p_semana);
        const jan4 = new Date(year, 0, 4);
        const jan4Day = jan4.getDay() || 7;
        const monday1 = new Date(jan4.getTime());
        monday1.setDate(jan4.getDate() - (jan4Day - 1));

        const startOfSpecifiedWeek = new Date(monday1.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
        const nomesDias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];

        nomesDias.forEach((nome, index) => {
          const curr = new Date(startOfSpecifiedWeek.getTime() + index * 24 * 60 * 60 * 1000);
          const dStr = String(curr.getDate()).padStart(2, '0');
          const mStr = String(curr.getMonth() + 1).padStart(2, '0');
          map[nome] = `${dStr}/${mStr}`;
        });
      } catch (error) {
        console.error('Erro ao calcular datas da semana:', error);
      }
    }

    return map;
  }, [aderenciaDia, filterPayload?.p_ano, filterPayload?.p_semana]);

  return (
    <div className="flex flex-col gap-10 pb-8 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 animate-fade-in">
      <AnaliseMetricCards
        totals={totals || { ofertadas: 0, aceitas: 0, rejeitadas: 0, completadas: 0 }}
        taxaAceitacao={taxaAceitacao}
        taxaCompletude={taxaCompletude}
        taxaRejeicao={taxaRejeicao}
        totalHorasEntregues={totalHoras}
      />

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
    </div>
  );
});

AnaliseView.displayName = 'AnaliseView';

export default AnaliseView;
