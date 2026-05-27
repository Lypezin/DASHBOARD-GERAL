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
    <div className="space-y-7 animate-fade-in pb-12 pt-3">
      <section>
        <DashboardGeneralStats aderenciaGeral={aderenciaGeral} aderenciaDia={aderenciaDia} />
      </section>

      <section className="space-y-4">
        <DashboardSectionHeader
          title="Evolução diária"
          description="Acompanhamento rápido da aderência por dia no período filtrado."
        />
        <DashboardDailyPerformance aderenciaDia={aderenciaDia} />
      </section>

      <section className="space-y-4">
        <DashboardSectionHeader
          title="Detalhamento operacional"
          description="Quebra por turno, sub praça, origem e dia para investigar desvios."
        />
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

function DashboardSectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/60 bg-white/65 px-4 py-3 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/45 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-lg">{title}</h2>
        <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">{description}</p>
      </div>
      <div className="hidden h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-800 sm:block" />
    </div>
  );
}
