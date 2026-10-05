import React, { useMemo } from 'react';
import { DashboardGeneralStats } from './dashboard/DashboardGeneralStats';
import { DashboardDailyPerformance } from './dashboard/DashboardDailyPerformance';
import { DashboardOperationalDetail } from './dashboard/DashboardOperationalDetail';
import { calculateAderenciaGeral } from '@/utils/dashboard/aderenciaCalc';
import { ViewContainer } from '@/components/layout/ViewContainer';
import { DashboardOverviewLoading, FilteredDataTransition } from '@/components/dashboard/OperationalLoading';
import { DashboardDataStatus } from '@/components/dashboard/DashboardDataStatus';
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
  totals,
  mainDataLoading,
  mainDataError,
  retryMainData,
}: {
  filters: DashboardFilters;
  filterPayload: FilterPayload;
  currentUser: CurrentUser | null;
  totals: Totals | null;
  mainDataLoading: boolean;
  mainDataError: string | null;
  retryMainData: () => void;
  aderenciaSemanal: AderenciaSemanal[];
  aderenciaDia: AderenciaDia[];
  aderenciaTurno: AderenciaTurno[];
  aderenciaSubPraca: AderenciaSubPraca[];
  aderenciaOrigem: AderenciaOrigem[];
}) {
  const aderenciaGeral = useMemo(() => calculateAderenciaGeral(aderenciaSemanal), [aderenciaSemanal]);
  const hasResolvedData = totals !== null || aderenciaSemanal.length > 0 || aderenciaDia.length > 0
    || aderenciaTurno.length > 0 || aderenciaSubPraca.length > 0 || aderenciaOrigem.length > 0;

  if (mainDataLoading && !hasResolvedData) return <DashboardOverviewLoading />;
  if (mainDataError && !hasResolvedData) {
    return <div className="mx-auto w-full max-w-[1600px] px-4 pt-5 sm:px-6 lg:px-8"><DashboardDataStatus hasPreviousData={false} onRetry={retryMainData} /></div>;
  }

  return (
    <ViewContainer className="space-y-9 pb-16 pt-5">
      {mainDataError ? <DashboardDataStatus hasPreviousData={hasResolvedData} onRetry={retryMainData} /> : null}
      <FilteredDataTransition isUpdating={mainDataLoading}>
        <div className="space-y-9">
          <section className="space-y-4">
            <DashboardSectionHeader
              title="Resumo Operacional"
              description="Indicadores consolidados de aderência e métricas críticas de entrega."
            />
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
              title="Detalhamento Operacional"
              description="Quebra por turno, sub-praça, origem e dia para investigar desvios."
            />
            <DashboardOperationalDetail
              aderenciaTurno={aderenciaTurno}
              aderenciaSubPraca={aderenciaSubPraca}
              aderenciaOrigem={aderenciaOrigem}
              aderenciaDia={aderenciaDia}
            />
          </section>
        </div>
      </FilteredDataTransition>
    </ViewContainer>
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
