import React from 'react';
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const MarketingComparacaoTableHeader = React.memo(function MarketingComparacaoTableHeader() {
    return (
        <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <TableHead rowSpan={2} className="w-[100px] font-semibold text-slate-500 dark:text-slate-400 pl-4">Semana</TableHead>
                <TableHead rowSpan={2} className="w-[50px] text-center font-semibold text-slate-500 dark:text-slate-400">Ver</TableHead>
                <TableHead colSpan={2} className="text-center border-l border-slate-100 dark:border-slate-800 font-semibold text-indigo-600 dark:text-indigo-400">Entregadores</TableHead>
                <TableHead colSpan={2} className="text-center border-l border-slate-100 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-300">Horas Logadas</TableHead>
                <TableHead colSpan={2} className="text-center border-l border-slate-100 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-300">Ofertadas</TableHead>
                <TableHead colSpan={2} className="text-center border-l border-slate-100 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-300">Aceitas</TableHead>
                <TableHead colSpan={2} className="text-center border-l border-slate-100 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-300">Completas</TableHead>
                <TableHead colSpan={2} className="text-center border-l border-slate-100 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-300">Rejeitadas</TableHead>
                <TableHead colSpan={2} className="text-center border-l border-slate-100 dark:border-slate-800 font-semibold text-amber-600 dark:text-amber-400">Valor (R$)</TableHead>
            </TableRow>
            <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                {/* Entregadores Sub-headers */}
                <TableHead className="text-right border-l border-slate-100 dark:border-slate-800 text-[10px] uppercase tracking-wider font-medium text-slate-400 px-1">Ops</TableHead>
                <TableHead className="text-right text-[10px] uppercase tracking-wider font-bold text-purple-500 px-1 min-w-[50px]">Mkt</TableHead>

                {/* Hours Sub-headers */}
                <TableHead className="text-right border-l border-slate-100 dark:border-slate-800 text-[10px] uppercase tracking-wider font-medium text-slate-400 px-1">Ops</TableHead>
                <TableHead className="text-right text-[10px] uppercase tracking-wider font-bold text-purple-500 px-1 min-w-[60px]">Mkt</TableHead>

                {/* Ofertadas Sub-headers */}
                <TableHead className="text-right border-l border-slate-100 dark:border-slate-800 text-[10px] uppercase tracking-wider font-medium text-slate-400 px-1">Ops</TableHead>
                <TableHead className="text-right text-[10px] uppercase tracking-wider font-bold text-purple-500 px-1 min-w-[50px]">Mkt</TableHead>

                {/* Aceitas Sub-headers */}
                <TableHead className="text-right border-l border-slate-100 dark:border-slate-800 text-[10px] uppercase tracking-wider font-medium text-slate-400 px-1">Ops</TableHead>
                <TableHead className="text-right text-[10px] uppercase tracking-wider font-bold text-purple-500 px-1 min-w-[50px]">Mkt</TableHead>

                {/* Completas Sub-headers */}
                <TableHead className="text-right border-l border-slate-100 dark:border-slate-800 text-[10px] uppercase tracking-wider font-medium text-slate-400 px-1">Ops</TableHead>
                <TableHead className="text-right text-[10px] uppercase tracking-wider font-bold text-purple-500 px-1 min-w-[50px]">Mkt</TableHead>

                {/* Rejeitadas Sub-headers */}
                <TableHead className="text-right border-l border-slate-100 dark:border-slate-800 text-[10px] uppercase tracking-wider font-medium text-slate-400 px-1">Ops</TableHead>
                <TableHead className="text-right text-[10px] uppercase tracking-wider font-bold text-purple-500 px-1 min-w-[50px]">Mkt</TableHead>

                {/* Valor Sub-headers */}
                <TableHead className="text-right border-l border-slate-100 dark:border-slate-800 text-[10px] uppercase tracking-wider font-medium text-slate-400 px-1">Ops</TableHead>
                <TableHead className="text-right text-[10px] uppercase tracking-wider font-bold text-purple-500 pr-4 px-1 min-w-[70px]">Mkt</TableHead>
            </TableRow>
        </TableHeader>
    );
});
