import React from 'react';
import { safeLog } from '@/lib/errorHandler';
import { UtrData } from '@/types';
import { AlertTriangle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
      <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-center gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
        <p className="text-sm text-amber-700 dark:text-amber-300">UTR não disponível para as semanas selecionadas.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">UTR</h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-slate-50/80 dark:bg-slate-800/30">
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-5">
                Métrica
              </TableHead>
              {semanasSelecionadas.map((semana) => (
                <TableHead key={semana} className="text-center text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 border-l border-slate-100 dark:border-slate-800">
                  Sem. {semana}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
              <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-300 pl-5">
                UTR Geral
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
                  <TableCell key={idx} className="text-center border-l border-slate-100 dark:border-slate-800">
                    {hasError ? (
                      <span className="text-sm text-slate-400">N/D</span>
                    ) : (
                      <span className={`text-sm font-semibold tabular-nums ${utrValue >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                          utrValue >= 60 ? 'text-amber-600 dark:text-amber-400' :
                            'text-red-600 dark:text-red-400'
                        }`}>
                        {utrValue.toFixed(2)}%
                      </span>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
