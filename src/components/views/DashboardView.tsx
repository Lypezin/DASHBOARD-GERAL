import React, { useMemo } from 'react';
import { DashboardGeneralStats } from './dashboard/DashboardGeneralStats';
import { DashboardOverviewStats } from './dashboard/DashboardOverviewStats';
import { DashboardOverviewAnalysis } from './dashboard/DashboardOverviewAnalysis';
import { DashboardDailyPerformance } from './dashboard/DashboardDailyPerformance';
import { DashboardOperationalDetail } from './dashboard/DashboardOperationalDetail';
import { calculateAderenciaGeral } from '@/utils/dashboard/aderenciaCalc';
import { ViewContainer } from '@/components/layout/ViewContainer';
import type {
  DashboardFilters,
  CurrentUser,
  Totals,
  FilterOption,
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
  filters,
  pracas,
}: {
  filters: DashboardFilters;
  filterPayload: FilterPayload;
  currentUser: CurrentUser | null;
  totals: Totals | null;
  pracas: FilterOption[];
  aderenciaSemanal: AderenciaSemanal[];
  aderenciaDia: AderenciaDia[];
  aderenciaTurno: AderenciaTurno[];
  aderenciaSubPraca: AderenciaSubPraca[];
  aderenciaOrigem: AderenciaOrigem[];
}) {
  const aderenciaGeral = useMemo(() => calculateAderenciaGeral(aderenciaSemanal), [aderenciaSemanal]);

  return (
    <ViewContainer className="space-y-8 pb-16 pt-3">
      <section className="space-y-4">
        <DashboardSectionHeader
          title="Resumo Operacional"
          description="Corridas, aderência e praças no período selecionado."
        />
        <DashboardOverviewStats
          totals={totals}
          adherence={aderenciaGeral}
          plazaCount={pracas.length}
          selectedPlaza={filters.praca}
        />
      </section>

      <DashboardOverviewAnalysis days={aderenciaDia} subPlazas={aderenciaSubPraca} />

      <section className="space-y-4">
        <DashboardSectionHeader
          title="Horas planejadas e entregues"
          description="Compare o volume programado com as horas efetivamente realizadas."
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
    </ViewContainer>
  );
});

DashboardView.displayName = 'DashboardView';

export default DashboardView;

function DashboardSectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-b border-border pb-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-5">
      <h2 className="text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
        {title}
      </h2>
      <p className="max-w-3xl text-sm text-muted-foreground sm:text-right">
        {description}
      </p>
    </div>
  );
}
