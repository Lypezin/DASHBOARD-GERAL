import React, { useState, useCallback } from 'react';
import { AderenciaSemanal, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import { DashboardGeneralStats } from './dashboard/DashboardGeneralStats';
import { DashboardDailyPerformance } from './dashboard/DashboardDailyPerformance';
import { DashboardOperationalDetail } from './dashboard/DashboardOperationalDetail';
import { MonthComparisonCards } from './dashboard/components/MonthComparisonCards';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportarDashboardParaExcel } from './dashboard/DashboardExcelExport';
import { safeLog } from '@/lib/errorHandler';

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
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);
      await exportarDashboardParaExcel(
        aderenciaGeral,
        aderenciaDia,
        aderenciaTurno,
        aderenciaSubPraca,
        aderenciaOrigem
      );
    } catch (error) {
      safeLog.error('Erro ao exportar dashboard:', error);
      alert('Erro ao exportar dados. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  }, [aderenciaGeral, aderenciaDia, aderenciaTurno, aderenciaSubPraca, aderenciaOrigem]);

  return (
    <div className="space-y-8 animate-fade-in pb-12 pt-4">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Visão Geral da Operação</h1>
          <p className="text-muted-foreground">Monitoramento de aderência e indicadores chave de desempenho.</p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isExporting}
          className="gap-2 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-slate-900"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Exportando...' : 'Exportar Dados Completos'}
        </Button>
      </div>

      {/* #2 — Comparativo Semanal (Última Selecionada vs Anterior) */}
      {aderenciaDia.length > 0 && (
        <section>
          <MonthComparisonCards aderenciaDia={aderenciaDia} />
        </section>
      )}

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
