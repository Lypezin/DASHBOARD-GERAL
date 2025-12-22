import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatDuration, extractWeekNumber } from '@/utils/timeHelpers';
import { calculatePercentage } from '@/utils/formatHelpers';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { MarketingDriverDetailModal } from './MarketingDriverDetailModal';
import { useAuth } from '@/hooks/useAuth';

interface ComparacaoRow {
    semana_iso: string;
    segundos_ops: number;
    segundos_mkt: number;
    ofertadas_ops: number;
    ofertadas_mkt: number;
    aceitas_ops: number;
    aceitas_mkt: number;
    concluidas_ops: number;
    concluidas_mkt: number;
    rejeitadas_ops: number;
    rejeitadas_mkt: number;
}

interface MarketingComparacaoTableProps {
    data: ComparacaoRow[];
}

export const MarketingComparacaoTable = React.memo(function MarketingComparacaoTable({ data }: MarketingComparacaoTableProps) {
    const { user } = useAuth();
    const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

    return (
        <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead rowSpan={2} className="w-[100px]">Semana</TableHead>
                        <TableHead rowSpan={2} className="w-[50px] text-center">Detalhes</TableHead>
                        <TableHead colSpan={4} className="text-center border-l bg-blue-50/50 dark:bg-blue-900/10">Horas Logadas</TableHead>
                        <TableHead colSpan={2} className="text-center border-l">Ofertadas</TableHead>
                        <TableHead colSpan={2} className="text-center border-l">Aceitas</TableHead>
                        <TableHead colSpan={2} className="text-center border-l">Completas</TableHead>
                        <TableHead colSpan={2} className="text-center border-l">Rejeitadas</TableHead>
                    </TableRow>
                    <TableRow>
                        {/* Hours Sub-headers */}
                        <TableHead className="text-right border-l bg-blue-50/50 dark:bg-blue-900/10 text-xs">Operacional</TableHead>
                        <TableHead className="text-right bg-blue-50/50 dark:bg-blue-900/10 text-xs text-purple-600 font-semibold">Marketing</TableHead>
                        <TableHead className="text-right bg-blue-50/50 dark:bg-blue-900/10 text-xs text-slate-500">% Ops</TableHead>
                        <TableHead className="text-right bg-blue-50/50 dark:bg-blue-900/10 text-xs text-purple-500 font-semibold">% Mkt</TableHead>

                        {/* Ofertadas Sub-headers */}
                        <TableHead className="text-right border-l text-xs">Ops</TableHead>
                        <TableHead className="text-right text-xs text-purple-600 font-semibold">Mkt</TableHead>

                        {/* Aceitas Sub-headers */}
                        <TableHead className="text-right border-l text-xs">Ops</TableHead>
                        <TableHead className="text-right text-xs text-purple-600 font-semibold">Mkt</TableHead>

                        {/* Completas Sub-headers */}
                        <TableHead className="text-right border-l text-xs">Ops</TableHead>
                        <TableHead className="text-right text-xs text-purple-600 font-semibold">Mkt</TableHead>

                        {/* Rejeitadas Sub-headers */}
                        <TableHead className="text-right border-l text-xs">Ops</TableHead>
                        <TableHead className="text-right text-xs text-purple-600 font-semibold">Mkt</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={14} className="h-24 text-center">
                                Nenhum dado encontrado para o período selecionado.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((row) => {
                            const totalHours = row.segundos_ops + row.segundos_mkt;
                            return (
                                <TableRow key={row.semana_iso}>
                                    <TableCell className="font-medium whitespace-nowrap">
                                        Semana {extractWeekNumber(row.semana_iso)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => setSelectedWeek(row.semana_iso)}
                                            title="Ver detalhes"
                                        >
                                            <Search className="h-4 w-4 text-slate-500 hover:text-blue-500" />
                                            <span className="sr-only">Ver detalhes</span>
                                        </Button>
                                    </TableCell>

                                    {/* Hours */}
                                    <TableCell className="text-right font-mono border-l bg-blue-50/30 dark:bg-blue-900/5">{formatDuration(row.segundos_ops)}</TableCell>
                                    <TableCell className="text-right font-mono font-bold text-purple-600 dark:text-purple-400 bg-blue-50/30 dark:bg-blue-900/5">{formatDuration(row.segundos_mkt)}</TableCell>
                                    <TableCell className="text-right text-xs text-slate-500 bg-blue-50/30 dark:bg-blue-900/5">{calculatePercentage(row.segundos_ops, totalHours)}</TableCell>
                                    <TableCell className="text-right text-xs text-purple-500 font-semibold bg-blue-50/30 dark:bg-blue-900/5">{calculatePercentage(row.segundos_mkt, totalHours)}</TableCell>

                                    {/* Ofertadas */}
                                    <TableCell className="text-right border-l">{row.ofertadas_ops.toLocaleString('pt-BR')}</TableCell>
                                    <TableCell className="text-right font-bold text-purple-600 dark:text-purple-400">{row.ofertadas_mkt.toLocaleString('pt-BR')}</TableCell>

                                    {/* Aceitas */}
                                    <TableCell className="text-right border-l">{row.aceitas_ops.toLocaleString('pt-BR')}</TableCell>
                                    <TableCell className="text-right font-bold text-purple-600 dark:text-purple-400">{row.aceitas_mkt.toLocaleString('pt-BR')}</TableCell>

                                    {/* Completas */}
                                    <TableCell className="text-right border-l">{row.concluidas_ops.toLocaleString('pt-BR')}</TableCell>
                                    <TableCell className="text-right font-bold text-purple-600 dark:text-purple-400">{row.concluidas_mkt.toLocaleString('pt-BR')}</TableCell>

                                    {/* Rejeitadas */}
                                    <TableCell className="text-right border-l">{row.rejeitadas_ops.toLocaleString('pt-BR')}</TableCell>
                                    <TableCell className="text-right font-bold text-purple-600 dark:text-purple-400">{row.rejeitadas_mkt.toLocaleString('pt-BR')}</TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>

            <MarketingDriverDetailModal
                isOpen={!!selectedWeek}
                onClose={() => setSelectedWeek(null)}
                semanaIso={selectedWeek || ''}
                organizationId={user?.organization_id || null}
            />
        </div>
    );
});
