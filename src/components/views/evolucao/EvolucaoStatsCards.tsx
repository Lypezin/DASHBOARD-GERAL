import React from 'react';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { Car, Clock, BarChart2, Calendar } from 'lucide-react';

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
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#d8e4eb] bg-[#d8e4eb] shadow-[0_8px_28px_-24px_rgba(15,57,82,0.5)] dark:border-slate-800 dark:bg-slate-800 sm:grid-cols-4">
      <Metric label="Total de pedidos" value={totalCorridas.toLocaleString('pt-BR')} meta={`${dadosAtivos.length} ${viewMode === 'mensal' ? 'meses' : 'semanas'} analisados`} icon={Car} />
      <Metric label="Total de horas" value={formatarHorasParaHMS(totalHoras)} meta="Tempo total trabalhado" icon={Clock} />
      <Metric label={`Média ${viewMode === 'mensal' ? 'mensal' : 'semanal'}`} value={mediaCorridas.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} meta="Pedidos por período" icon={BarChart2} />
      <Metric label="Período analisado" value={anoSelecionado.toLocaleString('pt-BR')} meta={`${viewMode === 'mensal' ? '12 meses' : '53 semanas'} disponíveis`} icon={Calendar} />
    </dl>
  );
});

EvolucaoStatsCards.displayName = 'EvolucaoStatsCards';

function Metric({ label, value, meta, icon: Icon }: { label: string; value: string; meta: string; icon: React.ElementType }) {
  return (
    <div className="min-w-0 bg-white px-3 py-3.5 transition-colors duration-150 hover:bg-[#f8fbfc] dark:bg-slate-950/70 dark:hover:bg-slate-900 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-[#38708e] dark:text-sky-300" aria-hidden="true" />
        <dt className="truncate text-xs font-medium text-slate-600 dark:text-slate-300">{label}</dt>
      </div>
      <dd className="mt-2 truncate text-lg font-semibold tracking-tight text-[#183f58] tabular-nums dark:text-slate-50" title={value}>{value}</dd>
      <p className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">{meta}</p>
    </div>
  );
}
