
import { useState, useCallback, useEffect } from 'react';
import { getDateRangeFromWeek } from '@/utils/timeHelpers';
import { EntregadorMarketing } from '@/types';
import { useMarketingExcelExport } from './hooks/useMarketingExcelExport';

const LIMIT = 50;

interface UseMarketingDriverDetailsProps {
    isOpen: boolean;
    semanaIso: string;
    organizationId: string | null;
    praca?: string | null;
    activeTab: 'marketing' | 'operacional';
}

export const useMarketingDriverDetails = ({
    isOpen,
    semanaIso,
    organizationId,
    praca,
    activeTab
}: UseMarketingDriverDetailsProps) => {
    const [data, setData] = useState<EntregadorMarketing[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    const { exportLoading, handleExport } = useMarketingExcelExport({
        semanaIso,
        organizationId,
        activeTab
    });

    const getWeekRange = useCallback((iso: string) => {
        if (!iso) return { start: '', end: '' };
        const parts = iso.split('-W');
        if (parts.length !== 2) return { start: '', end: '' };
        const year = parseInt(parts[0]);
        const week = parseInt(parts[1]);
        return getDateRangeFromWeek(year, week);
    }, []);

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

            const { fetchEntregadoresDetails } = await import('@/components/views/entregadores/EntregadoresDataFetcher');

            const result = await fetchEntregadoresDetails({
                organizationId,
                startDate: start,
                endDate: end,
                type: activeTab === 'marketing' ? 'MARKETING' : 'OPERATIONAL',
                limit: LIMIT,
                offset: offset,
                praca: praca
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
    }, [isOpen, semanaIso, activeTab, organizationId, praca, getWeekRange]);

    useEffect(() => {
        setPage(0);
        loadData(0, true);
    }, [semanaIso, activeTab, loadData]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadData(nextPage, false);
    };

    return {
        data,
        loading: loading || exportLoading,
        error,
        totalCount,
        loadData,
        handleLoadMore,
        getWeekRange,
        handleExport
    };
};
