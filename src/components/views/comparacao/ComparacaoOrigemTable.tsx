
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
        <div className="overflow-x-auto rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                        <TableHead className="sticky left-0 z-20 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-sm w-[140px] sm:w-[180px] text-slate-900 dark:text-white font-bold pl-4 sm:pl-6 border-r border-slate-200/50 dark:border-slate-700/50">
                            Origem
                        </TableHead>
                        {semanasSelecionadas.map((semana) => {
                            const semanaStr = String(semana).replace('W', '');
                            return (
                                <React.Fragment key={semana}>
                                    <TableHead className="text-center font-bold text-slate-900 dark:text-white border-l border-slate-200/50 dark:border-slate-700/50 min-w-[100px] bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-900/20 dark:to-blue-900/20">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/60 dark:bg-slate-800/60 rounded-full text-sm">
                                            Semana {semanaStr}
                                        </span>
                                    </TableHead>
                                    <TableHead className="text-center font-semibold text-slate-600 dark:text-slate-300 min-w-[80px] bg-slate-50/30 dark:bg-slate-800/30">
                                        <span className="text-xs">Var %</span>
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
                            <TableCell colSpan={semanasSelecionadas.length * 2 + 1} className="text-center py-8 text-slate-500 dark:text-slate-400">
                                Nenhum dado de origem disponível para as semanas selecionadas.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};
