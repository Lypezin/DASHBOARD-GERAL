import React from 'react';
import { safeLog } from '@/lib/errorHandler';
import { UtrData } from '@/types';
import { Target, AlertTriangle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SectionCard } from './components/SectionCard';

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
      <div className="rounded-2xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10 p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
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
    <SectionCard
      title="UTR - Utilização de Tempo Real"
      description="Indicador de eficiência na utilização do tempo disponível"
      icon={<Target className="h-5 w-5" />}
      iconColor="text-violet-600 dark:text-violet-400"
      noPadding
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/60 dark:bg-slate-800/40">
              <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Métrica
              </TableHead>
              {semanasSelecionadas.map((semana) => (
                <TableHead key={semana} className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-l border-slate-200/50 dark:border-slate-700/50">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-semibold">
                    Semana {semana}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <TableCell className="font-medium text-slate-900 dark:text-white">
                <div className="flex items-center justify-center gap-2">
                  <div className="p-1.5 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                    <Target className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <span className="font-semibold">UTR Geral</span>
                </div>
              </TableCell>
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
                  <TableCell key={idx} className="text-center border-l border-slate-200/50 dark:border-slate-700/50">
                    {hasError ? (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                        N/D
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-violet-100 dark:bg-violet-900/30 px-4 py-1.5 text-base font-bold text-violet-700 dark:text-violet-300">
                        {typeof utrValue === 'number' ? utrValue.toFixed(2) : '0.00'}%
                      </span>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </SectionCard>
  );
};
