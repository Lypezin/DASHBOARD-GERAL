import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ComparacaoTabelaHeaderProps {
    semanasSelecionadas: (number | string)[];
}

export const ComparacaoTabelaHeader: React.FC<ComparacaoTabelaHeaderProps> = ({ semanasSelecionadas }) => {
    return (
        <TableHeader>
            <TableRow className="hover:bg-transparent bg-slate-50/50 dark:bg-slate-900/50 border-b-2 border-slate-200 dark:border-slate-800">
                <TableHead className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 w-[200px] pl-6 h-12">
                    Métrica
                </TableHead>
                {semanasSelecionadas.map((semana, idx) => (
                    <React.Fragment key={semana}>
                        <TableHead className="text-center h-12 border-l border-slate-200/60 dark:border-slate-800/60">
                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest ring-1 ring-inset ring-blue-700/10 dark:ring-blue-400/20">
                                Sem. {semana}
                            </span>
                        </TableHead>
                        {idx > 0 && (
                            <TableHead className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 w-[70px] h-12">
                                Var
                            </TableHead>
                        )}
                    </React.Fragment>
                ))}
            </TableRow>
        </TableHeader>
    );
};
