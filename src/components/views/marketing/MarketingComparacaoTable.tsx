
import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { MarketingDriverDetailModal } from './MarketingDriverDetailModal';
import { useOrganization } from '@/contexts/OrganizationContext';
import { MarketingComparacaoRow } from './components/MarketingComparacaoRow';

interface ComparacaoRow {
    semana_iso: string;
    segundos_ops: number;
    segundos_mkt: number;
    ofertadas_ops: number;
    ofertadas_mkt: number;
    aceitas_ops: number;
    aceitas_mkt: number;
    concluidas_ops: number;
    concluidas_mkt: number;
    rejeitadas_ops: number;
    rejeitadas_mkt: number;
    valor_ops?: number;
    valor_mkt?: number;
}

interface MarketingComparacaoTableProps {
    data: ComparacaoRow[];
    praca?: string | null;
}

export const MarketingComparacaoTable = React.memo(function MarketingComparacaoTable({ data, praca }: MarketingComparacaoTableProps) {
    const { organizationId } = useOrganization();
    const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

    return (
        <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <Table>
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
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={16} className="h-24 text-center">
                                Nenhum dado encontrado para o período selecionado.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((row) => (
                            <MarketingComparacaoRow
                                key={row.semana_iso}
                                row={row}
                                onSelectWeek={setSelectedWeek}
                            />
                        ))
                    )}
                </TableBody>
            </Table>

            <MarketingDriverDetailModal
                isOpen={!!selectedWeek}
                onClose={() => setSelectedWeek(null)}
                semanaIso={selectedWeek || ''}
                organizationId={organizationId}
                praca={praca}
            />
        </div>
    );
});
