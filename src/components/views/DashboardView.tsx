import React, { useMemo } from 'react';
import { DashboardGeneralStats } from './dashboard/DashboardGeneralStats';
import { DashboardDailyPerformance } from './dashboard/DashboardDailyPerformance';
import { DashboardOperationalDetail } from './dashboard/DashboardOperationalDetail';
import { calculateAderenciaGeral } from '@/utils/dashboard/aderenciaCalc';
import type {
  DashboardFilters,
  CurrentUser,
  Totals,
  AderenciaSemanal,
  AderenciaDia,
  AderenciaTurno,
  AderenciaSubPraca,
  AderenciaOrigem,
} from '@/types';
import type { FilterPayload } from '@/types/filters';

const DashboardView = React.memo(function DashboardView({
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
    <div className="mx-auto w-full max-w-[1600px] space-y-9 px-4 pb-16 pt-5 animate-fade-in sm:px-6 lg:px-8">
      <section className="space-y-4">
        <DashboardSectionHeader
          title="Resumo Operacional"
          description="Indicadores consolidados de aderencia e metricas criticas de entrega."
        />
        <DashboardGeneralStats aderenciaGeral={aderenciaGeral} aderenciaDia={aderenciaDia} />
      </section>

      <section className="space-y-4">
        <DashboardSectionHeader
          title="Evolucao Diaria"
          description="Acompanhamento rapido da aderencia por dia no periodo filtrado."
        />
        <DashboardDailyPerformance aderenciaDia={aderenciaDia} />
      </section>

      <section className="space-y-4">
        <DashboardSectionHeader
          title="Detalhamento Operacional"
          description="Quebra por turno, sub-praca, origem e dia para investigar desvios."
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
    <div className="flex min-w-0 flex-col gap-1 border-l-2 border-blue-500/70 pl-3">
      <h2 className="text-xl font-semibold leading-tight text-slate-950 dark:text-slate-50">
        {title}
      </h2>
      <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}
