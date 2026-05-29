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
    <div className="space-y-10 animate-fade-in pb-16 pt-2">
      {/* Seção 1: Bento Grid de Estatísticas Principais */}
      <section className="space-y-4">
        <DashboardSectionHeader
          title="Resumo Operacional"
          description="Indicadores consolidados de aderência e métricas críticas de entrega."
        />
        <DashboardGeneralStats aderenciaGeral={aderenciaGeral} aderenciaDia={aderenciaDia} />
      </section>

      {/* Seção 2: Evolução Diária */}
      <section className="space-y-4">
        <DashboardSectionHeader
          title="Evolução Diária"
          description="Acompanhamento rápido da aderência por dia no período filtrado."
        />
        <DashboardDailyPerformance aderenciaDia={aderenciaDia} />
      </section>

      {/* Seção 3: Detalhamento Operacional */}
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
  );
});

DashboardView.displayName = 'DashboardView';

export default DashboardView;

function DashboardSectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-1">
      <h2 className="text-lg font-black tracking-tight text-foreground sm:text-xl font-outfit">
        {title}
      </h2>
      <p className="text-xs font-medium text-muted-foreground sm:text-sm">
        {description}
      </p>
    </div>
  );
}
