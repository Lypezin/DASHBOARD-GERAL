import React from 'react';
import { Users, BarChart3, Truck, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { formatMetricPercentOrNA } from './metrics';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { DedicadoInlineNotice } from './DedicadoInlineNotice';
import type { AderenciaOrigem } from '@/types';

type DedicadoOrigemRow = AderenciaOrigem & {
  segundos_realizados?: number;
  segundos_planejados?: number;
  taxa_aceitacao?: number;
  taxa_completude?: number;
};

interface DedicadoDashboardProps {
  loading: boolean;
  error?: string | null;
  stats: {
    entregadores: number;
    origens: number;
    ofertadas: number;
    aceitas: number;
    rejeitadas: number;
    completadas: number;
    segundos: number;
    segundosPlanejados?: number;
    taxaAceitacao: number;
    taxaRejeicao: number;
    taxaCompletude: number;
  };
  topOrigens: DedicadoOrigemRow[];
}

export function DedicadoDashboard({
  loading,
  error,
  stats,
  topOrigens,
}: DedicadoDashboardProps) {
  if (loading) return <DashboardSkeleton contentOnly />;

  const cards = [
    { title: 'Entregadores', value: stats.entregadores.toLocaleString('pt-BR'), sub: 'ativos no filtro dedicado', icon: Users, color: 'text-blue-500' },
    { title: 'Origens', value: stats.origens.toLocaleString('pt-BR'), sub: 'restaurantes/origens no filtro', icon: BarChart3, color: 'text-sky-500' },
    { title: 'Ofertadas', value: stats.ofertadas.toLocaleString('pt-BR'), sub: `${stats.taxaAceitacao.toFixed(1)}% aceitas`, icon: Truck, color: 'text-sky-500' },
    { title: 'Aceitas', value: stats.aceitas.toLocaleString('pt-BR'), sub: `${stats.taxaCompletude.toFixed(1)}% completadas`, icon: CheckCircle2, color: 'text-emerald-500' },
    { title: 'Rejeitadas', value: stats.rejeitadas.toLocaleString('pt-BR'), sub: `${stats.taxaRejeicao.toFixed(1)}% rejeição`, icon: XCircle, color: 'text-rose-500' },
    { title: 'Horas', value: formatarHorasParaHMS(stats.segundos / 3600), sub: 'tempo entregue', icon: Clock, color: 'text-orange-500', compact: true },
  ];

  return (
    <div className="space-y-6">
      {error ? <DedicadoInlineNotice message={error} /> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.title} className="min-w-0 border-slate-200/70 bg-white/90 shadow-sm transition-[border-color,box-shadow] hover:border-slate-300/80 hover:shadow-md dark:border-slate-800/70 dark:bg-slate-900/85 dark:hover:border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-slate-500 dark:text-slate-400 whitespace-normal break-words leading-tight pr-1">{card.title}</CardTitle>
                <Icon className={cn('h-4 w-4 shrink-0', card.color)} />
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    'font-mono font-black text-slate-950 dark:text-white',
                    card.compact
                      ? 'break-words text-lg tracking-tighter sm:text-xl 2xl:text-xl'
                      : 'break-words text-xl 2xl:text-2xl'
                  )}
                  title={card.value}
                >
                  {card.value}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400" title={card.sub}>{card.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/85">
        <CardHeader>
          <CardTitle className="text-lg font-black text-slate-950 dark:text-white">Top origens</CardTitle>
        </CardHeader>
        <CardContent>
          {topOrigens.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {topOrigens.map((origem) => (
                <div key={origem.origem} className="min-w-0 rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/30">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <p className="min-w-0 break-words pr-1 text-sm font-bold leading-snug text-slate-800 dark:text-slate-100">{origem.origem}</p>
                    <span className="w-fit shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                      Aderência {formatMetricPercentOrNA(origem.aderencia_percentual, Boolean(origem.segundos_planejados))}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-950/60">
                      <span className="block font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Ofertadas</span>
                      <span className="mt-0.5 block font-mono font-black text-slate-700 dark:text-slate-200">{(origem.corridas_ofertadas || 0).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="rounded-xl bg-emerald-50 px-3 py-2 dark:bg-emerald-950/20">
                      <span className="block font-bold uppercase tracking-wide text-emerald-500 dark:text-emerald-400">Aceitas</span>
                      <span className="mt-0.5 block break-words font-mono font-black text-emerald-700 dark:text-emerald-300">
                        {(origem.corridas_aceitas || 0).toLocaleString('pt-BR')} ({formatMetricPercentOrNA(origem.taxa_aceitacao, Boolean(origem.corridas_ofertadas))})
                      </span>
                    </div>
                    <div className="rounded-xl bg-sky-50 px-3 py-2 dark:bg-sky-950/20">
                      <span className="block font-bold uppercase tracking-wide text-sky-500 dark:text-sky-300">Completadas</span>
                      <span className="mt-0.5 block break-words font-mono font-black text-sky-700 dark:text-sky-300">
                        {(origem.corridas_completadas || 0).toLocaleString('pt-BR')} ({formatMetricPercentOrNA(origem.taxa_completude, Boolean(origem.corridas_aceitas))})
                      </span>
                    </div>
                    <div className="rounded-xl bg-orange-50 px-3 py-2 dark:bg-orange-950/20">
                      <span className="block font-bold uppercase tracking-wide text-orange-500 dark:text-orange-400">Horas</span>
                      <span className="mt-0.5 block break-words font-mono font-black text-orange-700 dark:text-orange-300">
                        {formatarHorasParaHMS((origem.segundos_realizados || 0) / 3600)}
                        {origem.segundos_planejados ? ` / ${formatarHorasParaHMS((origem.segundos_planejados || 0) / 3600)}` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Nenhuma origem encontrada no resumo do período atual.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DedicadoDashboard;
