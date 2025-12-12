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
import { MapPin } from 'lucide-react';

interface ComparacaoOrigemTableProps {
    dadosComparacao: DashboardResumoData[];
    semanasSelecionadas: (number | string)[];
}

export const ComparacaoOrigemTable: React.FC<ComparacaoOrigemTableProps> = ({
    dadosComparacao,
    semanasSelecionadas,
}) => {
    // 1. Extrair todas as origens disponíveis
    const todasOrigens = new Set<string>();
    dadosComparacao.forEach((d) => {
        if (d.aderencia_origem && Array.isArray(d.aderencia_origem)) {
            d.aderencia_origem.forEach((item) => {
                todasOrigens.add(item.origem);
            });
        }
    });
    const origensOrdenadas = Array.from(todasOrigens).sort();

    // 2. Mapear dados
    const dadosPorOrigem: Record<string, Record<number, number>> = {};
    origensOrdenadas.forEach((origem) => {
        dadosPorOrigem[origem] = {};
        dadosComparacao.forEach((dado, idx) => {
            const origemData = dado.aderencia_origem?.find((x) => x.origem === origem);
            dadosPorOrigem[origem][idx] = origemData ? origemData.aderencia_percentual : 0;
        });
    });

    return (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-purple-500" />
                    <div>
                        <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                            Detalhamento por Origem
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                            Performance comparativa por origem de tráfego
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
                                    Origem
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
                            {origensOrdenadas.map((origem, index) => (
                                <TableRow
                                    key={origem}
                                    className={index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-900/50'}
                                >
                                    <TableCell className="font-medium text-slate-700 dark:text-slate-300 pl-6">
                                        {origem}
                                    </TableCell>
                                    {semanasSelecionadas.map((_, idx) => {
                                        const valor = dadosPorOrigem[origem][idx];
                                        let variacao: number | null = null;

                                        if (idx > 0) {
                                            const valorAnterior = dadosPorOrigem[origem][idx - 1];
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
                            {origensOrdenadas.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={semanasSelecionadas.length * 2 + 1} className="text-center py-6 text-slate-500">
                                        Nenhum dado de origem disponível para as semanas selecionadas.
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
