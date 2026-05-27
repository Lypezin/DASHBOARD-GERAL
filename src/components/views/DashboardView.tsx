import React, { useMemo } from 'react';
import { DashboardGeneralStats } from './dashboard/DashboardGeneralStats';
import { DashboardDailyPerformance } from './dashboard/DashboardDailyPerformance';
import { DashboardOperationalDetail } from './dashboard/DashboardOperationalDetail';
import { calculateAderenciaGeral } from '@/utils/dashboard/aderenciaCalc';
import type {
  DashboardFilters, CurrentUser, Totals, AderenciaSemanal, AderenciaDia,
  AderenciaTurno, AderenciaSubPraca, AderenciaOrigem
} from '@/types';
import type { FilterPayload } from '@/types/filters';

const DashboardView = React.memo(function DashboardView({
  filterPayload,
  totals,
  aderenciaSemanal,
  aderenciaDia,
  aderenciaTurno,
  aderenciaSubPraca,
  aderenciaOrigem,
}: {
  filters: DashboardFilters;
  filterPayload: FilterPayload;
  currentUser: CurrentUser | null;
  totals: Totals | null;
  aderenciaSemanal: AderenciaSemanal[];
  aderenciaDia: AderenciaDia[];
  aderenciaTurno: AderenciaTurno[];
  aderenciaSubPraca: AderenciaSubPraca[];
  aderenciaOrigem: AderenciaOrigem[];
}) {
  const aderenciaGeral = useMemo(() => calculateAderenciaGeral(aderenciaSemanal), [aderenciaSemanal]);

  return (
    <div className="space-y-8 animate-fade-in pb-12 pt-4">
      {/* Aderência Geral - Design Profissional Clean */}
      <section>
        <DashboardGeneralStats aderenciaGeral={aderenciaGeral} aderenciaDia={aderenciaDia} />
      </section>

      {/* Aderência por Dia da Semana */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Evolução Diária</h2>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
        </div>
        <DashboardDailyPerformance aderenciaDia={aderenciaDia} />
      </section>

      {/* Detalhamento Operacional */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Detalhamento Operacional</h2>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
        </div>
        <DashboardOperationalDetail
          aderenciaTurno={aderenciaTurno}
          aderenciaSubPraca={aderenciaSubPraca}
          aderenciaOrigem={aderenciaOrigem}
          aderenciaDia={aderenciaDia}
        />
      </section>
    </div>
  );
});

DashboardView.displayName = 'DashboardView';

export default DashboardView;
