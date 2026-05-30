import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatNumber, formatPercent } from '@/utils/formatters';

export interface ResumoTableRow {
    label: string;
    semana_label: string;
    pedidos: number;
    drivers: number;
    sh: number;
    aderenciaMedia: number;
    utr: number;
    aderencia: number;
    rejeite: number;
}

interface ResumoTableProps {
    data: ResumoTableRow[];
    isLoading: boolean;
}

export const ResumoTable = React.memo(({ data, isLoading }: ResumoTableProps) => {
    const totals = React.useMemo(() => {
        return {
            pedidos: data.reduce((sum, row) => sum + row.pedidos, 0),
            drivers: data.reduce((sum, row) => sum + row.drivers, 0),
            sh: data.reduce((sum, row) => sum + row.sh, 0),
        };
    }, [data]);

    return (
        <div className="overflow-hidden rounded-[2rem] border border-slate-200/75 bg-white/90 shadow-[0_18px_46px_-38px_rgba(15,23,42,0.42)] dark:border-slate-800/75 dark:bg-slate-950/80">
            <div className="subtle-scrollbar overflow-x-auto overscroll-x-contain">
                <Table className="min-w-[920px]">
                    <TableHeader className="bg-slate-50/90 dark:bg-slate-900/60">
                        <TableRow>
                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">SEMANA</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Pedidos</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Drivers</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">SH</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Aderência média</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">UTR</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Aderência</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Rejeite</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row) => (
                            <TableRow key={row.label} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-900/45">
                                <TableCell className="font-medium">
                                    <div className="inline-block min-w-[3rem] rounded-md bg-blue-600 px-3 py-1 text-center text-sm font-bold text-white shadow-sm">
                                        {row.semana_label.replace('Semana ', '')}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-medium">{formatNumber(row.pedidos)}</TableCell>
                                <TableCell className="text-right text-slate-600 dark:text-slate-400">{formatNumber(row.drivers)}</TableCell>
                                <TableCell className="text-right text-slate-600 dark:text-slate-400">{formatNumber(row.sh)}</TableCell>
                                <TableCell className="text-right text-slate-600 dark:text-slate-400">{formatPercent(row.aderenciaMedia)}</TableCell>
                                <TableCell className="text-right font-medium">{formatNumber(row.utr, 2)}</TableCell>
                                <TableCell className="text-right font-bold text-slate-700 dark:text-slate-200">{formatPercent(row.aderencia)}</TableCell>
                                <TableCell className="text-right font-medium text-rose-600 dark:text-rose-400">{formatPercent(row.rejeite)}</TableCell>
                            </TableRow>
                        ))}
                        {data.length > 0 && (
                            <TableRow className="border-t-2 border-slate-300 bg-slate-100 font-bold dark:border-slate-600 dark:bg-slate-800/80">
                                <TableCell className="font-bold">
                                    <div className="inline-block min-w-[3rem] rounded-md bg-slate-900 px-3 py-1 text-center text-sm text-white shadow-sm dark:bg-white dark:text-slate-900">
                                        TOTAL
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-bold text-slate-800 dark:text-slate-100">
                                    {formatNumber(totals.pedidos)}
                                </TableCell>
                                <TableCell className="text-right font-bold text-slate-800 dark:text-slate-100">
                                    {formatNumber(totals.drivers)}
                                </TableCell>
                                <TableCell className="text-right font-bold text-slate-800 dark:text-slate-100">
                                    {formatNumber(totals.sh)}
                                </TableCell>
                                <TableCell className="text-right text-slate-400">-</TableCell>
                                <TableCell className="text-right text-slate-400">-</TableCell>
                                <TableCell className="text-right text-slate-400">-</TableCell>
                                <TableCell className="text-right text-slate-400">-</TableCell>
                            </TableRow>
                        )}
                        {data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                                    {isLoading ? 'Carregando dados...' : 'Nenhum dado disponível para o período.'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
});

ResumoTable.displayName = 'ResumoTable';
