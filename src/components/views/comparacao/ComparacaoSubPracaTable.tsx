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
    // Ensure aderencia_sub_praca exists and is an array before iterating
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
                                dadosComparacao={dadosComparacao}
                                subPraca={subPraca}
                                getValue={(d) => d.corridas_aceitas ?? 0}
                                formatValue={(v) => Number(v).toLocaleString('pt-BR')}
                                valueClassName="text-emerald-600 dark:text-emerald-400"
                            />

                            <ComparacaoMetricRow
                                label="Corridas Rejeitadas"
                                icon={<XCircle className="h-4 w-4 text-rose-500" />}
                                dadosComparacao={dadosComparacao}
                                subPraca={subPraca}
                                getValue={(d) => d.corridas_rejeitadas ?? 0}
                                formatValue={(v) => Number(v).toLocaleString('pt-BR')}
                                valueClassName="text-rose-600 dark:text-rose-400"
                                invertVariationColors
                            />

                            <ComparacaoMetricRow
                                label="Corridas Completadas"
                                icon={<Target className="h-4 w-4 text-purple-500" />}
                                dadosComparacao={dadosComparacao}
                                subPraca={subPraca}
                                getValue={(d) => d.corridas_completadas ?? 0}
                                formatValue={(v) => Number(v).toLocaleString('pt-BR')}
                                valueClassName="text-purple-600 dark:text-purple-400"
                            />

                            <ComparacaoMetricRow
                                label="Taxa de Aceitação"
                                icon={<Percent className="h-4 w-4 text-slate-500" />}
                                dadosComparacao={dadosComparacao}
                                subPraca={subPraca}
                                getValue={(d) => {
                                    const ofertadas = d.corridas_ofertadas ?? 0;
                                    const aceitas = d.corridas_aceitas ?? 0;
                                    return ofertadas > 0 ? (aceitas / ofertadas) * 100 : 0;
                                }}
                                formatValue={(v) => `${ Number(v).toFixed(1) }% `}
                                showVariation={false}
                            />

                            <ComparacaoMetricRow
                                label="Horas Planejadas"
                                icon={<Calendar className="h-4 w-4 text-amber-500" />}
                                dadosComparacao={dadosComparacao}
                                subPraca={subPraca}
                                getValue={(d) => {
                                    // Fallback to seconds if pre-formatted string is missing or zeroed
                                    if (d.horas_a_entregar && d.horas_a_entregar !== '00:00:00') return d.horas_a_entregar;
                                    return (d.segundos_planejados || 0) / 3600;
                                }}
                                formatValue={(v) => formatarHorasParaHMS(v)}
                                valueClassName="font-mono text-amber-600 dark:text-amber-400"
                                showVariation={false}
                            />

                            <ComparacaoMetricRow
                                label="Horas Entregues"
                                icon={<Clock className="h-4 w-4 text-blue-500" />}
                                dadosComparacao={dadosComparacao}
                                subPraca={subPraca}
                                getValue={(d) => {
                                    // Fallback to seconds if pre-formatted string is missing or zeroed
                                    if (d.horas_entregues && d.horas_entregues !== '00:00:00') return d.horas_entregues;
                                    return (d.segundos_realizados || 0) / 3600;
                                }}
                                formatValue={(v) => formatarHorasParaHMS(v)}
                                valueClassName="font-mono text-blue-600 dark:text-blue-400"
                                showVariation={false}
                            />

                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
