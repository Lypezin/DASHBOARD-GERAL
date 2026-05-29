'use client';

import React from 'react';
import { useEntradaSaidaData } from './useEntradaSaidaData';
import { Activity, FileSpreadsheet } from 'lucide-react';
import { EntradaSaidaStatsCards } from './components/EntradaSaidaStatsCards';
import { EntradaSaidaWeeklyGrid } from './components/EntradaSaidaWeeklyGrid';
import { Button } from '@/components/ui/button';
import { loadXLSX } from '@/lib/xlsxClient';

interface EntradaSaidaViewProps {
    dataInicial: string | null;
    dataFinal: string | null;
    organizationId?: string;
    praca?: string | null;
}

export const EntradaSaidaView: React.FC<EntradaSaidaViewProps> = ({ dataInicial, dataFinal, organizationId, praca }) => {
    const { data, loading, error } = useEntradaSaidaData({ dataInicial, dataFinal, organizationId, praca });

    const handleExport = async () => {
        if (!data || data.length === 0) return;

        const formattedData = data.map(item => ({
            Semana: item.semana,
            'Entradas Total': item.entradas_total,
            'Entradas Mkt': item.entradas_marketing,
            'Entradas Ops': item.entradas_operacional,
            'Saidas Total': item.saidas_total,
            'Saidas Mkt': item.saidas_marketing,
            'Saidas Ops': item.saidas_operacional,
            Saldo: item.saldo,
            'Base Ativa': item.base_ativa,
            'Variacao Base': item.variacao_base,
            Retomada: item.retomada_total,
            'Desistencias Novos': item.saidas_novos,
            'Saldo Mkt': Number(item.entradas_marketing) - Number(item.saidas_marketing),
            'Saldo Ops': Number(item.entradas_operacional) - Number(item.saidas_operacional)
        }));

        const XLSX = await loadXLSX();
        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Fluxo Semanal');

        const dateStr = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `fluxo_entregadores_marketing_${dateStr}.xlsx`);
    };

    if (loading) return (
        <div className="flex h-80 items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="h-14 w-14 rounded-full border-4 border-sky-100 dark:border-sky-900/50"></div>
                    <div className="absolute left-0 top-0 h-14 w-14 animate-spin rounded-full border-4 border-transparent border-t-sky-600"></div>
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Carregando dados...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-8 text-center shadow-sm dark:border-rose-900/50 dark:from-rose-950/20 dark:to-slate-900">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/40">
                <Activity className="h-7 w-7 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-lg font-semibold text-rose-900 dark:text-rose-100">Erro ao carregar dados</h3>
            <p className="mx-auto mt-2 max-w-md text-rose-700 dark:text-rose-300">{error}</p>
        </div>
    );

    return (
        <div className="mx-auto max-w-7xl space-y-8 animate-fade-in">
            <div className="flex justify-end">
                <Button
                    onClick={handleExport}
                    variant="outline"
                    className="gap-2 border-slate-200 bg-white text-slate-700 shadow-sm transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-sky-500/40 dark:hover:bg-slate-700"
                >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    Exportar Excel
                </Button>
            </div>

            <EntradaSaidaStatsCards data={data} />
            <EntradaSaidaWeeklyGrid
                data={data}
                organizationId={organizationId}
                praca={praca}
            />
        </div>
    );
};
