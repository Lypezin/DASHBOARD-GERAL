
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
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="sticky left-0 z-20 bg-white dark:bg-slate-900 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 pl-8 pb-4 align-bottom">
                            Origem
                        </TableHead>
                        {semanasSelecionadas.map((semana) => {
                            const semanaStr = String(semana).replace('W', '');
                            return (
                                <React.Fragment key={semana}>
                                    <TableHead className="text-center pb-2">
                                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-widest ring-1 ring-inset ring-slate-200 dark:ring-slate-700">
                                            Sem. {semanaStr}
                                        </span>
                                    </TableHead>
                                    <TableHead className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 min-w-[70px] pb-4 align-bottom">
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
                            key="MÉDIA DAS ORIGENS"
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
