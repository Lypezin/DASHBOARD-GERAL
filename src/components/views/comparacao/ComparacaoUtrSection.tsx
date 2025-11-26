import React from 'react';
import { safeLog } from '@/lib/errorHandler';
import { UtrData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Target, AlertTriangle } from 'lucide-react';

interface UtrComparacaoItem {
  semana: string;
  utr: UtrData | null;
}

interface ComparacaoUtrSectionProps {
  utrComparacao: UtrComparacaoItem[];
  semanasSelecionadas: string[];
}

export const ComparacaoUtrSection: React.FC<ComparacaoUtrSectionProps> = ({
  utrComparacao,
  semanasSelecionadas,
}) => {
  if (utrComparacao.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/50 dark:bg-amber-900/10">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:text-left">
          <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-100">UTR não disponível</p>
            <p className="text-sm text-amber-700 dark:text-amber-300/80">Os dados de UTR não foram carregados para as semanas selecionadas.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
      <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <Target className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              UTR - Utilização de Tempo Real
            </CardTitle>
          </div>
          <CardDescription className="mt-1 text-slate-500 dark:text-slate-400">
            Indicador de eficiência na utilização do tempo disponível
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:text-left">Métrica</th>
                {semanasSelecionadas.map((semana) => (
                  <th key={semana} className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700">
                    Semana {semana}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                  <div className="flex items-center justify-center gap-2 sm:justify-start">
                    <Target className="h-4 w-4 text-purple-500" />
                    UTR Geral
                  </div>
                </td>
                {utrComparacao.map((item, idx) => {
                  let utrValue = 0;
                  let hasError = false;

                  if (item.utr) {
                    if (item.utr.geral && typeof item.utr.geral === 'object' && 'utr' in item.utr.geral) {
                      utrValue = item.utr.geral.utr ?? 0;
                    }
                  } else {
                    hasError = true;
                  }

                  safeLog.info(`📊 UTR Semana ${item.semana}:`, { utr: utrValue, hasError });

                  return (
                    <td key={idx} className="px-6 py-4 text-center border-l border-slate-200 dark:border-slate-700">
                      {hasError ? (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-300" title="Erro ao calcular UTR">
                          N/D
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-sm font-bold text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                          {typeof utrValue === 'number' ? utrValue.toFixed(2) : '0.00'}%
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
