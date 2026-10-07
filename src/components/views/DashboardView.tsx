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
    <ViewContainer className="space-y-5 pb-10 pt-4">
      {mainDataError ? <DashboardDataStatus hasPreviousData={hasResolvedData} onRetry={retryMainData} /> : null}
      <header className="rounded-xl border border-[#164d70] bg-[#174d70] px-5 py-5 shadow-[0_16px_40px_-28px_rgba(12,54,81,0.72)] sm:px-7 sm:py-6">
        <h1 className="text-[23px] font-semibold leading-tight tracking-[-0.025em] text-white sm:text-[28px]">
          Visão geral
        </h1>
        <p className="mt-1.5 text-[13px] leading-5 text-sky-100/85">
          Acompanhe aderência, desempenho diário e detalhes da operação.
        </p>
      </header>
      <FilteredDataTransition isUpdating={mainDataLoading}>
        <div className="space-y-5">
          <section aria-labelledby="overview-summary-title" className="space-y-3">
            <DashboardSectionHeader
              id="overview-summary-title"
              title="Resumo Operacional"
              description="Indicadores consolidados de aderência e métricas críticas de entrega."
            />
            <DashboardGeneralStats aderenciaGeral={aderenciaGeral} aderenciaDia={aderenciaDia} />
          </section>

          <DashboardDailyPerformance aderenciaDia={aderenciaDia} />

          <DashboardOperationalDetail
            aderenciaTurno={aderenciaTurno}
            aderenciaSubPraca={aderenciaSubPraca}
            aderenciaOrigem={aderenciaOrigem}
            aderenciaDia={aderenciaDia}
          />
        </div>
      </FilteredDataTransition>
    </ViewContainer>
  );
});

DashboardView.displayName = 'DashboardView';

export default DashboardView;

function DashboardSectionHeader({ id, title, description }: { id?: string; title: string; description: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 px-0.5">
      <h2 id={id} className="text-[15px] font-semibold leading-5 tracking-tight text-[#183f58] dark:text-slate-100">
        {title}
      </h2>
      <p className="max-w-3xl text-xs leading-5 text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}
