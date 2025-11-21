import React from 'react';
import { safeLog } from '@/lib/errorHandler';
import { UtrData } from '@/types';

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
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/20">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:text-left">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-100">UTR não disponível</p>
            <p className="text-sm text-amber-700 dark:text-amber-300">Os dados de UTR não foram carregados para as semanas selecionadas.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-purple-200 bg-white shadow-lg dark:border-purple-800 dark:bg-slate-900">
      <div className="border-b border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 dark:border-purple-800 dark:from-purple-950/30 dark:to-pink-950/30">
        <div className="text-center sm:text-left">
          <h3 className="flex items-center justify-center gap-2 text-lg font-bold text-slate-900 dark:text-white sm:justify-start">
            <span className="text-xl">🎯</span>
            UTR - Utilização de Tempo Real
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Indicador de eficiência na utilização do tempo disponível
          </p>
        </div>
      </div>
      <div className="overflow-x-auto p-6">
        <table className="w-full">
          <thead className="bg-purple-50 dark:bg-purple-950/30">
            <tr className="border-b-2 border-purple-200 dark:border-purple-800">
              <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-100 sm:text-left">Métrica</th>
              {semanasSelecionadas.map((semana) => (
                <th key={semana} className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-100">
                  Semana {semana}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-100 dark:divide-purple-900">
            <tr className="bg-white dark:bg-slate-900">
              <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                <div className="flex items-center justify-center gap-2 sm:justify-start">
                  <span className="text-lg">🎯</span>
                  UTR Geral
                </div>
              </td>
              {utrComparacao.map((item, idx) => {
                let utrValue = 0;
                
                if (item.utr) {
                  if (item.utr.geral && typeof item.utr.geral === 'object' && 'utr' in item.utr.geral) {
                    utrValue = item.utr.geral.utr ?? 0;
                  }
                }
                
                safeLog.info(`📊 UTR Semana ${item.semana}:`, { utr: utrValue });
                
                return (
                  <td key={idx} className="px-6 py-4 text-center">
                    <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-lg font-bold text-purple-900 dark:bg-purple-900/30 dark:text-purple-100">
                      {typeof utrValue === 'number' ? utrValue.toFixed(2) : '0.00'}%
                    </span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

