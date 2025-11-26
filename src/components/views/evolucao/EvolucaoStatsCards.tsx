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

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total de Corridas */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total de Corridas</p>
            <Car className="h-4 w-4 text-blue-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {totalCorridas.toLocaleString('pt-BR')}
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {dadosAtivos.length} {viewMode === 'mensal' ? 'meses' : 'semanas'} analisadas
          </p>
        </CardContent>
      </Card>

      {/* Total de Horas */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total de Horas</p>
            <Clock className="h-4 w-4 text-orange-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatarHorasParaHMS(totalHoras)}
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tempo total trabalhado
          </p>
        </CardContent>
      </Card>

      {/* Média de Corridas */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Média {viewMode === 'mensal' ? 'Mensal' : 'Semanal'}
            </p>
            <BarChart2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {mediaCorridas.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Corridas por período
          </p>
        </CardContent>
      </Card>

      {/* Período */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Período Analisado</p>
            <Calendar className="h-4 w-4 text-purple-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {anoSelecionado}
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {viewMode === 'mensal' ? '12 meses' : '53 semanas'} disponíveis
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
