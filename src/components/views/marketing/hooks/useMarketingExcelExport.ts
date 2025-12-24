
import { useCallback, useState } from 'react';
import { getDateRangeFromWeek } from '@/utils/timeHelpers';

interface UseMarketingExcelExportProps {
    semanaIso: string;
    organizationId: string | null;
    activeTab: 'marketing' | 'operacional';
}

export function useMarketingExcelExport({
    semanaIso,
    organizationId,
    activeTab
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

            const { fetchEntregadoresDetails } = await import('@/components/views/entregadores/EntregadoresDataFetcher');

            // Dynamic import for XLSX
            const XLSX = await import('xlsx');
            const { formatarHorasParaHMS } = await import('@/utils/formatters');

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
        } finally {
            setExportLoading(false);
        }
    }, [semanaIso, organizationId, activeTab]);

    return {
        exportLoading,
        handleExport
    };
}
