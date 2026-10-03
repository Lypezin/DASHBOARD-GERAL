
import { useState, useCallback, useEffect, useRef } from 'react';
import { getDateRangeFromWeek } from '@/utils/formatters/dateUtils';
import { safeLog } from '@/lib/errorHandler';
import { EntregadorMarketing } from '@/types';
import { useMarketingExcelExport } from './hooks/useMarketingExcelExport';
import { createRequestKey } from '@/utils/request/createRequestKey';
import { createAccessScopeKey } from '@/utils/request/createAccessScopeKey';
import { useAppBootstrap } from '@/contexts/AppBootstrapContext';

const LIMIT = 50;

interface UseMarketingDriverDetailsProps { isOpen: boolean; semanaIso: string; organizationId: string | null; praca?: string | null; activeTab: 'marketing' | 'operacional'; }

export const useMarketingDriverDetails = ({ isOpen, semanaIso, organizationId, praca, activeTab }: UseMarketingDriverDetailsProps) => {
    const { currentUser } = useAppBootstrap();
    const [data, setData] = useState<EntregadorMarketing[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [resolvedScopeKey, setResolvedScopeKey] = useState<string | null>(null);
    const [dataScopeKey, setDataScopeKey] = useState<string | null>(null);
    const requestIdRef = useRef(0);
    const accessScopeKey = createAccessScopeKey(currentUser, organizationId);
    const currentScopeKey = createRequestKey({ organizationId, accessScopeKey, semanaIso, praca: praca || null, activeTab });

    const { exportLoading, handleExport } = useMarketingExcelExport({ semanaIso, organizationId, activeTab, praca });

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

        const requestId = ++requestIdRef.current;
        const scopeKey = currentScopeKey;
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

            if (requestId !== requestIdRef.current) return;

            if (isReset) {
                setData(result.data);
                setTotalCount(result.totalCount);
            } else {
                setData(prev => [...prev, ...result.data]);
            }
            setDataScopeKey(scopeKey);
            setResolvedScopeKey(scopeKey);

        } catch (err: unknown) {
            if (requestId !== requestIdRef.current) return;
            safeLog.error("Error fetching details:", err);
            setError(err instanceof Error ? err.message : 'Erro ao carregar detalhes.');
            setResolvedScopeKey(scopeKey);
        } finally {
            if (requestId === requestIdRef.current) setLoading(false);
        }
    }, [activeTab, currentScopeKey, getWeekRange, isOpen, organizationId, praca, semanaIso]);

    useEffect(() => {
        setPage(0);
        if (isOpen && semanaIso) {
            void loadData(0, true);
        } else {
            requestIdRef.current += 1;
            setLoading(false);
        }
    }, [activeTab, isOpen, loadData, semanaIso]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadData(nextPage, false);
    };

    const hasCurrentScopeData = dataScopeKey === currentScopeKey;
    return {
        data: hasCurrentScopeData ? data : [],
        loading: loading || Boolean(isOpen && semanaIso && resolvedScopeKey !== currentScopeKey),
        exportLoading,
        error: resolvedScopeKey === currentScopeKey ? error : null,
        totalCount: hasCurrentScopeData ? totalCount : 0,
        loadData,
        handleLoadMore,
        getWeekRange,
        handleExport,
    };
};
