import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Loader2, FileSpreadsheet } from 'lucide-react';
import { getDateRangeFromWeek } from '@/utils/timeHelpers';
import { EntregadorMarketing } from '@/types';
import * as XLSX from 'xlsx';
import { formatarHorasParaHMS } from '@/utils/formatters';

interface MarketingDriverDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    semanaIso: string; // e.g., "2024-W30"
    organizationId: string | null;
}

export const MarketingDriverDetailModal: React.FC<MarketingDriverDetailModalProps> = ({
    isOpen,
    onClose,
    semanaIso,
    organizationId
}) => {
    const [activeTab, setActiveTab] = useState<'marketing' | 'operacional'>('marketing');
    const [data, setData] = useState<EntregadorMarketing[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pagination state
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const LIMIT = 50;

    const getWeekRange = (iso: string) => {
        if (!iso) return { start: '', end: '' };
        const parts = iso.split('-W');
        if (parts.length !== 2) return { start: '', end: '' };
        const year = parseInt(parts[0]);
        const week = parseInt(parts[1]);
        return getDateRangeFromWeek(year, week);
    };

    const { start, end } = getWeekRange(semanaIso);

    const loadData = useCallback(async (pageNum: number, isReset: boolean) => {
        if (!isOpen || !semanaIso) return;

        setLoading(true);
        setError(null);
        if (isReset) {
            setData([]);
        }

        try {
            const { start, end } = getWeekRange(semanaIso);
            const offset = pageNum * LIMIT;

            // Import dynamically or ensure it's imported at top
            const { fetchEntregadoresDetails } = await import('@/components/views/entregadores/EntregadoresDataFetcher');

            const result = await fetchEntregadoresDetails({
                organizationId,
                startDate: start,
                endDate: end,
                type: activeTab === 'marketing' ? 'MARKETING' : 'OPERATIONAL',
                limit: LIMIT,
                offset: offset
            });

            if (isReset) {
                setData(result.data);
                setTotalCount(result.totalCount);
            } else {
                setData(prev => [...prev, ...result.data]);
            }

        } catch (err: any) {
            console.error("Error fetching details:", err);
            setError("Erro ao carregar detalhes.");
        } finally {
            setLoading(false);
        }
    }, [isOpen, semanaIso, activeTab, organizationId]);

    // Reset and load when tab or week changes
    useEffect(() => {
        setPage(0);
        loadData(0, true);
    }, [semanaIso, activeTab, loadData]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadData(nextPage, false);
    };

    const handleExport = async () => {
        try {
            setLoading(true);
            const { start, end } = getWeekRange(semanaIso);

            // Import dynamically
            const { fetchEntregadoresDetails } = await import('@/components/views/entregadores/EntregadoresDataFetcher');

            // Fetch ALL data for export (using a high limit like 100000)
            const result = await fetchEntregadoresDetails({
                organizationId,
                startDate: start,
                endDate: end,
                type: activeTab === 'marketing' ? 'MARKETING' : 'OPERATIONAL',
                limit: 100000,
                offset: 0
            });

            const exportData = result.data.map(d => ({
                ID: d.id_entregador,
                Nome: d.nome,
                'Região': d.regiao_atuacao,
                'Horas Logadas': formatarHorasParaHMS(d.total_segundos / 3600),
                'Ofertadas': d.total_ofertadas,
                'Aceitas': d.total_aceitas,
                'Concluídas': d.total_completadas,
                'Rejeitadas': d.total_rejeitadas,
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Dados");
            XLSX.writeFile(wb, `Detalhes_${activeTab}_${semanaIso}.xlsx`);

        } catch (err) {
            console.error("Erro ao exportar:", err);
            // Optionally show error toast
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Detalhes da Semana {semanaIso}</DialogTitle>
                    <DialogDescription>
                        {start} até {end} • {activeTab === 'marketing' ? 'Entregadores Marketing' : 'Entregadores Operacional'}
                        {totalCount > 0 && ` • Total: ${totalCount}`}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full flex-1 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                        <TabsList>
                            <TabsTrigger value="marketing">Marketing</TabsTrigger>
                            <TabsTrigger value="operacional">Operacional</TabsTrigger>
                        </TabsList>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                            disabled={loading}
                            className="gap-2"
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            Exportar Excel
                        </Button>
                    </div>

                    <TabsContent value="marketing" className="flex-1 overflow-auto border rounded-md relative">
                        {renderTable(loading, error, data, totalCount, handleLoadMore)}
                    </TabsContent>

                    <TabsContent value="operacional" className="flex-1 overflow-auto border rounded-md relative">
                        {renderTable(loading, error, data, totalCount, handleLoadMore)}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

// Helper to render the table (avoid duplication)
function renderTable(
    loading: boolean,
    error: string | null,
    data: EntregadorMarketing[],
    totalCount: number,
    onLoadMore: () => void
) {
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
}
