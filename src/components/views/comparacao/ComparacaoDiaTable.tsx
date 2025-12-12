```typescript
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
import { Calendar } from 'lucide-react';

interface ComparacaoDiaTableProps {
  dadosComparacao: DashboardResumoData[];
  semanasSelecionadas: (number | string)[];
}

export const ComparacaoDiaTable: React.FC<ComparacaoDiaTableProps> = ({
  dadosComparacao,
  semanasSelecionadas,
}) => {
  // Helpers para processar dados por dia
  // Assumindo que aderencia_dia está na ordem dom..sáb ou seg..dom.
  // Vamos criar um mapa consolidado
  const diasSemana = [
    'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
  ];

  // Estrutura: { [dia]: { [semanaIdx]: valor } }
  const dadosPorDia: Record<string, Record<number, number>> = {};

  diasSemana.forEach(dia => {
    dadosPorDia[dia] = {};
    dadosComparacao.forEach((dado, idx) => {
      const diaData = dado.aderencia_dia.find(d => d.dia_semana === dia);
      dadosPorDia[dia][idx] = diaData ? diaData.aderencia_percentual : 0;
    });
  });

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          <div>
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
              Detalhamento Diário
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Comparativo de aderência dia a dia entre as semanas selecionadas
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
                  Dia da Semana
                </TableHead>
                {semanasSelecionadas.map((semana, idx) => (
                ];

                return metricas.map((metrica, metricaIdx) => (
                  <tr key={`${ dia } -${ metrica.key } `} className={diaIdx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-900/50'}>
                    {metricaIdx === 0 && (
                      <td rowSpan={4} className="px-4 py-3 text-center font-medium text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20">
                        {dia}
                      </td>
                    )}
                    <td className={`px - 4 py - 2 text - center text - sm font - medium ${ metrica.color } `}>{metrica.label}</td>
                    {dadosComparacao.map((dados, idx) => {
                      // Usar helper para encontrar dados do dia
                      const diaData = findDayData(dia, dados.aderencia_dia);
                      const valor = getMetricValue(diaData, metrica.key);

                      let variacao = null;
                      if (idx > 0) {
                        const dadosAnterior = dadosComparacao[idx - 1];
                        const diaDataAnterior = findDayData(dia, dadosAnterior.aderencia_dia);
                        const valorAnterior = getMetricValue(diaDataAnterior, metrica.key);
                        variacao = valorAnterior > 0 ? ((valor - valorAnterior) / valorAnterior) * 100 : 0;
                      }

                      return (
                        <React.Fragment key={idx}>
                          <td className={`px - 4 py - 2 text - center font - medium ${ metrica.color } border - l border - slate - 200 dark: border - slate - 700`}>
                            {typeof valor === 'number' ? valor.toLocaleString('pt-BR') : '0'}
                          </td>
                          {idx > 0 && variacao !== null && (
                            <td className="px-4 py-2 text-center text-xs font-bold">
                              <VariacaoBadge variacao={variacao} className="px-2 py-0.5" />
                            </td>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
