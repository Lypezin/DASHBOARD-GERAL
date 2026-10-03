'use client';

import React, { useState } from 'react';
import { useEntradaSaidaData } from './useEntradaSaidaData';
import { Activity, FileSpreadsheet } from 'lucide-react';
import { EntradaSaidaStatsCards } from './components/EntradaSaidaStatsCards';
import { EntradaSaidaWeeklyGrid } from './components/EntradaSaidaWeeklyGrid';
import { Button } from '@/components/ui/button';
import { loadXLSX } from '@/lib/xlsxClient';
import { appendStyledJsonSheet, applyWorkbookMetadata, assertExcelRowLimit } from '@/utils/excel/workbookStyle';
import { safeLog } from '@/lib/errorHandler';
import { toast } from 'sonner';

interface EntradaSaidaViewProps {
    dataInicial: string | null;
    dataFinal: string | null;
    organizationId?: string;
    praca?: string | null;
}

export const EntradaSaidaView: React.FC<EntradaSaidaViewProps> = ({ dataInicial, dataFinal, organizationId, praca }) => {
    const { data, loading, error } = useEntradaSaidaData({ dataInicial, dataFinal, organizationId, praca });
    const [isExporting, setIsExporting] = useState(false);
    const hasData = data.length > 0;
    const exportDisabled = isExporting || loading || Boolean(error) || !hasData;

    const handleExport = async () => {
        if (exportDisabled) return;

        try {
        setIsExporting(true);
        assertExcelRowLimit(data.length);
        const formattedData = data.map(item => ({
            Semana: item.semana,
            'Entradas Total': item.entradas_total,
            'Entradas Mkt': item.entradas_marketing,
            'Entradas Ops': item.entradas_operacional,
            'Sa\u00eddas Total': item.saidas_total,
            'Sa\u00eddas Mkt': item.saidas_marketing,
            'Sa\u00eddas Ops': item.saidas_operacional,
            Saldo: item.saldo,
            'Base Ativa': item.base_ativa,
            'Varia\u00e7\u00e3o Base': item.variacao_base,
            Retomada: item.retomada_total,
            'Desist\u00eancias Novos': item.saidas_novos,
            'Saldo Mkt': Number(item.entradas_marketing) - Number(item.saidas_marketing),
            'Saldo Ops': Number(item.entradas_operacional) - Number(item.saidas_operacional)
        }));

        const XLSX = await loadXLSX();
        const wb = XLSX.utils.book_new();
        applyWorkbookMetadata(wb, 'Fluxo semanal de entregadores');
        appendStyledJsonSheet(XLSX, wb, formattedData, 'Fluxo Semanal', {
            title: 'Fluxo semanal de entregadores',
            subtitle: `Período: ${dataInicial || 'início disponível'} a ${dataFinal || 'hoje'} · Praça: ${praca || 'Todas as praças'}`,
            theme: 'blue',
            highlightFirstColumn: true,
        });
        appendStyledJsonSheet(XLSX, wb, [
            { Filtro: 'Organização (ID)', Valor: organizationId || 'Todas' },
            { Filtro: 'Data inicial', Valor: dataInicial || 'Início disponível' },
            { Filtro: 'Data final', Valor: dataFinal || 'Hoje' },
            { Filtro: 'Praça', Valor: praca || 'Todas' },
        ], 'Filtros', {
            title: 'Filtros aplicados',
            theme: 'slate',
            highlightFirstColumn: true,
        });

        const dateStr = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `fluxo_entregadores_marketing_${dateStr}.xlsx`);
        } catch (exportError) {
            safeLog.error('Erro ao exportar fluxo semanal:', exportError);
            toast.error(exportError instanceof Error ? exportError.message : 'Não foi possível gerar o Excel do fluxo semanal.');
        } finally {
            setIsExporting(false);
        }
    };

    if (loading && !hasData) return (
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

    if (error && !hasData) return (
        <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-8 text-center shadow-sm dark:border-rose-900/50 dark:from-rose-950/20 dark:to-slate-900">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/40">
                <Activity className="h-7 w-7 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-lg font-semibold text-rose-900 dark:text-rose-100">Erro ao carregar dados</h3>
            <p className="mx-auto mt-2 max-w-md text-rose-700 dark:text-rose-300">
                Não foi possível carregar o fluxo para este período e estes filtros. {error}
            </p>
        </div>
    );

    if (!loading && !error && !hasData) return (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <Activity className="h-7 w-7 text-slate-500 dark:text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Nenhum dado neste período</h3>
            <p className="mx-auto mt-2 max-w-md text-slate-600 dark:text-slate-400">
                Não há movimentação de entregadores para a praça e o intervalo selecionados.
            </p>
        </div>
    );

    return (
        <div className="mx-auto max-w-7xl space-y-8 motion-safe:animate-fade-in">
            {loading ? (
                <div className="rounded-2xl border border-sky-200/70 bg-sky-50/80 px-4 py-3 text-sm font-semibold text-sky-800 shadow-sm dark:border-sky-900/50 dark:bg-sky-950/25 dark:text-sky-200">
                    Atualizando fluxo semanal com os filtros atuais...
                </div>
            ) : null}

            {error ? (
                <div className="rounded-2xl border border-amber-200/70 bg-amber-50/85 px-4 py-3 text-sm font-semibold text-amber-800 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-200">
                    {error}
                </div>
            ) : null}

            <div className="flex justify-end">
                <Button
                    onClick={handleExport}
                    disabled={exportDisabled}
                    variant="outline"
                    className="gap-2 border-slate-200 bg-white text-slate-700 shadow-sm transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-sky-500/40 dark:hover:bg-slate-700"
                >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    {isExporting ? 'Preparando Excel...' : 'Exportar Excel'}
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
