import React, { useState, useCallback } from 'react';
import { AderenciaSemanal, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import { DashboardGeneralStats } from './dashboard/DashboardGeneralStats';
import { DashboardDailyPerformance } from './dashboard/DashboardDailyPerformance';
import { DashboardOperationalDetail } from './dashboard/DashboardOperationalDetail';
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
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header com Botão de Exportar */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isExporting}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Exportando...' : 'Exportar Excel'}
        </Button>
      </div>

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
