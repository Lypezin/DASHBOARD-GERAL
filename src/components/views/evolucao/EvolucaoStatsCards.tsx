import React from 'react';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { Car, Clock, BarChart2, Calendar } from 'lucide-react';
import { SaasMetric } from '@/components/views/shared/SaasPrimitives';

interface EvolucaoStatsCardsProps {
  dadosAtivos: any[];
  viewMode: 'mensal' | 'semanal';
  anoSelecionado: number;
}

export const EvolucaoStatsCards = React.memo<EvolucaoStatsCardsProps>(({ dadosAtivos, viewMode, anoSelecionado }) => {
  const { totalCorridas, totalHoras, mediaCorridas } = React.useMemo(() => {
    const tCorridas = dadosAtivos.reduce(
      (sum, d) => sum + ((d as any).corridas_completadas || (d as any).total_corridas || 0),
      0
    );
    const tHoras = dadosAtivos.reduce((sum, d) => sum + d.total_segundos, 0) / 3600;
    const mCorridas = dadosAtivos.length > 0 ? tCorridas / dadosAtivos.length : 0;
    return { totalCorridas: tCorridas, totalHoras: tHoras, mediaCorridas: mCorridas };
  }, [dadosAtivos]);

  if (dadosAtivos.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SaasMetric
        label="Total de corridas"
        value={totalCorridas.toLocaleString('pt-BR')}
        meta={`${dadosAtivos.length} ${viewMode === 'mensal' ? 'meses' : 'semanas'} analisadas`}
        icon={Car}
        tone="blue"
        className="p-5"
      />
      <SaasMetric
        label="Total de horas"
        value={formatarHorasParaHMS(totalHoras)}
        meta="Tempo total trabalhado"
        icon={Clock}
        tone="amber"
        className="p-5"
      />
      <SaasMetric
        label={`Média ${viewMode === 'mensal' ? 'mensal' : 'semanal'}`}
        value={mediaCorridas.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        meta="Corridas por período"
        icon={BarChart2}
        tone="emerald"
        className="p-5"
      />
      <SaasMetric
        label="Período analisado"
        value={anoSelecionado}
        meta={`${viewMode === 'mensal' ? '12 meses' : '53 semanas'} disponíveis`}
        icon={Calendar}
        tone="slate"
        className="p-5"
      />
    </div>
  );
});

EvolucaoStatsCards.displayName = 'EvolucaoStatsCards';
