import React from 'react';
import { DashboardResumoData } from '@/types';
import { ViewToggleButton } from '../ViewToggleButton';
import { ComparacaoCharts } from './ComparacaoCharts';
import { VariacaoBadge } from '@/components/VariacaoBadge';
import { calcularVariacaoPercentual } from '@/utils/comparacaoCalculations';
import { DIAS_DA_SEMANA, METRICAS_ORIGEM } from '@/constants/comparacao';
import { formatarHorasParaHMS } from '@/utils/formatters';

interface ComparacaoSectionProps {
  title: string;
  icon: string;
  description: string;
  type: 'dia' | 'subPraca' | 'origem';
  dadosComparacao: DashboardResumoData[];
  semanasSelecionadas: string[];
  viewMode: 'table' | 'chart';
  onViewModeChange: (mode: 'table' | 'chart') => void;
  origensDisponiveis?: string[];
  totalColunasOrigem?: number;
}

export const ComparacaoSection: React.FC<ComparacaoSectionProps> = ({
  title,
  icon,
  description,
  type,
  dadosComparacao,
  semanasSelecionadas,
  viewMode,
  onViewModeChange,
  origensDisponiveis = [],
  totalColunasOrigem = 0,
}) => {
  if (type === 'dia') {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 px-6 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-indigo-950/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center sm:text-left">
              <h3 className="flex items-center justify-center gap-2 text-lg font-bold text-slate-900 dark:text-white sm:justify-start">
                <span className="text-xl">{icon}</span>
                {title}
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
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
          <div className="overflow-x-auto p-6">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th rowSpan={2} className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 align-middle">
                    Dia
                  </th>
                  {semanasSelecionadas.map((semana, idx) => (
                    <th
                      key={`aderencia-${semana}`}
                      colSpan={idx === 0 ? 1 : 2}
                      className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                    >
                      Semana {semana}
                    </th>
                  ))}
                </tr>
                <tr className="border-b border-slate-200/60 dark:border-slate-700/60">
                  {semanasSelecionadas.map((semana, idx) =>
                    idx === 0 ? (
                      <th key={`aderencia-${semana}-valor`} className="px-6 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-200">
                        Valor
                      </th>
                    ) : (
                      <React.Fragment key={`aderencia-${semana}`}>
                        <th className="px-6 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-200">
                          Valor
                        </th>
                        <th className="px-6 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-200">
                          Δ%
                        </th>
                      </React.Fragment>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {DIAS_DA_SEMANA.map((dia, diaIdx) => (
                  <tr key={dia} className={diaIdx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/30'}>
                    <td className="px-6 py-4 text-center font-semibold text-slate-900 dark:text-white">{dia}</td>
                    {dadosComparacao.map((dados, idx) => {
                      const diaData = dados.dia?.find(d => d.dia_da_semana === dia);
                      const aderencia = diaData?.aderencia_percentual ?? 0;
                      
                      let variacao = null;
                      if (idx > 0) {
                        const dadosAnterior = dadosComparacao[idx - 1];
                        const diaDataAnterior = dadosAnterior.dia?.find(d => d.dia_da_semana === dia);
                        const aderenciaAnterior = diaDataAnterior?.aderencia_percentual ?? 0;
                        variacao = calcularVariacaoPercentual(aderenciaAnterior, aderencia);
                      }
                      
                      return (
                        <React.Fragment key={idx}>
                          <td className="px-6 py-4 text-center">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {aderencia.toFixed(1)}%
                            </span>
                          </td>
                          {idx > 0 && variacao !== null && (
                            <td className="px-6 py-4 text-center">
                              <VariacaoBadge variacao={variacao} className="px-2 py-0.5 text-xs" />
                            </td>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ComparacaoCharts
            dadosComparacao={dadosComparacao}
            semanasSelecionadas={semanasSelecionadas}
            viewMode={viewMode}
            chartType="dia"
          />
        )}
      </div>
    );
  }

  // Para sub-praça e origem, retornar null por enquanto (será implementado separadamente)
  return null;
};

