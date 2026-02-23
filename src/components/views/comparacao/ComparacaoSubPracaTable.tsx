
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
import { formatarHorasParaHMS } from '@/utils/formatters';

interface ComparacaoSubPracaTableProps {
  dadosComparacao: DashboardResumoData[];
  semanasSelecionadas: (number | string)[];
}

export const ComparacaoSubPracaTable: React.FC<ComparacaoSubPracaTableProps> = ({
  dadosComparacao,
  semanasSelecionadas,
}) => {
  // 1. Extrair todas as sub-praças disponíveis nos dados
  const todasSubPracas = new Set<string>();
  dadosComparacao.forEach((d) => {
    if (d.aderencia_sub_praca && Array.isArray(d.aderencia_sub_praca)) {
      d.aderencia_sub_praca.forEach((asp) => {
        todasSubPracas.add(asp.sub_praca);
      });
    }
  });
  const subPracasOrdenadas = Array.from(todasSubPracas).sort();

  // 2. Mapear dados
  const dadosPorSubPraca: Record<string, Record<number, SubPracaMetric>> = {};
  subPracasOrdenadas.forEach((sp) => {
    dadosPorSubPraca[sp] = {};
    dadosComparacao.forEach((dado, idx) => {
      const spData = dado.aderencia_sub_praca?.find((x) => x.sub_praca === sp);

      let entregueStr = spData?.horas_entregues || '-';
      let metaStr = spData?.horas_a_entregar || '-';

      // Fallback calculation using seconds if strings are missing
      if ((!spData?.horas_entregues || spData?.horas_entregues === '00:00:00') && spData?.segundos_realizados !== undefined) {
        entregueStr = formatarHorasParaHMS(spData.segundos_realizados / 3600);
      }

      if ((!spData?.horas_a_entregar || spData?.horas_a_entregar === '00:00:00') && spData?.segundos_planejados !== undefined) {
        metaStr = formatarHorasParaHMS(spData.segundos_planejados / 3600);
      }

      dadosPorSubPraca[sp][idx] = {
        aderencia: spData ? spData.aderencia_percentual : 0,
        entregue: entregueStr,
        meta: metaStr
      };
    });
  });

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Meta: Horas planejadas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Entregue: Horas realizadas</span>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200/50 dark:ring-slate-700/50 bg-white/80 dark:bg-slate-900/80 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/40 dark:bg-slate-800/40">
              <TableHead rowSpan={2} className="sticky left-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md w-[140px] sm:w-[180px] text-slate-900 dark:text-white font-bold pl-4 sm:pl-6 border-r border-slate-200/50 dark:border-slate-700/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.2)]">
                Sub-Praça
              </TableHead>
              {semanasSelecionadas.map((semana) => {
                const semanaStr = String(semana).replace('W', '');
                return (
                  <TableHead key={semana} colSpan={4} className="text-center font-bold text-slate-900 dark:text-white border-l border-slate-200/50 dark:border-slate-700/50 min-w-[280px]">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800/60 rounded-full text-sm shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                      Semana {semanaStr}
                    </span>
                  </TableHead>
                );
              })}
            </TableRow>
            <TableRow className="hover:bg-transparent border-b border-slate-200/50 dark:border-slate-700/50">
              {semanasSelecionadas.map((semana) => (
                <React.Fragment key={`subheader-${semana}`}>
                  <TableHead className="text-center font-semibold text-blue-600 dark:text-blue-400 h-10 text-[10px] sm:text-xs uppercase tracking-wider border-l border-slate-200/30 dark:border-slate-700/30 min-w-[60px] sm:min-w-[70px]">Meta</TableHead>
                  <TableHead className="text-center font-semibold text-emerald-600 dark:text-emerald-400 h-10 text-[10px] sm:text-xs uppercase tracking-wider min-w-[60px] sm:min-w-[70px]">Entregue</TableHead>
                  <TableHead className="text-center font-semibold text-purple-600 dark:text-purple-400 h-10 text-[10px] sm:text-xs uppercase tracking-wider min-w-[60px] sm:min-w-[70px]">Aderência</TableHead>
                  <TableHead className="text-center font-semibold text-slate-500 dark:text-slate-400 h-10 text-[10px] sm:text-xs uppercase tracking-wider min-w-[50px] sm:min-w-[60px]">Var</TableHead>
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
