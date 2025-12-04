import React from 'react';
import { DashboardResumoData } from '@/types';
import { ViewToggleButton } from '../ViewToggleButton';
import { ComparacaoCharts } from './ComparacaoCharts';
import { VariacaoBadge } from '@/components/VariacaoBadge';
import { calcularVariacaoPercentual } from '@/utils/comparacaoCalculations';
import { METRICAS_ORIGEM } from '@/constants/comparacao';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Globe } from 'lucide-react';

interface ComparacaoOrigemSectionProps {
  dadosComparacao: DashboardResumoData[];
  semanasSelecionadas: string[];
  viewMode: 'table' | 'chart';
  onViewModeChange: (mode: 'table' | 'chart') => void;
  origensDisponiveis: string[];
  totalColunasOrigem: number;
}

export const ComparacaoOrigemSection: React.FC<ComparacaoOrigemSectionProps> = ({
  dadosComparacao,
  semanasSelecionadas,
  viewMode,
  onViewModeChange,
  origensDisponiveis,
  totalColunasOrigem,
}) => {
  if (origensDisponiveis.length === 0) {
    return null;
  }

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
      <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <Globe className="h-5 w-5 text-fuchsia-500" />
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Comparação por Origem
              </CardTitle>
            </div>
            <CardDescription className="mt-1 text-slate-500 dark:text-slate-400">
              Avalie corridas e aderência por origem entre as semanas selecionadas
            </CardDescription>
          </div>
          <div className="flex justify-center gap-2 sm:justify-end">
            <ViewToggleButton
              active={viewMode === 'table'}
              onClick={() => onViewModeChange('table')}
              label="Tabela"
            />
            <ViewToggleButton
              active={viewMode === 'chart'}
              onClick={() => onViewModeChange('chart')}
              label="Gráfico"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th rowSpan={2} className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 align-middle">
                    Origem / Métrica
                  </th>
                  {semanasSelecionadas.map((semana, idx) => (
                    <th
                      key={`origem-head-${semana}`}
                      colSpan={idx === 0 ? 1 : 2}
                      className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700"
                    >
                      Semana {semana}
                    </th>
                  ))}
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  {semanasSelecionadas.map((semana, idx) =>
                    idx === 0 ? (
                      <th
                        key={`origem-sub-${semana}-valor`}
                        className="px-6 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700"
                      >
                        Valor
                      </th>
                    ) : (
                      <React.Fragment key={`origem-sub-${semana}`}>
                        <th className="px-6 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700">
                          Valor
                        </th>
                        <th className="px-6 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Δ%
                        </th>
                      </React.Fragment>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {origensDisponiveis.map((origem) => {
                  const origemLabel = origem || 'N/D';
                  return (
                    <React.Fragment key={origemLabel}>
                      <tr className="bg-fuchsia-50/50 dark:bg-fuchsia-900/10">
                        <td colSpan={totalColunasOrigem + 1} className="px-6 py-3 font-semibold text-fuchsia-900 dark:text-fuchsia-100 flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          {origemLabel}
                        </td>
                      </tr>
                      {METRICAS_ORIGEM.map((metrica) => (
                        <tr
                          key={`${origemLabel}-${metrica.key}`}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{metrica.icon}</span>
                              {metrica.label}
                            </div>
                          </td>
                          {dadosComparacao.map((dados, idx) => {
                            // Use aderencia_origem (main) with fallback to origem (alias)
                            const origemAtual =
                              (dados.aderencia_origem || dados.origem)?.find((item) => (item.origem || '').trim() === origem) || ({} as any);
                            const valorAtual = Number(
                              origemAtual?.[metrica.key as keyof typeof origemAtual] ?? 0
                            );
                            let variacao: number | null = null;
                            if (idx > 0) {
                              const dadosAnterior = dadosComparacao[idx - 1];
                              const origemAnterior =
                                (dadosAnterior.aderencia_origem || dadosAnterior.origem)?.find((item) => (item.origem || '').trim() === origem) ||
                                ({} as any);
                              const valorAnterior = Number(
                                origemAnterior?.[metrica.key as keyof typeof origemAnterior] ?? 0
                              );
                              variacao = calcularVariacaoPercentual(valorAnterior, valorAtual);
                            }
                            const valorFormatado =
                              metrica.tipo === 'percent'
                                ? `${valorAtual.toFixed(1)}%`
                                : valorAtual.toLocaleString('pt-BR');
                            return (
                              <React.Fragment key={`${idx}-${metrica.key}`}>
                                <td className="px-6 py-4 text-center text-sm text-slate-600 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700">
                                  {valorFormatado}
                                </td>
                                {idx > 0 && (
                                  <td className="px-4 py-4 text-center">
                                    <VariacaoBadge
                                      variacao={Number.isFinite(variacao ?? 0) ? (variacao ?? 0) : 0}
                                      className="px-2 py-0.5 text-xs"
                                      invertColors={Boolean(metrica.invertColors)}
                                    />
                                  </td>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <ComparacaoCharts
              dadosComparacao={dadosComparacao}
              semanasSelecionadas={semanasSelecionadas}
              viewMode={viewMode}
              chartType="origem"
              origensDisponiveis={origensDisponiveis}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
