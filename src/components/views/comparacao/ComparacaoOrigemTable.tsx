
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
    const todasOrigens = new Set<string>();
    dadosComparacao.forEach((d) => {
        if (d.aderencia_origem && Array.isArray(d.aderencia_origem)) {
            d.aderencia_origem.forEach((item) => {
                todasOrigens.add(item.origem);
            });
        }
    });
    const origensOrdenadas = Array.from(todasOrigens).sort();

    const dadosPorOrigem: Record<string, Record<number, number>> = {};
    origensOrdenadas.forEach((origem) => {
        dadosPorOrigem[origem] = {};
        dadosComparacao.forEach((dado, idx) => {
            const origemData = dado.aderencia_origem?.find((x) => x.origem === origem);
            dadosPorOrigem[origem][idx] = origemData ? origemData.aderencia_percentual : 0;
        });
    });

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent bg-slate-50/80 dark:bg-slate-800/30">
                        <TableHead className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-900 text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-5 min-w-[140px] border-r border-slate-100 dark:border-slate-800">
                            Origem
                        </TableHead>
                        {semanasSelecionadas.map((semana) => {
                            const semanaStr = String(semana).replace('W', '');
                            return (
                                <React.Fragment key={semana}>
                                    <TableHead className="text-center text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 border-l border-slate-100 dark:border-slate-800 min-w-[90px]">
                                        Sem. {semanaStr}
                                    </TableHead>
                                    <TableHead className="text-center text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 min-w-[70px]">
                                        Var
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
                            <TableCell colSpan={semanasSelecionadas.length * 2 + 1} className="text-center py-8 text-sm text-slate-400">
                                Nenhum dado de origem disponível.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};
