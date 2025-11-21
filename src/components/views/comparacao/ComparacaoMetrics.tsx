import React from 'react';
import { DashboardResumoData } from '@/types';
import { formatarHorasParaHMS, converterHorasParaDecimal } from '@/utils/formatters';
import MetricCard from '@/components/MetricCard';

interface ComparacaoMetricsProps {
  dadosComparacao: DashboardResumoData[];
}

export const ComparacaoMetrics: React.FC<ComparacaoMetricsProps> = ({
  dadosComparacao,
}) => {
  const aderenciaMedia = Number(
    (dadosComparacao.reduce((sum, d) => sum + (d.semanal[0]?.aderencia_percentual ?? 0), 0) / dadosComparacao.length).toFixed(1)
  );
  
  const totalCorridas = dadosComparacao.reduce((sum, d) => sum + (d.totais?.corridas_completadas ?? 0), 0);
  
  const horasEntregues = formatarHorasParaHMS(
    dadosComparacao.reduce((sum, d) => sum + converterHorasParaDecimal(d.semanal[0]?.horas_entregues ?? '0'), 0).toString()
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <MetricCard
        title="Aderência Média"
        value={aderenciaMedia}
        icon="📊"
        color="blue"
      />
      <MetricCard
        title="Total de Corridas"
        value={totalCorridas}
        icon="🚗"
        color="green"
      />
      <MetricCard
        title="Horas Entregues"
        value={horasEntregues}
        icon="⏱️"
        color="purple"
      />
    </div>
  );
};

