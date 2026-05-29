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
    onLoadMore,
}) => {
    if (error) {
        return <div className="p-6 text-center text-red-500">{error}</div>;
    }

    if (loading && data.length === 0) {
        return (
            <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (data.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">Nenhum dado encontrado.</div>;
    }

    const hasMore = data.length < totalCount;

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="subtle-scrollbar min-h-0 flex-1 overflow-auto overscroll-contain">
                <Table className="min-w-[760px]">
                    <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur dark:bg-slate-950/90">
                        <TableRow>
                            <TableHead className="pl-5">Nome</TableHead>
                            <TableHead>ID</TableHead>
                            <TableHead className="text-right">Horas</TableHead>
                            <TableHead className="text-right">Ofertadas</TableHead>
                            <TableHead className="text-right">Aceitas</TableHead>
                            <TableHead className="pr-5 text-right">Concluidas</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row) => (
                            <TableRow key={row.id_entregador}>
                                <TableCell className="max-w-[280px] pl-5 font-medium">
                                    <span className="block truncate" title={row.nome}>
                                        {row.nome}
                                    </span>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{row.id_entregador}</TableCell>
                                <TableCell className="text-right font-mono">{formatarHorasParaHMS(row.total_segundos / 3600)}</TableCell>
                                <TableCell className="text-right">{row.total_ofertadas}</TableCell>
                                <TableCell className="text-right">{row.total_aceitas}</TableCell>
                                <TableCell className="pr-5 text-right">{row.total_completadas}</TableCell>
                            </TableRow>
                        ))}
                        {loading && (
                            <TableRow>
                                <TableCell colSpan={6} className="py-4 text-center">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {hasMore && !loading && (
                <div className="border-t bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <Button variant="secondary" onClick={onLoadMore} className="w-full">
                        Carregar Mais ({totalCount - data.length} restantes)
                    </Button>
                </div>
            )}
        </div>
    );
};
