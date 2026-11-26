import React from 'react';
import { AlertCircle, RotateCcw, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { normalizeMetricNumber } from './metrics';
import { formatarHorasParaHMS } from '@/utils/formatters';
import type { Entregador } from '@/types';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { LoadingNotice } from '@/components/ui/loading-notice';
import { Button } from '@/components/ui/button';
import { ViewTransition } from '@/components/ui/view-transition';

interface DedicadoRankingProps {
  entregadores: Entregador[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function DedicadoRanking({ entregadores, loading, error, onRetry }: DedicadoRankingProps) {
  const isInitialLoading = loading && entregadores.length === 0;
  const viewKey = isInitialLoading
    ? 'dedicado-ranking-loading'
    : entregadores.length === 0
      ? 'dedicado-ranking-empty'
      : 'dedicado-ranking-content';

  return (
    <ViewTransition stateKey={viewKey} preventExitInteraction>
      {isInitialLoading ? (
        <DashboardSkeleton contentOnly />
      ) : entregadores.length === 0 ? (
        <Card className="border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/85">
          <CardContent className="p-10 text-center">
            {error ? <AlertCircle className="mx-auto mb-3 h-10 w-10 text-rose-500" /> : <Trophy className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-700" />}
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{error ? 'Erro ao carregar ranking' : 'Ranking sem dados'}</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {error ? 'Não foi possível carregar os entregadores para este ranking.' : 'Ajuste os filtros para encontrar entregadores dedicados.'}
            </p>
            {error && onRetry ? (
              <Button onClick={onRetry} variant="outline" className="mt-5 gap-2">
                <RotateCcw className="h-4 w-4" />
                Tentar novamente
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card className="min-w-0 overflow-hidden border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/85">
          {loading ? (
            <CardContent className="pb-0 pt-6">
              <LoadingNotice
                tone="blue"
                message="Atualizando ranking dedicado com os filtros atuais"
                detail="O ranking anterior continua visível durante a atualização."
              />
            </CardContent>
          ) : null}
          {error ? (
            <CardContent className="pb-0">
              <p role="alert" className="rounded-2xl border border-amber-200/70 bg-amber-50/85 px-4 py-3 text-sm font-semibold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-200">
                Não foi possível atualizar o ranking. Exibindo a resposta válida anterior.
              </p>
            </CardContent>
          ) : null}
          <CardHeader className="border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle className="text-lg font-black text-slate-950 dark:text-white">Ranking de aderência</CardTitle>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Ordenado pela mesma aderência usada na tabela de Entregadores do DEDICADO.
                </p>
              </div>
              <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-black tabular-nums text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
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
                      <tr key={`${entregador.id_entregador}-${index}`} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-950/50">
                        <td className="px-5 py-4 tabular-nums">
                          <span className={cn('inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 font-black tabular-nums', positionClass)}>
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
                            <p className="mt-1 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">{entregador.id_entregador}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right tabular-nums">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-black tabular-nums text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                            {normalizeMetricNumber(entregador.aderencia_percentual).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-200">{normalizeMetricNumber(entregador.corridas_completadas).toLocaleString('pt-BR')}</td>
                        <td className="px-5 py-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">{normalizeMetricNumber(entregador.corridas_ofertadas).toLocaleString('pt-BR')}</td>
                        <td className="px-5 py-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">{normalizeMetricNumber(entregador.corridas_aceitas).toLocaleString('pt-BR')}</td>
                        <td className="px-5 py-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">{normalizeMetricNumber(entregador.corridas_rejeitadas).toLocaleString('pt-BR')}</td>
                        <td className="px-5 py-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">{formatarHorasParaHMS(normalizeMetricNumber(entregador.total_segundos) / 3600)}</td>
                        <td className="px-5 py-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">{normalizeMetricNumber(entregador.rejeicao_percentual).toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </ViewTransition>
  );
}

export default DedicadoRanking;
