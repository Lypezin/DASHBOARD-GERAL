
import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ComparacaoTabelaHeaderProps {
    semanasSelecionadas: (number | string)[];
}

export const ComparacaoTabelaHeader: React.FC<ComparacaoTabelaHeaderProps> = ({ semanasSelecionadas }) => {
    return (
        <TableHeader>
            <TableRow className="hover:bg-transparent bg-slate-50/80 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 w-[200px] pl-5">
                    Métrica
                </TableHead>
                {semanasSelecionadas.map((semana, idx) => (
                    <React.Fragment key={semana}>
                        <TableHead className="text-center text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 border-l border-slate-100 dark:border-slate-800">
                            Sem. {semana}
                        </TableHead>
                        {idx > 0 && (
                            <TableHead className="text-center text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 w-[70px]">
                                Var
                            </TableHead>
                        )}
                    </React.Fragment>
                ))}
            </TableRow>
        </TableHeader>
    );
};
