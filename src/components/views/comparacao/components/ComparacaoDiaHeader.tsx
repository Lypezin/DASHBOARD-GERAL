import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ComparacaoDiaHeaderProps {
    semanasSelecionadas: (number | string)[];
}

export const ComparacaoDiaHeader: React.FC<ComparacaoDiaHeaderProps> = ({ semanasSelecionadas }) => {
    return (
        <TableHeader>
            <TableRow className="hover:bg-transparent border-none">
                {/* Dia da Semana — fixed col */}
                <TableHead className="w-[130px] text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] pl-8 pb-4 align-bottom h-16">
                    Dia
                </TableHead>
                {/* Métrica label col */}
                <TableHead className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] min-w-[130px] pb-4 align-bottom h-16">
                    Métrica
                </TableHead>
                {semanasSelecionadas.map((semana, idx) => {
                    const semanaStr = String(semana).replace('W', '');
                    return (
                        <React.Fragment key={semana}>
                            <TableHead className="text-center h-16 pb-2">
                                <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-widest ring-1 ring-inset ring-slate-100 dark:ring-slate-700/50">
                                    Semana {semanaStr}
                                </span>
                            </TableHead>
                            {idx > 0 && (
                                <TableHead className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 w-[70px] pb-4 align-bottom h-16">
                                    Var
                                </TableHead>
                            )}
                        </React.Fragment>
                    );
                })}
            </TableRow>
        </TableHeader>
    );
};
