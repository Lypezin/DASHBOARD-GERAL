
import { useCallback, useState } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { getDateRangeFromWeek } from '@/utils/timeHelpers';

interface UseMarketingExcelExportProps {
    semanaIso: string;
    organizationId: string | null;
    activeTab: 'marketing' | 'operacional';
    praca?: string | null;
}

export function useMarketingExcelExport({
    semanaIso,
    organizationId,
    activeTab,
    praca
}: UseMarketingExcelExportProps) {
    const [exportLoading, setExportLoading] = useState(false);

    const getWeekRange = (iso: string) => {
        if (!iso) return { start: '', end: '' };
        const parts = iso.split('-W');
        if (parts.length !== 2) return { start: '', end: '' };
        const year = parseInt(parts[0]);
        const week = parseInt(parts[1]);
        return getDateRangeFromWeek(year, week);
    };

    const handleExport = useCallback(async () => {
        try {
            setExportLoading(true);
            const { start, end } = getWeekRange(semanaIso);

            // Dynamic import for XLSX
            const XLSX = await import('xlsx');
            const { formatarHorasParaHMS } = await import('@/utils/formatters');

            let exportData: any[] = [];

            if (activeTab === 'operacional') {
                // Use custom fetch for Operacional to get praca field
                const { fetchOperacionalExportData } = await import('./fetchOperacionalExportData');

                const result = await fetchOperacionalExportData({
                    organizationId,
                    startDate: start,
                    endDate: end,
                    praca
                });

                exportData = result.map(d => ({
                    ID: d.id_entregador,
                    Nome: d.nome,
                    'Região': d.praca || '--',
                    'Horas Logadas': formatarHorasParaHMS(d.total_segundos / 3600),
                    'Ofertadas': d.total_ofertadas,
                    'Aceitas': d.total_aceitas,
                    'Concluídas': d.total_completadas,
                    'Rejeitadas': d.total_rejeitadas,
                }));
            } else {
                // Use standard fetch for Marketing
                const { fetchEntregadoresDetails } = await import('@/components/views/entregadores/EntregadoresDataFetcher');

                const result = await fetchEntregadoresDetails({
                    organizationId,
                    startDate: start,
                    endDate: end,
                    type: 'MARKETING',
                    limit: 100000,
                    offset: 0,
                    praca
                });

                exportData = result.data.map(d => ({
                    ID: d.id_entregador,
                    Nome: d.nome,
                    'Região': d.regiao_atuacao || '--',
                    'Horas Logadas': formatarHorasParaHMS(d.total_segundos / 3600),
                    'Ofertadas': d.total_ofertadas,
                    'Aceitas': d.total_aceitas,
                    'Concluídas': d.total_completadas,
                    'Rejeitadas': d.total_rejeitadas,
                }));
            }

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Dados");
            XLSX.writeFile(wb, `Detalhes_${activeTab}_${semanaIso}.xlsx`);

        } catch (err) {
            safeLog.error("Erro ao exportar:", err);
        } finally {
            setExportLoading(false);
        }
    }, [semanaIso, organizationId, activeTab, praca]);

    return {
        exportLoading,
        handleExport
    };
}
