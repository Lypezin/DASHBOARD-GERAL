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
      <div className="rounded-xl border border-amber-200/50 bg-gradient-to-br from-amber-50 to-orange-50 p-6 dark:border-amber-900/30 dark:from-amber-900/10 dark:to-orange-900/10 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-100">UTR não disponível</p>
            <p className="text-sm text-amber-700 dark:text-amber-300/80">Os dados de UTR não foram carregados para as semanas selecionadas.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="relative overflow-hidden border-none shadow-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-3xl">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="relative z-10 pb-6">
        <div className="flex items-center gap-3 justify-center">
          <div className="p-3 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl shadow-lg shadow-violet-500/30">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div className="text-center">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              UTR - Utilização de Tempo Real
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Indicador de eficiência na utilização do tempo disponível
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50">
              <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Métrica</th>
                {semanasSelecionadas.map((semana) => (
                  <th key={semana} className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-l border-slate-200/50 dark:border-slate-700/50">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                      Semana {semana}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-5 font-medium text-slate-900 dark:text-white">
                  <div className="flex items-center justify-center gap-2">
                    <div className="p-1.5 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                      <Target className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <span className="font-semibold">UTR Geral</span>
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
                    <td key={idx} className="px-6 py-5 text-center border-l border-slate-200/50 dark:border-slate-700/50">
                      {hasError ? (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-300" title="Erro ao calcular UTR">
                          N/D
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 px-5 py-2 text-lg font-bold text-white shadow-lg shadow-violet-500/25">
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

