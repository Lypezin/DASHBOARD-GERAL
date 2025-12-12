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
import { VariacaoBadge } from '@/components/VariacaoBadge';
import { Map } from 'lucide-react';

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
  const dadosPorSubPraca: Record<string, Record<number, number>> = {};
  subPracasOrdenadas.forEach((sp) => {
    dadosPorSubPraca[sp] = {};
    dadosComparacao.forEach((dado, idx) => {
      const spData = dado.aderencia_sub_praca?.find((x) => x.sub_praca === sp);
      dadosPorSubPraca[sp][idx] = spData ? spData.aderencia_percentual : 0;
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
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[180px] text-slate-900 dark:text-white font-semibold pl-6">
                  Sub-Praça
                </TableHead>
                {semanasSelecionadas.map((semana) => {
                  const semanaStr = String(semana).replace('W', '');
                  return (
                    <React.Fragment key={semana}>
                      <TableHead className="text-center font-semibold text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-800 min-w-[100px]">
                        Semana {semanaStr}
                      </TableHead>
                      <TableHead className="text-center font-semibold text-slate-700 dark:text-slate-300 min-w-[80px]">
                        Var %
                      </TableHead>
                    </React.Fragment>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {subPracasOrdenadas.map((subPraca, index) => (
                <TableRow
                  key={subPraca}
                  className={index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-900/50'}
                >
                  <TableCell className="font-medium text-slate-700 dark:text-slate-300 pl-6">
                    {subPraca}
                  </TableCell>
                  {semanasSelecionadas.map((_, idx) => {
                    const valor = dadosPorSubPraca[subPraca][idx];
                    let variacao: number | null = null;

                    if (idx > 0) {
                      const valorAnterior = dadosPorSubPraca[subPraca][idx - 1];
                      if (valorAnterior > 0) {
                        variacao = ((valor - valorAnterior) / valorAnterior) * 100;
                      } else if (valor > 0) {
                        variacao = 100;
                      } else {
                        variacao = 0;
                      }
                    }

                    return (
                      <React.Fragment key={idx}>
                        <TableCell className="text-center text-slate-600 dark:text-slate-400 border-l border-slate-200 dark:border-slate-800">
                          {valor.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-center">
                          {idx > 0 ? (
                            <VariacaoBadge variacao={variacao ?? 0} className="mx-auto" />
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">-</span>
                          )}
                        </TableCell>
                      </React.Fragment>
                    );
                  })}
                </TableRow>
              ))}
              {subPracasOrdenadas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={semanasSelecionadas.length * 2 + 1} className="text-center py-6 text-slate-500">
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
