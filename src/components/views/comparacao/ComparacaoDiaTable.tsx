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
              {diasSemana.map((dia, diaIdx) => {
                const metrics = [
                  { label: 'Corridas Ofertadas', key: 'corridas_ofertadas', color: 'text-slate-600 dark:text-slate-400' },
                  { label: 'Corridas Aceitas', key: 'corridas_aceitas', color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Corridas Rejeitadas', key: 'corridas_rejeitadas', color: 'text-rose-600 dark:text-rose-400' },
                  { label: 'Corridas Completadas', key: 'corridas_completadas', color: 'text-purple-600 dark:text-purple-400' },
                  { label: 'Taxa de Aceitação', key: 'taxa_aceitacao', color: 'text-blue-600 dark:text-blue-400', isPercent: true },
                  { label: 'Horas Planejadas', key: 'horas_a_entregar', color: 'text-amber-600 dark:text-amber-400', isTime: true },
                  { label: 'Horas Entregues', key: 'horas_entregues', color: 'text-teal-600 dark:text-teal-400', isTime: true },
                  { label: 'Aderência', key: 'aderencia_percentual', color: 'text-slate-900 dark:text-white font-bold', isPercent: true }
                ];

                return (
                  <React.Fragment key={dia}>
                    {metrics.map((metric, metricIdx) => (
                      <TableRow
                        key={`${dia}-${metric.key}`}
                        className={`
                          hover:bg-slate-50 dark:hover:bg-slate-800/50
                          ${diaIdx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-900/50'}
                          ${metricIdx === 0 ? 'border-t-2 border-slate-100 dark:border-slate-800' : ''}
                        `}
                      >
                        {metricIdx === 0 && (
                          <TableCell
                            rowSpan={metrics.length}
                            className="font-bold text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800 align-top bg-slate-50/50 dark:bg-slate-800/20 w-[140px]"
                          >
                            {dia}
                          </TableCell>
                        )}
                        <TableCell className={`font-medium text-xs ${metric.color}`}>
                          {metric.label}
                        </TableCell>
                        {semanasSelecionadas.map((_, weekIdx) => {
                          // We need to access the full object from dadosComparacao directly here or redesign how dadosPorDia is built.
                          // Redesigning slightly inline to access correct data.
                          const weeklyData = dadosComparacao[weekIdx];
                          const dayData = weeklyData.aderencia_dia.find(d => d.dia_semana === dia);

                          let rawValue: number | string = 0;
                          if (dayData) {
                            if (metric.key === 'taxa_aceitacao') {
                              rawValue = dayData.taxa_aceitacao ??
                                (dayData.corridas_ofertadas ? (dayData.corridas_aceitas || 0) / dayData.corridas_ofertadas * 100 : 0);
                            } else {
                              // @ts-ignore - dynamic key access
                              rawValue = dayData[metric.key] ?? 0;
                            }
                          }

                          // Format value
                          let displayValue = '-';
                          if (dayData) {
                            if (metric.isTime) {
                              displayValue = String(rawValue); // Already string HH:MM:ss or needs formatting if number
                              if (typeof rawValue === 'number') {
                                // Convert seconds to HH:MM:ss if needed, but assuming string from API based on types
                                displayValue = new Date(rawValue * 1000).toISOString().substr(11, 8);
                              }
                            } else if (metric.isPercent) {
                              displayValue = `${Number(rawValue).toFixed(1)}%`;
                            } else {
                              displayValue = Number(rawValue).toLocaleString('pt-BR');
                            }
                          }

                          // Calculate Variation
                          let variacao: number | null = null;
                          if (weekIdx > 0) {
                            const prevWeeklyData = dadosComparacao[weekIdx - 1];
                            const prevDayData = prevWeeklyData.aderencia_dia.find(d => d.dia_semana === dia);
                            let prevValue: number = 0;

                            if (prevDayData) {
                              if (metric.key === 'taxa_aceitacao') {
                                prevValue = prevDayData.taxa_aceitacao ??
                                  (prevDayData.corridas_ofertadas ? (prevDayData.corridas_aceitas || 0) / prevDayData.corridas_ofertadas * 100 : 0);
                              } else if (metric.isTime) {
                                // Time variation is tricky if string. Converting to seconds for variation calc.
                                // Assuming simpler numeric comparison for now or skipping.
                                // Let's parse time string to seconds for reliable diff
                                const timeToSeconds = (t: string | number) => {
                                  if (typeof t === 'number') return t;
                                  if (!t) return 0;
                                  const [h, m, s] = t.split(':').map(Number);
                                  return (h * 3600) + (m * 60) + (s || 0);
                                };
                                prevValue = timeToSeconds(prevDayData[metric.key as keyof typeof prevDayData] as any);
                              } else {
                                // @ts-ignore
                                prevValue = Number(prevDayData[metric.key] ?? 0);
                              }
                            }

                            let currentValueNum = 0;
                            if (metric.isTime) {
                              const timeToSeconds = (t: string | number) => {
                                if (typeof t === 'number') return t;
                                if (!t) return 0;
                                const [h, m, s] = t.split(':').map(Number);
                                return (h * 3600) + (m * 60) + (s || 0);
                              };
                              currentValueNum = timeToSeconds(rawValue);
                            } else {
                              currentValueNum = Number(rawValue);
                            }

                            if (prevValue > 0) {
                              variacao = ((currentValueNum - prevValue) / prevValue) * 100;
                            } else if (currentValueNum > 0) {
                              variacao = 100;
                            } else {
                              variacao = 0;
                            }
                          }

                          return (
                            <React.Fragment key={weekIdx}>
                              <TableCell className="text-center text-xs border-l border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                                {displayValue}
                              </TableCell>
                              <TableCell className="text-center p-1">
                                {weekIdx > 0 ? (
                                  <VariacaoBadge variacao={variacao ?? 0} className="mx-auto" />
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-600 text-xs">-</span>
                                )}
                              </TableCell>
                            </React.Fragment>
                          );
                        })}
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
