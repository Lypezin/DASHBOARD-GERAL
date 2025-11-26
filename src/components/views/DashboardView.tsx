import React from 'react';
import { AderenciaSemanal, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import { DashboardGeneralStats } from './dashboard/DashboardGeneralStats';
import { DashboardDailyPerformance } from './dashboard/DashboardDailyPerformance';
import { DashboardOperationalDetail } from './dashboard/DashboardOperationalDetail';

const DashboardView = React.memo(function DashboardView({
  aderenciaGeral,
  aderenciaDia,
  aderenciaTurno,
  aderenciaSubPraca,
  aderenciaOrigem,
}: {
  aderenciaGeral?: AderenciaSemanal;
  aderenciaDia: AderenciaDia[];
  aderenciaTurno: AderenciaTurno[];
  aderenciaSubPraca: AderenciaSubPraca[];
  aderenciaOrigem: AderenciaOrigem[];
}) {
  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Aderência Geral - Design Profissional Clean */}
      <DashboardGeneralStats aderenciaGeral={aderenciaGeral} />

      {/* Aderência por Dia da Semana */}
      <DashboardDailyPerformance aderenciaDia={aderenciaDia} />

      {/* Detalhamento Operacional */}
      <DashboardOperationalDetail
        aderenciaTurno={aderenciaTurno}
        aderenciaSubPraca={aderenciaSubPraca}
        aderenciaOrigem={aderenciaOrigem}
      />
    </div>
  );
});

DashboardView.displayName = 'DashboardView';

export default DashboardView;
