
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Map } from 'lucide-react';
import { ComparacaoSubPracaRow, SubPracaMetric } from './components/ComparacaoSubPracaRow';

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
      dadosPorSubPraca[sp][idx] = {
        aderencia: spData ? spData.aderencia_percentual : 0,
        entregue: spData?.horas_entregues || '-',
        meta: spData?.horas_a_entregar || '-'
      };
    });
  });

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-emerald-500" />
          <div>
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
              Detalhamento por Sub-Praça
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Comparativo detalhado de aderência por região (sub-praça)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-slate-200 dark:border-slate-800">
                <TableHead rowSpan={2} className="w-[180px] text-slate-900 dark:text-white font-semibold pl-6 border-r border-slate-100 dark:border-slate-800">
                  Sub-Praça
                </TableHead>
                {semanasSelecionadas.map((semana) => {
                  const semanaStr = String(semana).replace('W', '');
                  return (
                    <TableHead key={semana} colSpan={4} className="text-center font-bold text-slate-900 dark:text-white border-l border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                      Semana {semanaStr}
                    </TableHead>
                  );
                })}
              </TableRow>
              <TableRow className="hover:bg-transparent">
                {semanasSelecionadas.map((semana) => (
                  <React.Fragment key={`subheader-${semana}`}>
                    <TableHead className="text-center font-medium text-slate-500 h-9 text-xs border-l border-slate-100 dark:border-slate-800 min-w-[70px]">Meta</TableHead>
                    <TableHead className="text-center font-medium text-slate-500 h-9 text-xs min-w-[70px]">Entregue</TableHead>
                    <TableHead className="text-center font-medium text-slate-500 h-9 text-xs min-w-[70px]">%</TableHead>
                    <TableHead className="text-center font-medium text-slate-500 h-9 text-xs border-r border-slate-200 dark:border-slate-800 min-w-[70px]">Var</TableHead>
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
                  <TableCell colSpan={semanasSelecionadas.length * 4 + 1} className="text-center py-6 text-slate-500">
                    Nenhum dado de sub-praça disponível para as semanas selecionadas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
