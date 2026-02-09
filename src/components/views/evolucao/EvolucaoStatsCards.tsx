import React from 'react';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Car, Clock, BarChart2, Calendar } from 'lucide-react';

interface EvolucaoStatsCardsProps {
  dadosAtivos: any[];
  viewMode: 'mensal' | 'semanal';
  anoSelecionado: number;
}

export const EvolucaoStatsCards = React.memo<EvolucaoStatsCardsProps>(({
  dadosAtivos,
  viewMode,
  anoSelecionado,
}) => {
  const { totalCorridas, totalHoras, mediaCorridas } = React.useMemo(() => {
    const tCorridas = dadosAtivos.reduce((sum, d) => sum + ((d as any).corridas_completadas || (d as any).total_corridas || 0), 0);
    const tHoras = dadosAtivos.reduce((sum, d) => sum + d.total_segundos, 0) / 3600;
    const mCorridas = dadosAtivos.length > 0 ? tCorridas / dadosAtivos.length : 0;
    return { totalCorridas: tCorridas, totalHoras: tHoras, mediaCorridas: mCorridas };
  }, [dadosAtivos]);

  if (dadosAtivos.length === 0) {
    return null;
  }

  // Hero Card Component
  const HeroCard = ({
    title,
    value,
    subtext,
    icon: Icon,
    colorFrom,
    colorTo,
    iconColor,
  }: {
    title: string;
    value: string | number;
    subtext: string;
    icon: any;
    colorFrom: string;
    colorTo: string;
    iconColor: string;
  }) => (
    <Card className="relative overflow-hidden border-none shadow-lg group">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorFrom} ${colorTo} opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />

      <div className="absolute -right-6 -bottom-6 opacity-5 transform rotate-12 group-hover:scale-110 transition-transform duration-700">
        <Icon className={`w-36 h-36 ${iconColor}`} />
      </div>

      <CardContent className="p-6 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 ${iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</h3>
          <div className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100 font-mono">
            {value}
          </div>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">{subtext}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <HeroCard
        title="Total de Corridas"
        icon={Car}
        value={totalCorridas.toLocaleString('pt-BR')}
        subtext={`${dadosAtivos.length} ${viewMode === 'mensal' ? 'meses' : 'semanas'} analisadas`}
        colorFrom="from-blue-400"
        colorTo="to-indigo-600"
        iconColor="text-blue-600"
      />

      <HeroCard
        title="Total de Horas"
        icon={Clock}
        value={formatarHorasParaHMS(totalHoras)}
        subtext="Tempo total trabalhado"
        colorFrom="from-amber-400"
        colorTo="to-orange-600"
        iconColor="text-orange-600"
      />

      <HeroCard
        title={`Média ${viewMode === 'mensal' ? 'Mensal' : 'Semanal'}`}
        icon={BarChart2}
        value={mediaCorridas.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        subtext="Corridas por período"
        colorFrom="from-emerald-400"
        colorTo="to-teal-600"
        iconColor="text-emerald-600"
      />

      <HeroCard
        title="Período Analisado"
        icon={Calendar}
        value={anoSelecionado}
        subtext={`${viewMode === 'mensal' ? '12 meses' : '53 semanas'} disponíveis`}
        colorFrom="from-purple-400"
        colorTo="to-fuchsia-600"
        iconColor="text-purple-600"
      />
    </div>
  );
});

EvolucaoStatsCards.displayName = 'EvolucaoStatsCards';
