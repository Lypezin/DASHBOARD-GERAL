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
        <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                    <TableRow>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">SEMANA</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">Pedidos</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">Drivers</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">SH</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">Aderência Média</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">UTR</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">Aderência</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">Rejeite</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row) => (
                        <TableRow key={row.label} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <TableCell className="font-medium">
                                <div className="bg-blue-600 text-white rounded-md py-1 px-3 text-center inline-block min-w-[3rem] text-sm shadow-sm font-bold">
                                    {row.semana_label.replace('Semana ', '')}
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">{formatNumber(row.pedidos)}</TableCell>
                            <TableCell className="text-right text-slate-600 dark:text-slate-400">{formatNumber(row.drivers)}</TableCell>
                            <TableCell className="text-right text-slate-600 dark:text-slate-400">{formatNumber(row.sh)}</TableCell>
                            <TableCell className="text-right text-slate-600 dark:text-slate-400">{formatPercent(row.aderenciaMedia)}</TableCell>
                            <TableCell className="text-right font-medium">{formatNumber(row.utr, 2)}</TableCell>
                            <TableCell className="text-right font-bold text-slate-700 dark:text-slate-200">{formatPercent(row.aderencia)}</TableCell>
                            <TableCell className="text-right text-red-600 dark:text-red-400 font-medium">{formatPercent(row.rejeite)}</TableCell>
                        </TableRow>
                    ))}
                    {/* Totals Row */}
                    {data.length > 0 && (
                        <TableRow className="bg-slate-100 dark:bg-slate-800/80 font-bold border-t-2 border-slate-300 dark:border-slate-600">
                            <TableCell className="font-bold">
                                <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white rounded-md py-1 px-3 text-center inline-block min-w-[3rem] text-sm shadow-sm">
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
                            <TableCell className="text-right text-slate-400">—</TableCell>
                            <TableCell className="text-right text-slate-400">—</TableCell>
                            <TableCell className="text-right text-slate-400">—</TableCell>
                            <TableCell className="text-right text-slate-400">—</TableCell>
                        </TableRow>
                    )}
                    {data.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                {isLoading ? 'Carregando dados...' : 'Nenhum dado disponível para o período.'}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
});
