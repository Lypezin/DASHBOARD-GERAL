import React from 'react';
import { Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { normalizeMetricNumber } from './metrics';
import { formatarHorasParaHMS } from '@/utils/formatters';
import type { Entregador } from '@/types';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';

interface DedicadoRankingProps {
  entregadores: Entregador[];
  loading: boolean;
}

export function DedicadoRanking({ entregadores, loading }: DedicadoRankingProps) {
  if (loading) return <DashboardSkeleton contentOnly />;

  if (entregadores.length === 0) {
    return (
      <Card className="border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/85">
        <CardContent className="p-10 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-700" />
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Ranking sem dados</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Ajuste os filtros ou aguarde a carga dos entregadores dedicados para montar o ranking.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-w-0 overflow-hidden border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/85">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="text-lg font-black text-slate-950 dark:text-white">Ranking de aderência</CardTitle>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Ordenado pela mesma aderência usada na tabela de Entregadores do DEDICADO.
            </p>
          </div>
          <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            {entregadores.length.toLocaleString('pt-BR')} entregadores
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="subtle-scrollbar overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
              <tr>
                <th className="px-5 py-4 text-left">#</th>
                <th className="px-5 py-4 text-left">Entregador</th>
                <th className="px-5 py-4 text-right">Aderência</th>
                <th className="px-5 py-4 text-right">Completadas</th>
                <th className="px-5 py-4 text-right">Ofertadas</th>
                <th className="px-5 py-4 text-right">Aceitas</th>
                <th className="px-5 py-4 text-right">Rejeitadas</th>
                <th className="px-5 py-4 text-right">Horas</th>
                <th className="px-5 py-4 text-right">Rejeição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {entregadores.map((entregador, index) => {
                const baixoVolume = normalizeMetricNumber(entregador.corridas_ofertadas) < 20;
                const positionClass = index === 0
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
                  : index === 1
                    ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                    : index === 2
                      ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300'
                      : 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300';

                return (
                  <tr key={`${entregador.id_entregador}-${index}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-950/50">
                    <td className="px-5 py-4">
                      <span className={cn('inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 font-black', positionClass)}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-slate-900 dark:text-white">{entregador.nome_entregador || 'Sem nome'}</p>
                          {baixoVolume ? (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                              baixo volume
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">{entregador.id_entregador}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-black text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                        {normalizeMetricNumber(entregador.aderencia_percentual).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-semibold text-slate-700 dark:text-slate-200">{normalizeMetricNumber(entregador.corridas_completadas).toLocaleString('pt-BR')}</td>
                    <td className="px-5 py-4 text-right font-mono text-slate-600 dark:text-slate-300">{normalizeMetricNumber(entregador.corridas_ofertadas).toLocaleString('pt-BR')}</td>
                    <td className="px-5 py-4 text-right font-mono text-slate-600 dark:text-slate-300">{normalizeMetricNumber(entregador.corridas_aceitas).toLocaleString('pt-BR')}</td>
                    <td className="px-5 py-4 text-right font-mono text-slate-600 dark:text-slate-300">{normalizeMetricNumber(entregador.corridas_rejeitadas).toLocaleString('pt-BR')}</td>
                    <td className="px-5 py-4 text-right font-mono text-slate-600 dark:text-slate-300">{formatarHorasParaHMS(normalizeMetricNumber(entregador.total_segundos) / 3600)}</td>
                    <td className="px-5 py-4 text-right font-mono text-slate-600 dark:text-slate-300">{normalizeMetricNumber(entregador.rejeicao_percentual).toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default DedicadoRanking;
