
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
import { MapPin } from 'lucide-react';
import { ComparacaoOrigemRow } from './components/ComparacaoOrigemRow';

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
                                <ComparacaoOrigemRow
                                    key={origem}
                                    origem={origem}
                                    index={index}
                                    semanasSelecionadas={semanasSelecionadas}
                                    dadosPorOrigem={dadosPorOrigem}
                                />
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
