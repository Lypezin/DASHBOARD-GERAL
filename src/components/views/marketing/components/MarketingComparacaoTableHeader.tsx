import React from 'react';
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const MarketingComparacaoTableHeader = React.memo(function MarketingComparacaoTableHeader() {
    return (
        <TableHeader className="bg-[#f6f9fb] dark:bg-slate-900">
            <TableRow className="border-b border-[#d8e4eb] hover:bg-transparent dark:border-slate-800">
                <TableHead scope="col" rowSpan={2} className="w-[100px] whitespace-nowrap pl-4 text-xs font-semibold text-slate-600 dark:text-slate-300">Semana</TableHead>
                <TableHead scope="col" rowSpan={2} className="w-[88px] whitespace-nowrap text-center text-xs font-semibold text-slate-600 dark:text-slate-300">Detalhes</TableHead>
                <TableHead scope="colgroup" colSpan={2} className="border-l border-[#e2ebf0] text-center text-xs font-semibold text-[#183f58] dark:border-slate-800 dark:text-slate-200">Entregadores</TableHead>
                <TableHead scope="colgroup" colSpan={2} className="border-l border-[#e2ebf0] text-center text-xs font-semibold text-[#183f58] dark:border-slate-800 dark:text-slate-200">Horas logadas</TableHead>
                <TableHead scope="colgroup" colSpan={2} className="border-l border-[#e2ebf0] text-center text-xs font-semibold text-[#183f58] dark:border-slate-800 dark:text-slate-200">Ofertadas</TableHead>
                <TableHead scope="colgroup" colSpan={2} className="border-l border-[#e2ebf0] text-center text-xs font-semibold text-[#183f58] dark:border-slate-800 dark:text-slate-200">Aceitas</TableHead>
                <TableHead scope="colgroup" colSpan={2} className="border-l border-[#e2ebf0] text-center text-xs font-semibold text-[#183f58] dark:border-slate-800 dark:text-slate-200">Completadas</TableHead>
                <TableHead scope="colgroup" colSpan={2} className="border-l border-[#e2ebf0] text-center text-xs font-semibold text-[#183f58] dark:border-slate-800 dark:text-slate-200">Rejeitadas</TableHead>
                <TableHead scope="colgroup" colSpan={2} className="border-l border-[#e2ebf0] text-center text-xs font-semibold text-[#183f58] dark:border-slate-800 dark:text-slate-200">Valor (R$)</TableHead>
            </TableRow>
            <TableRow className="border-b border-[#d8e4eb] hover:bg-transparent dark:border-slate-800">
                <TableHead scope="col" className="border-l border-[#e2ebf0] px-2 text-right text-[11px] font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">Ops</TableHead>
                <TableHead scope="col" className="min-w-[50px] px-2 text-right text-[11px] font-semibold text-[#38708e] dark:text-sky-300">Mkt</TableHead>

                <TableHead scope="col" className="border-l border-[#e2ebf0] px-2 text-right text-[11px] font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">Ops</TableHead>
                <TableHead scope="col" className="min-w-[60px] px-2 text-right text-[11px] font-semibold text-[#38708e] dark:text-sky-300">Mkt</TableHead>

                <TableHead scope="col" className="border-l border-[#e2ebf0] px-2 text-right text-[11px] font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">Ops</TableHead>
                <TableHead scope="col" className="min-w-[50px] px-2 text-right text-[11px] font-semibold text-[#38708e] dark:text-sky-300">Mkt</TableHead>

                <TableHead scope="col" className="border-l border-[#e2ebf0] px-2 text-right text-[11px] font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">Ops</TableHead>
                <TableHead scope="col" className="min-w-[50px] px-2 text-right text-[11px] font-semibold text-[#38708e] dark:text-sky-300">Mkt</TableHead>

                <TableHead scope="col" className="border-l border-[#e2ebf0] px-2 text-right text-[11px] font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">Ops</TableHead>
                <TableHead scope="col" className="min-w-[50px] px-2 text-right text-[11px] font-semibold text-[#38708e] dark:text-sky-300">Mkt</TableHead>

                <TableHead scope="col" className="border-l border-[#e2ebf0] px-2 text-right text-[11px] font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">Ops</TableHead>
                <TableHead scope="col" className="min-w-[50px] px-2 text-right text-[11px] font-semibold text-[#38708e] dark:text-sky-300">Mkt</TableHead>

                <TableHead scope="col" className="border-l border-[#e2ebf0] px-2 text-right text-[11px] font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">Ops</TableHead>
                <TableHead scope="col" className="min-w-[70px] px-2 pr-4 text-right text-[11px] font-semibold text-[#38708e] dark:text-sky-300">Mkt</TableHead>
            </TableRow>
        </TableHeader>
    );
});
