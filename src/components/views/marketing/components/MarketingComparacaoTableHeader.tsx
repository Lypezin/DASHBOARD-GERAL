import React from 'react';
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const MarketingComparacaoTableHeader = React.memo(function MarketingComparacaoTableHeader() {
    return (
        <TableHeader>
            <TableRow className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                <TableHead rowSpan={2} className="w-[100px] pl-4 font-semibold text-slate-500 dark:text-slate-400">Semana</TableHead>
                <TableHead rowSpan={2} className="w-[50px] text-center font-semibold text-slate-500 dark:text-slate-400">Ver</TableHead>
                <TableHead colSpan={2} className="border-l border-slate-100 text-center font-semibold text-sky-600 dark:border-slate-800 dark:text-sky-300">Entregadores</TableHead>
                <TableHead colSpan={2} className="border-l border-slate-100 text-center font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300">Horas Logadas</TableHead>
                <TableHead colSpan={2} className="border-l border-slate-100 text-center font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300">Ofertadas</TableHead>
                <TableHead colSpan={2} className="border-l border-slate-100 text-center font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300">Aceitas</TableHead>
                <TableHead colSpan={2} className="border-l border-slate-100 text-center font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300">Completas</TableHead>
                <TableHead colSpan={2} className="border-l border-slate-100 text-center font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300">Rejeitadas</TableHead>
                <TableHead colSpan={2} className="border-l border-slate-100 text-center font-semibold text-amber-600 dark:border-slate-800 dark:text-amber-400">Valor (R$)</TableHead>
            </TableRow>
            <TableRow className="border-b border-slate-100 hover:bg-transparent dark:border-slate-800">
                <TableHead className="border-l border-slate-100 px-1 text-right text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:border-slate-800">Ops</TableHead>
                <TableHead className="min-w-[50px] px-1 text-right text-[10px] font-bold uppercase tracking-wider text-sky-500 dark:text-sky-300">Mkt</TableHead>

                <TableHead className="border-l border-slate-100 px-1 text-right text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:border-slate-800">Ops</TableHead>
                <TableHead className="min-w-[60px] px-1 text-right text-[10px] font-bold uppercase tracking-wider text-sky-500 dark:text-sky-300">Mkt</TableHead>

                <TableHead className="border-l border-slate-100 px-1 text-right text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:border-slate-800">Ops</TableHead>
                <TableHead className="min-w-[50px] px-1 text-right text-[10px] font-bold uppercase tracking-wider text-sky-500 dark:text-sky-300">Mkt</TableHead>

                <TableHead className="border-l border-slate-100 px-1 text-right text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:border-slate-800">Ops</TableHead>
                <TableHead className="min-w-[50px] px-1 text-right text-[10px] font-bold uppercase tracking-wider text-sky-500 dark:text-sky-300">Mkt</TableHead>

                <TableHead className="border-l border-slate-100 px-1 text-right text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:border-slate-800">Ops</TableHead>
                <TableHead className="min-w-[50px] px-1 text-right text-[10px] font-bold uppercase tracking-wider text-sky-500 dark:text-sky-300">Mkt</TableHead>

                <TableHead className="border-l border-slate-100 px-1 text-right text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:border-slate-800">Ops</TableHead>
                <TableHead className="min-w-[50px] px-1 text-right text-[10px] font-bold uppercase tracking-wider text-sky-500 dark:text-sky-300">Mkt</TableHead>

                <TableHead className="border-l border-slate-100 px-1 text-right text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:border-slate-800">Ops</TableHead>
                <TableHead className="min-w-[70px] px-1 pr-4 text-right text-[10px] font-bold uppercase tracking-wider text-sky-500 dark:text-sky-300">Mkt</TableHead>
            </TableRow>
        </TableHeader>
    );
});
