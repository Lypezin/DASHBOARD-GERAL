import React from 'react';
import { DashboardResumoData } from '@/types';
import { Calendar } from 'lucide-react';
import { ComparacaoDiaTable as ComparacaoDiaTableContent } from './components/ComparacaoDiaTable';

interface ComparacaoDiaTableProps {
    dadosComparacao: DashboardResumoData[];
    semanasSelecionadas: (number | string)[];
}

export const ComparacaoDiaTable = React.memo<ComparacaoDiaTableProps>(({
    dadosComparacao,
    semanasSelecionadas,
}) => {
    return (
        <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.36)] transition-[transform,box-shadow] duration-200 dark:border-slate-800/80 dark:bg-slate-950/76">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 px-6 py-5 dark:border-slate-800/70 sm:px-8">
                <h3 className="flex items-center gap-3 text-lg tracking-tight text-slate-900 dark:text-white">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 dark:bg-sky-950/35">
                        <Calendar className="h-4 w-4 text-sky-500 dark:text-sky-300" />
                    </span>
                    <span className="font-semibold">Comparativo diario</span>
                </h3>
            </div>

            <ComparacaoDiaTableContent
                semanasSelecionadas={semanasSelecionadas.map((semana) => String(semana))}
                dadosComparacao={dadosComparacao}
            />
        </div>
    );
});

ComparacaoDiaTable.displayName = 'ComparacaoDiaTable';
