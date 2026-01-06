
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
                    <TableRow className="bg-slate-50 dark:bg-slate-900 border-b-2 border-slate-100 dark:border-slate-800">
                        <TableHead rowSpan={2} className="w-[100px] font-bold text-slate-700 dark:text-slate-300">Semana</TableHead>
                        <TableHead rowSpan={2} className="w-[50px] text-center font-bold text-slate-700 dark:text-slate-300">Detalhes</TableHead>
                        <TableHead colSpan={2} className="text-center border-l border-slate-200 dark:border-slate-800 bg-blue-50/80 dark:bg-blue-900/20 font-bold text-blue-700 dark:text-blue-300">Horas Logadas</TableHead>
                        <TableHead colSpan={2} className="text-center border-l border-slate-200 dark:border-slate-800 font-bold">Ofertadas</TableHead>
                        <TableHead colSpan={2} className="text-center border-l border-slate-200 dark:border-slate-800 font-bold">Aceitas</TableHead>
                        <TableHead colSpan={2} className="text-center border-l border-slate-200 dark:border-slate-800 font-bold">Completas</TableHead>
                        <TableHead colSpan={2} className="text-center border-l border-slate-200 dark:border-slate-800 font-bold text-rose-600 dark:text-rose-400">Rejeitadas</TableHead>
                    </TableRow>
                    <TableRow className="hover:bg-transparent">
                        {/* Hours Sub-headers */}
                        <TableHead className="text-right border-l border-slate-200 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-900/10 text-[11px] uppercase tracking-wider">Operacional</TableHead>
                        <TableHead className="text-right bg-blue-50/50 dark:bg-blue-900/10 text-[11px] uppercase tracking-wider text-purple-600 font-bold">Marketing</TableHead>

                        {/* Ofertadas Sub-headers */}
                        <TableHead className="text-right border-l border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider">Ops</TableHead>
                        <TableHead className="text-right text-[11px] uppercase tracking-wider text-purple-600 font-bold">Mkt</TableHead>

                        {/* Aceitas Sub-headers */}
                        <TableHead className="text-right border-l border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider">Ops</TableHead>
                        <TableHead className="text-right text-[11px] uppercase tracking-wider text-purple-600 font-bold">Mkt</TableHead>

                        {/* Completas Sub-headers */}
                        <TableHead className="text-right border-l border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider">Ops</TableHead>
                        <TableHead className="text-right text-[11px] uppercase tracking-wider text-purple-600 font-bold">Mkt</TableHead>

                        {/* Rejeitadas Sub-headers */}
                        <TableHead className="text-right border-l border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-rose-600/70">Ops</TableHead>
                        <TableHead className="text-right text-[11px] uppercase tracking-wider text-purple-600 font-bold">Mkt</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={14} className="h-24 text-center">
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
