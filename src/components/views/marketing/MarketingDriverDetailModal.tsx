import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button'; // Assuming you have a Button component
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Loader2, FileSpreadsheet } from 'lucide-react';
import { fetchEntregadores } from '@/components/views/entregadores/EntregadoresDataFetcher'; // Adjust import path
import { getDateRangeFromWeek } from '@/utils/timeHelpers'; // You might need to create/import this
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
            // Convert week to date range for 'rodou_dia' filter
            const { start, end } = getWeekRange(semanaIso);

            // Reusing fetchEntregadores. 
            // Note: This fetches "Marketing" drivers. 
            // For separate Ops/Mkt, we assume this function returns what we classify as "Marketing" here.
            // If we need "Ops", we might need a different fetcher or filter.

            if (activeTab === 'marketing') {
                const result = await fetchEntregadores(
                    { dataInicial: start, dataFinal: end }, // filtroRodouDia
                    { dataInicial: null, dataFinal: null }, // filtroDataInicio
                    '', // cidadeSelecionada (Empty means all? Need to check fetcher logic)
                    async () => [], // Fallback
                    '' // searchTerm
                );
                setData(result);
            } else {
                // TODO: Implement Ops fetcher
                // For now, return empty or implement if source found
                setData([]);
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
                        {start} até {end}
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
                        {loading ? (
                            <div className="flex justify-center items-center h-40">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : error ? (
                            <div className="p-4 text-center text-red-500">{error}</div>
                        ) : data.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">Nenhum dado encontrado.</div>
                        ) : (
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
                        )}
                    </TabsContent>

                    <TabsContent value="operacional" className="flex-1 overflow-auto border rounded-md p-4">
                        <div className="text-center text-muted-foreground">
                            Visualização detalhada do Operacional em desenvolvimento.
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
