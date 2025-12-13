import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ComparacaoDiaHeaderProps {
    semanasSelecionadas: (number | string)[];
}

export const ComparacaoDiaHeader: React.FC<ComparacaoDiaHeaderProps> = ({ semanasSelecionadas }) => {
    return (
        <TableHeader>
            <TableRow className="hover:bg-transparent">
                <TableHead className="w-[180px] text-slate-900 dark:text-white font-semibold pl-6">
                    Dia da Semana
                </TableHead>
                {semanasSelecionadas.map((semana) => {
                    const semanaStr = String(semana).replace('W', '');
                    return (
                        <React.Fragment key={semana}>
                            <TableHead className="text-center font-semibold text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-800 min-w-[100px]">
                                Semana {semanaStr}
                            </TableHead>
                            <TableHead className="text-center font-semibold text-slate-700 dark:text-slate-300 min-w-[80px]">
                                Var %
                            </TableHead>
                        </React.Fragment>
                    );
                })}
            </TableRow>
        </TableHeader>
    );
};
