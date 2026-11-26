import React, { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import {
    TableBody,
    TableCell,
    TableRow,
} from "@/components/ui/table";
import { useOrganization } from '@/contexts/OrganizationContext';
import { MarketingComparacaoRow } from './components/MarketingComparacaoRow';
import { MarketingComparacaoTableHeader } from './components/MarketingComparacaoTableHeader';

const MarketingDriverDetailModal = dynamic(
    () => import('./MarketingDriverDetailModal').then((mod) => ({ default: mod.MarketingDriverDetailModal })),
    { ssr: false }
);

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
    const handleCloseModal = useCallback(() => setSelectedWeek(null), []);

    return (
        <div className="subtle-scrollbar overflow-auto overscroll-x-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#38708e]" role="region" aria-label="Tabela do comparativo semanal" tabIndex={0}>
            <table className="w-full min-w-[1120px] text-sm">
                <caption className="sr-only">Comparação semanal entre as métricas de Operacional e Marketing. Use o botão de detalhes para consultar os entregadores de cada semana.</caption>
                <MarketingComparacaoTableHeader />
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
            </table>

            {selectedWeek ? (
                <MarketingDriverDetailModal
                    isOpen
                    onClose={handleCloseModal}
                    semanaIso={selectedWeek}
                    organizationId={organizationId}
                    praca={praca}
                />
            ) : null}
        </div>
    );
});
