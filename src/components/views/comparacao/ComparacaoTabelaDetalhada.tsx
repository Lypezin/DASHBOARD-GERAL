import React from 'react';
import { DashboardResumoData } from '@/types';
import { formatarHorasParaHMS, converterHorasParaDecimal } from '@/utils/formatters';
import { getWeeklyHours } from '@/utils/comparacaoHelpers';
import { ComparingTableRow } from './components/ComparingTableRow';
import { ComparacaoTabelaHeader } from './components/ComparacaoTabelaHeader';
import { Table, TableBody } from '@/components/ui/table';
import { getPedidosAceitosConcluidosTotal } from '@/utils/comparisonDemandMetrics';

interface ComparacaoTabelaDetalhadaProps {
    dadosComparacao: DashboardResumoData[];
    semanasSelecionadas: (number | string)[];
}

export const ComparacaoTabelaDetalhada: React.FC<ComparacaoTabelaDetalhadaProps> = ({
    dadosComparacao,
    semanasSelecionadas,
}) => {
    return (
        <div className="subtle-scrollbar overflow-x-auto overscroll-x-contain">
            <Table className="min-w-[760px]">
                <ComparacaoTabelaHeader semanasSelecionadas={semanasSelecionadas} />
                <TableBody>
                    <ComparingTableRow
                        label="Aderência geral"
                        data={dadosComparacao}
                        getValue={(d) => d?.aderencia_semanal?.[0]?.aderencia_percentual ?? 0}
                        formatValue={(v) => (
                            <span className={`tabular-nums font-semibold ${v >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
                                v >= 80 ? 'text-blue-600 dark:text-blue-400' :
                                    v >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                                }`}>
                                {v.toFixed(1)}%
                            </span>
                        )}
                    />
                    <ComparingTableRow
                        label="Corridas ofertadas"
                        data={dadosComparacao}
                        getValue={(d) => d?.total_ofertadas ?? 0}
                        formatValue={(v) => v.toLocaleString('pt-BR')}
                    />
                    <ComparingTableRow
                        label="Corridas aceitas"
                        data={dadosComparacao}
                        getValue={(d) => d?.total_aceitas ?? 0}
                        formatValue={(v) => v.toLocaleString('pt-BR')}
                    />
                    <ComparingTableRow
                        label="Corridas rejeitadas"
                        data={dadosComparacao}
                        getValue={(d) => d?.total_rejeitadas ?? 0}
                        formatValue={(v) => v.toLocaleString('pt-BR')}
                        invertVariationColors
                    />
                    <ComparingTableRow
                        label="Numero de Pedidos"
                        data={dadosComparacao}
                        getValue={(d) => getPedidosAceitosConcluidosTotal(d)}
                        formatValue={(v) => v.toLocaleString('pt-BR')}
                    />
                    <ComparingTableRow
                        label="Taxa de aceitação"
                        data={dadosComparacao}
                        getValue={(d) => d?.total_ofertadas ? ((d.total_aceitas ?? 0) / d.total_ofertadas) * 100 : 0}
                        formatValue={(v) => `${v.toFixed(1)}%`}
                        showVariation={false}
                    />
                    <ComparingTableRow
                        label="Horas planejadas"
                        data={dadosComparacao}
                        getValue={(d) => converterHorasParaDecimal(getWeeklyHours(d, 'horas_planejadas'))}
                        formatValue={(v) => formatarHorasParaHMS(v)}
                        valueClassName="font-mono tabular-nums"
                        showVariation={false}
                    />
                    <ComparingTableRow
                        label="Horas entregues"
                        data={dadosComparacao}
                        getValue={(d) => converterHorasParaDecimal(getWeeklyHours(d, 'horas_entregues'))}
                        formatValue={(v) => formatarHorasParaHMS(v)}
                        valueClassName="font-mono tabular-nums"
                        showVariation={false}
                    />
                </TableBody>
            </Table>
        </div>
    );
};
