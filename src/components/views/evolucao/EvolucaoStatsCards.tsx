import React from 'react';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Clock, BarChart2, Calendar } from 'lucide-react';

interface EvolucaoStatsCardsProps {
  dadosAtivos: any[];
  viewMode: 'mensal' | 'semanal';
  anoSelecionado: number;
}

export const EvolucaoStatsCards: React.FC<EvolucaoStatsCardsProps> = ({
  dadosAtivos,
  viewMode,
  anoSelecionado,
}) => {
  if (dadosAtivos.length === 0) {
    return null;
  }

  const totalCorridas = dadosAtivos.reduce((sum, d) => sum + ((d as any).corridas_completadas || (d as any).total_corridas || 0), 0);
  const totalHoras = dadosAtivos.reduce((sum, d) => sum + d.total_segundos, 0) / 3600;
  const mediaCorridas = dadosAtivos.length > 0 ? totalCorridas / dadosAtivos.length : 0;

  // Helper Component for Premium Cards
  const StatCard = ({
    title,
    icon: Icon,
    value,
    subtext,
    colorClass,
    bgClass,
    iconBgClass
  }: {
    title: string;
    icon: any;
    value: string | number;
    subtext: string;
    colorClass: string;
    bgClass: string;
    iconBgClass: string;
  }) => (
    <Card className={`border-none shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden relative ${bgClass}`}>
      <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500`}>
        <Icon className="w-16 h-16" />
      </div>

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-xl ${iconBgClass} transition-shadow duration-300 group-hover:shadow-md`}>
          <Icon className={`h-4 w-4 ${colorClass}`} />
        </div>
      </CardHeader>
      <CardContent className="z-10 relative">
        <div className={`text-2xl font-bold tracking-tight ${colorClass} font-mono mb-1`}>
          {value}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium opacity-80">
          {subtext}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total de Corridas"
        icon={Car}
        value={totalCorridas.toLocaleString('pt-BR')}
        subtext={`${dadosAtivos.length} ${viewMode === 'mensal' ? 'meses' : 'semanas'} analisadas`}
        colorClass="text-blue-600 dark:text-blue-400"
        bgClass="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-900"
        iconBgClass="bg-blue-100 dark:bg-blue-900/40"
      />

      <StatCard
        title="Total de Horas"
        icon={Clock}
        value={formatarHorasParaHMS(totalHoras)}
        subtext="Tempo total trabalhado"
        colorClass="text-orange-600 dark:text-orange-400"
        bgClass="bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-slate-900"
        iconBgClass="bg-orange-100 dark:bg-orange-900/40"
      />

      <StatCard
        title={`Média ${viewMode === 'mensal' ? 'Mensal' : 'Semanal'}`}
        icon={BarChart2}
        value={mediaCorridas.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        subtext="Corridas por período"
        colorClass="text-emerald-600 dark:text-emerald-400"
        bgClass="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-900"
        iconBgClass="bg-emerald-100 dark:bg-emerald-900/40"
      />

      <StatCard
        title="Período Analisado"
        icon={Calendar}
        value={anoSelecionado}
        subtext={`${viewMode === 'mensal' ? '12 meses' : '53 semanas'} disponíveis`}
        colorClass="text-purple-600 dark:text-purple-400"
        bgClass="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-slate-900"
        iconBgClass="bg-purple-100 dark:bg-purple-900/40"
      />
    </div>
  );
};
