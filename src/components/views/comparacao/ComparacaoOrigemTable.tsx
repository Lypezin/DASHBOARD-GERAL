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
import { useComparacaoOrigemTableData } from './hooks/useComparacaoOrigemTableData';

interface ComparacaoOrigemTableProps {
    dadosComparacao: DashboardResumoData[];
    semanasSelecionadas: (number | string)[];
}

export const ComparacaoOrigemTable: React.FC<ComparacaoOrigemTableProps> = ({
    dadosComparacao,
    semanasSelecionadas,
}) => {
    const { origensOrdenadas, dadosPorOrigem } = useComparacaoOrigemTableData(dadosComparacao);

    return (
        <div className="subtle-scrollbar overflow-x-auto overscroll-x-contain">
            <Table className="min-w-[720px]">
                <TableHeader>
                    <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="sticky left-0 z-20 bg-white pb-4 pl-6 align-bottom text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:bg-slate-950 dark:text-slate-500 sm:pl-8">
                            Origem
                        </TableHead>
                        {semanasSelecionadas.map((semana) => {
                            const semanaStr = String(semana).replace('W', '');
                            return (
                                <React.Fragment key={semana}>
                                    <TableHead className="pb-2 text-center">
                                        <span className="inline-flex items-center justify-center rounded-full bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
                                            Sem. {semanaStr}
                                        </span>
                                    </TableHead>
                                    <TableHead className="min-w-[72px] pb-4 align-bottom text-center text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                        Var
                                    </TableHead>
                                </React.Fragment>
                            );
                        })}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {origensOrdenadas.length > 0 && (
                        <ComparacaoOrigemRow
                            key="MEDIA DAS ORIGENS"
                            origem="MÉDIA DAS ORIGENS"
                            index={-1}
                            semanasSelecionadas={semanasSelecionadas}
                            dadosPorOrigem={dadosPorOrigem}
                        />
                    )}
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
                            <TableCell colSpan={semanasSelecionadas.length * 2 + 1} className="py-8 text-center text-sm text-slate-400">
                                Nenhum dado de origem disponível.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};
