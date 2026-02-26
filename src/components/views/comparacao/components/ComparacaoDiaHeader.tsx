import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ComparacaoDiaHeaderProps {
    semanasSelecionadas: (number | string)[];
}

export const ComparacaoDiaHeader: React.FC<ComparacaoDiaHeaderProps> = ({ semanasSelecionadas }) => {
    return (
        <TableHeader>
            <TableRow className="hover:bg-transparent bg-slate-50/80 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                {/* Dia da Semana — fixed col */}
                <TableHead className="w-[130px] text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-5">
                    Dia
                </TableHead>
                {/* Métrica label col */}
                <TableHead className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider min-w-[130px]">
                    Métrica
                </TableHead>
                {semanasSelecionadas.map((semana, idx) => {
                    const semanaStr = String(semana).replace('W', '');
                    return (
                        <React.Fragment key={semana}>
                            <TableHead className="text-center text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider border-l border-slate-100 dark:border-slate-800 min-w-[100px]">
                                Sem. {semanaStr}
                            </TableHead>
                            {idx > 0 && (
                                <TableHead className="text-center text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider w-[70px]">
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
