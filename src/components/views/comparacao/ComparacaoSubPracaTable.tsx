
import React from 'react';
import { DashboardResumoData } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Map } from 'lucide-react';
import { ComparacaoSubPracaRow, SubPracaMetric } from './components/ComparacaoSubPracaRow';
import { processSubPracaData } from './utils/processSubPracaData';

interface ComparacaoSubPracaTableProps {
  dadosComparacao: DashboardResumoData[];
  semanasSelecionadas: (number | string)[];
}

export const ComparacaoSubPracaTable: React.FC<ComparacaoSubPracaTableProps> = ({
  dadosComparacao,
  semanasSelecionadas,
}) => {
  const { subPracasOrdenadas, dadosPorSubPraca } = React.useMemo(() => {
    return processSubPracaData(dadosComparacao);
  }, [dadosComparacao]);

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-4 mb-6 px-8 select-none">
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
          <span className="text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Meta (H. Plan)</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          <span className="text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Entregue (Realizado)</span>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-none">
              <TableHead rowSpan={2} className="sticky left-0 z-20 bg-white dark:bg-slate-900 w-[140px] sm:w-[180px] text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 pl-8 pb-4 align-bottom">
                Sub-Praça
              </TableHead>
              {semanasSelecionadas.map((semana) => {
                const semanaStr = String(semana).replace('W', '');
                return (
                  <TableHead key={semana} colSpan={4} className="text-center pb-2">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-widest ring-1 ring-inset ring-slate-200 dark:ring-slate-700">
                        Semana {semanaStr}
                    </span>
                  </TableHead>
                );
              })}
            </TableRow>
            <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800/50">
              {semanasSelecionadas.map((semana) => (
                <React.Fragment key={`subheader-${semana}`}>
                  <TableHead className="text-center font-bold text-slate-400 dark:text-slate-500 h-10 text-[10px] uppercase tracking-widest min-w-[70px] pb-4">Meta</TableHead>
                  <TableHead className="text-center font-bold text-slate-400 dark:text-slate-500 h-10 text-[10px] uppercase tracking-widest min-w-[70px] pb-4">Real</TableHead>
                  <TableHead className="text-center font-bold text-slate-400 dark:text-slate-500 h-10 text-[10px] uppercase tracking-widest min-w-[70px] pb-4">%</TableHead>
                  <TableHead className="text-center font-bold text-slate-400 dark:text-slate-500 h-10 text-[10px] uppercase tracking-widest min-w-[60px] pb-4">Var</TableHead>
                </React.Fragment>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {subPracasOrdenadas.map((subPraca, index) => (
              <ComparacaoSubPracaRow
                key={subPraca}
                subPraca={subPraca}
                index={index}
                semanasSelecionadas={semanasSelecionadas}
                dadosPorSubPraca={dadosPorSubPraca}
              />
            ))}
            {subPracasOrdenadas.length === 0 && (
              <TableRow>
                <TableCell colSpan={semanasSelecionadas.length * 4 + 1} className="text-center py-8 text-slate-500 dark:text-slate-400">
                  Nenhum dado de sub-praça disponível para as semanas selecionadas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
