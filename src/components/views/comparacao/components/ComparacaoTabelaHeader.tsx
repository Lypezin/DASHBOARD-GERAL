import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ComparacaoTabelaHeaderProps {
    semanasSelecionadas: (number | string)[];
}

export const ComparacaoTabelaHeader: React.FC<ComparacaoTabelaHeaderProps> = ({ semanasSelecionadas }) => {
    return (
        <TableHeader>
            <TableRow className="hover:bg-transparent border-none">
                <TableHead className="h-16 w-[280px] pb-4 pl-8 align-bottom text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Métrica
                </TableHead>
                {semanasSelecionadas.map((semana, idx) => (
                    <React.Fragment key={semana}>
                        <TableHead className="h-16 pb-2 text-center">
                            <span className="inline-flex items-center justify-center rounded-full bg-slate-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-600 ring-1 ring-inset ring-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700/50">
                                Semana {semana}
                            </span>
                        </TableHead>
                        {idx > 0 && (
                            <TableHead className="h-16 w-[70px] pb-4 align-bottom text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                Var
                            </TableHead>
                        )}
                    </React.Fragment>
                ))}
            </TableRow>
        </TableHeader>
    );
};
