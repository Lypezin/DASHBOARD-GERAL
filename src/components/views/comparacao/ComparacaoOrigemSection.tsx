import React from 'react';
import { DashboardResumoData } from '@/types';
import { ViewToggleButton } from '../ViewToggleButton';
import { ComparacaoCharts } from './ComparacaoCharts';
import { VariacaoBadge } from '@/components/VariacaoBadge';
import { calcularVariacaoPercentual } from '@/utils/comparacaoCalculations';
import { METRICAS_ORIGEM } from '@/constants/comparacao';

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
    <div className="rounded-xl border border-fuchsia-200 bg-white shadow-lg dark:border-fuchsia-800 dark:bg-slate-900">
      <div className="border-b border-fuchsia-200 bg-gradient-to-r from-fuchsia-50 to-violet-50 px-6 py-4 dark:border-fuchsia-800 dark:from-fuchsia-950/30 dark:to-violet-950/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
            <h3 className="flex items-center justify-center gap-2 text-lg font-bold text-slate-900 dark:text-white sm:justify-start">
              <span className="text-xl">🌐</span>
              Comparação por Origem
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Avalie corridas e aderência por origem entre as semanas selecionadas
            </p>
          </div>
          <div className="flex justify-center gap-2 sm:justify-end">
            <ViewToggleButton
              active={viewMode === 'table'}
              onClick={() => onViewModeChange('table')}
              label="📋 Tabela"
            />
            <ViewToggleButton
              active={viewMode === 'chart'}
              onClick={() => onViewModeChange('chart')}
              label="📊 Gráfico"
            />
          </div>
        </div>
      </div>
      {viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-fuchsia-50 dark:bg-fuchsia-950/30">
              <tr className="border-b border-fuchsia-200 dark:border-fuchsia-800">
                <th rowSpan={2} className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-fuchsia-900 dark:text-fuchsia-100 align-middle">
                  Origem / Métrica
                </th>
                {semanasSelecionadas.map((semana, idx) => (
                  <th
                    key={`origem-head-${semana}`}
                    colSpan={idx === 0 ? 1 : 2}
                    className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-fuchsia-900 dark:text-fuchsia-100"
                  >
                    Semana {semana}
                  </th>
                ))}
              </tr>
              <tr className="border-b border-fuchsia-200/60 dark:border-fuchsia-800/60">
                {semanasSelecionadas.map((semana, idx) =>
                  idx === 0 ? (
                    <th
                      key={`origem-sub-${semana}-valor`}
                      className="px-6 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-fuchsia-800 dark:text-fuchsia-200"
                    >
                      Valor
                    </th>
                  ) : (
                    <React.Fragment key={`origem-sub-${semana}`}>
                      <th className="px-6 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-fuchsia-800 dark:text-fuchsia-200">
                        Valor
                      </th>
                      <th className="px-6 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-fuchsia-800 dark:text-fuchsia-200">
                        Δ%
                      </th>
                    </React.Fragment>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-fuchsia-100 dark:divide-fuchsia-900">
              {origensDisponiveis.map((origem) => {
                const origemLabel = origem || 'N/D';
                return (
                  <React.Fragment key={origemLabel}>
                    <tr className="bg-fuchsia-100 dark:bg-fuchsia-950/40">
                      <td colSpan={totalColunasOrigem + 1} className="px-6 py-3 font-bold text-fuchsia-900 dark:text-fuchsia-100">
                        🌐 {origemLabel}
                      </td>
                    </tr>
                    {METRICAS_ORIGEM.map((metrica) => (
                      <tr
                        key={`${origemLabel}-${metrica.key}`}
                        className="bg-white dark:bg-slate-900"
                      >
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{metrica.icon}</span>
                            {metrica.label}
                          </div>
                        </td>
                        {dadosComparacao.map((dados, idx) => {
                          const origemAtual =
                            dados.origem?.find((item) => (item.origem || '').trim() === origem) || ({} as any);
                          const valorAtual = Number(
                            origemAtual?.[metrica.key as keyof typeof origemAtual] ?? 0
                          );
                          let variacao: number | null = null;
                          if (idx > 0) {
                            const dadosAnterior = dadosComparacao[idx - 1];
                            const origemAnterior =
                              dadosAnterior.origem?.find((item) => (item.origem || '').trim() === origem) ||
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
                              <td className="px-6 py-4 text-center text-base font-semibold text-slate-700 dark:text-slate-300 border-l-2 border-slate-300 dark:border-slate-600">
                                {valorFormatado}
                              </td>
                              {idx > 0 && (
                                <td className="px-4 py-4 text-center">
                                  <VariacaoBadge
                                    variacao={Number.isFinite(variacao ?? 0) ? (variacao ?? 0) : 0}
                                    className="px-2.5 py-1 text-sm"
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
        <ComparacaoCharts
          dadosComparacao={dadosComparacao}
          semanasSelecionadas={semanasSelecionadas}
          viewMode={viewMode}
          chartType="origem"
          origensDisponiveis={origensDisponiveis}
        />
      )}
    </div>
  );
};

