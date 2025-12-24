
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { EntregadorMarketing } from '@/types';
import { formatarHorasParaHMS } from '@/utils/formatters';

interface MarketingDriverTableProps {
    loading: boolean;
    error: string | null;
    data: EntregadorMarketing[];
    totalCount: number;
    onLoadMore: () => void;
}

export const MarketingDriverTable: React.FC<MarketingDriverTableProps> = ({
    loading,
    error,
    data,
    totalCount,
    onLoadMore
}) => {
    if (error) {
        return <div className="p-4 text-center text-red-500">{error}</div>;
    }

    // Show loading spinner only on initial load (empty data)
    if (loading && data.length === 0) {
        return (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (data.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">Nenhum dado encontrado.</div>;
    }

    const hasMore = data.length < totalCount;

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>ID</TableHead>
                            <TableHead className="text-right">Horas</TableHead>
                            <TableHead className="text-right">Ofertadas</TableHead>
                            <TableHead className="text-right">Aceitas</TableHead>
                            <TableHead className="text-right">Concluídas</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row) => (
                            <TableRow key={row.id_entregador}>
                                <TableCell className="font-medium">{row.nome}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{row.id_entregador}</TableCell>
                                <TableCell className="text-right font-mono">{formatarHorasParaHMS(row.total_segundos / 3600)}</TableCell>
                                <TableCell className="text-right">{row.total_ofertadas}</TableCell>
                                <TableCell className="text-right">{row.total_aceitas}</TableCell>
                                <TableCell className="text-right">{row.total_completadas}</TableCell>
                            </TableRow>
                        ))}
                        {loading && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {hasMore && !loading && (
                <div className="p-4 border-t flex justify-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <Button variant="secondary" onClick={onLoadMore} className="w-full max-w-sm">
                        Carregar Mais ({totalCount - data.length} restantes)
                    </Button>
                </div>
            )}
        </div>
    );
};
