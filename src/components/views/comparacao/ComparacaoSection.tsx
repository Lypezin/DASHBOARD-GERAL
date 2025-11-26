import React from 'react';
import { DashboardResumoData } from '@/types';
import { ViewToggleButton } from '../ViewToggleButton';
import { ComparacaoCharts } from './ComparacaoCharts';
import { VariacaoBadge } from '@/components/VariacaoBadge';
import { calcularVariacaoPercentual } from '@/utils/comparacaoCalculations';
import { DIAS_DA_SEMANA } from '@/constants/comparacao';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ComparacaoSectionProps {
  title: string;
  icon: React.ReactNode;
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
}) => {
  if (type === 'dia') {
    return (
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                {icon}
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                  {title}
                </CardTitle>
              </div>
              <CardDescription className="mt-1 text-slate-500 dark:text-slate-400">
                {description}
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
                      Dia
                    </th>
                    {semanasSelecionadas.map((semana, idx) => (
                      <th
                        key={`aderencia-${semana}`}
                        colSpan={idx === 0 ? 1 : 2}
                        className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                      >
                        Semana {semana}
                      </th>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    {semanasSelecionadas.map((semana, idx) =>
                      idx === 0 ? (
                        <th key={`aderencia-${semana}-valor`} className="px-6 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Valor
                        </th>
                      ) : (
                        <React.Fragment key={`aderencia-${semana}`}>
                          <th className="px-6 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
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
                  {DIAS_DA_SEMANA.map((dia, diaIdx) => (
                    <tr key={dia} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 text-center font-medium text-slate-900 dark:text-white">{dia}</td>
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
                              <span className="font-medium text-slate-700 dark:text-slate-300">
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
            <div className="p-6">
              <ComparacaoCharts
                dadosComparacao={dadosComparacao}
                semanasSelecionadas={semanasSelecionadas}
                viewMode={viewMode}
                chartType="dia"
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Para sub-praça e origem, retornar null por enquanto (será implementado separadamente)
  return null;
};
