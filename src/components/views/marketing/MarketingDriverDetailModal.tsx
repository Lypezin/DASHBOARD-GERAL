import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Loader2, FileSpreadsheet } from 'lucide-react';
import { fetchEntregadores } from '@/components/views/entregadores/EntregadoresDataFetcher';
import { fetchEntregadoresAggregation } from '@/components/views/entregadores/helpers/fetchEntregadoresAggregation';
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

    const getWeekRange = (iso: string) => {
        if (!iso) return { start: '', end: '' };
        const parts = iso.split('-W');
        if (parts.length !== 2) return { start: '', end: '' };
        const year = parseInt(parts[0]);
        const week = parseInt(parts[1]);
        return getDateRangeFromWeek(year, week);
    };

    const { start, end } = getWeekRange(semanaIso);

    const fetchData = useCallback(async () => {
        if (!isOpen || !semanaIso) return;

        setLoading(true);
        setError(null);
        setData([]);

        try {
            const { start, end } = getWeekRange(semanaIso);
            // High limit to ensure we get ALL drivers, not just the default 1000
            const limit = 20000;

            // 1. Fetch "Marketing" Drivers (via RPC)
            // This returns drivers flagged as Marketing by the backend logic
            const marketingList = await fetchEntregadores(
                { dataInicial: start, dataFinal: end }, // filtroRodouDia
                { dataInicial: null, dataFinal: null }, // filtroDataInicio
                '', // cidadeSelecionada (Empty = all cities)
                async () => [], // Fallback (not needed here as we handle errors)
                '', // searchTerm
                limit
            );

            // 2. Fetch "All" Drivers (Aggregation/Manual)
            // This bypasses the RPC logic and fetches everyone in the tables for that period
            const allDriversList = await fetchEntregadoresAggregation(
                { dataInicial: null, dataFinal: null },
                { dataInicial: start, dataFinal: end },
                '',
                ''
            );

            // 3. Separate Lists based on Tab
            if (activeTab === 'marketing') {
                setData(marketingList);
            } else {
                // Operational = All - Marketing
                // We identify Marketing drivers by their ID
                const marketingIds = new Set(marketingList.map(m => m.id_entregador));

                // Filter "All" list to keep only those NOT in "Marketing" list
                const opsList = allDriversList.filter(d => !marketingIds.has(d.id_entregador));

                setData(opsList);
            }

        } catch (err: any) {
            console.error("Error fetching details:", err);
            setError("Erro ao carregar detalhes.");
        } finally {
            setLoading(false);
        }
    }, [isOpen, semanaIso, activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleExport = () => {
        if (data.length === 0) return;

        const exportData = data.map(d => ({
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
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Detalhes da Semana {semanaIso}</DialogTitle>
                    <DialogDescription>
                        {start} até {end} • {activeTab === 'marketing' ? 'Entregadores Marketing' : 'Entregadores Operacional'}
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
                            disabled={loading || data.length === 0}
                            className="gap-2"
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            Exportar Excel
                        </Button>
                    </div>

                    <TabsContent value="marketing" className="flex-1 overflow-auto border rounded-md">
                        {renderTable(loading, error, data)}
                    </TabsContent>

                    <TabsContent value="operacional" className="flex-1 overflow-auto border rounded-md">
                        {renderTable(loading, error, data)}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

// Helper to render the table (avoid duplication)
function renderTable(loading: boolean, error: string | null, data: EntregadorMarketing[]) {
    if (loading) {
        return (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    if (error) {
        return <div className="p-4 text-center text-red-500">{error}</div>;
    }
    if (data.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">Nenhum dado encontrado.</div>;
    }
    return (
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
            </TableBody>
        </Table>
    );
}
