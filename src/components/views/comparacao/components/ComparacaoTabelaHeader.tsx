
import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ComparacaoTabelaHeaderProps {
    semanasSelecionadas: (number | string)[];
}

export const ComparacaoTabelaHeader: React.FC<ComparacaoTabelaHeaderProps> = ({ semanasSelecionadas }) => {
    return (
        <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
            <TableRow className="border-b border-slate-200 dark:border-slate-700">
                <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[200px]">
                    Métrica
                </TableHead>
                {semanasSelecionadas.map((semana, idx) => (
                    <React.Fragment key={semana}>
                        <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700">
                            Semana {semana}
                        </TableHead>
                        {idx > 0 && (
                            <TableHead className="text-center text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/10 w-[100px]">
                                vs S{semanasSelecionadas[idx - 1]}
                            </TableHead>
                        )}
                    </React.Fragment>
                ))}
            </TableRow>
        </TableHeader>
    );
};
