import React from 'react';
import { DashboardResumoData } from '@/types';
import { ComparacaoMetricRow } from './ComparacaoMetricRow';
import { MapPin, TrendingUp, Megaphone, CheckCircle2, XCircle, Target, Percent, Calendar, Clock } from 'lucide-react';
import { formatarHorasParaHMS } from '@/utils/formatters';

interface ComparacaoSubPracaTableProps {
    dadosComparacao: DashboardResumoData[];
    semanasSelecionadas: string[];
}

export const ComparacaoSubPracaTable: React.FC<ComparacaoSubPracaTableProps> = ({
    dadosComparacao,
    semanasSelecionadas,
}) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sub-Praça / Métrica</th>
                        {semanasSelecionadas.map((semana, idx) => (
                            <React.Fragment key={semana}>
                                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700">
                                    Semana {semana}
                                </th>
                                {idx > 0 && (
                                    <th className="px-4 py-4 text-center text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/10">
                                        Δ% vs S{semanasSelecionadas[idx - 1]}
                                    </th>
                                )}
                            </React.Fragment>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {Array.from(new Set(dadosComparacao.flatMap(d => (d.aderencia_sub_praca || d.sub_praca || []).map(sp => sp.sub_praca)))).map((subPraca) => (
                        <React.Fragment key={subPraca}>
                            <tr className="bg-purple-50/50 dark:bg-purple-900/10">
                                <td colSpan={semanasSelecionadas.length * 2} className="px-6 py-3 font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    {subPraca}
                                </td>
                            </tr>

                            <ComparacaoMetricRow
                                label="Aderência"
                                icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
                                dadosComparacao={dadosComparacao}
                                subPraca={subPraca}
                                getValue={(d) => d.aderencia_percentual ?? 0}
                                formatValue={(v) => (
                                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-sm font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                        {Number(v).toFixed(1)}%
                                    </span>
                                )}
                            />

                            <ComparacaoMetricRow
                                label="Corridas Ofertadas"
                                icon={<Megaphone className="h-4 w-4 text-slate-500" />}
                                dadosComparacao={dadosComparacao}
                                subPraca={subPraca}
                                getValue={(d) => d.corridas_ofertadas ?? 0}
                                formatValue={(v) => Number(v).toLocaleString('pt-BR')}
                            />

                            <ComparacaoMetricRow
                                label="Corridas Aceitas"
                                icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
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
                                formatValue={(v) => `${Number(v).toFixed(1)}%`}
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
