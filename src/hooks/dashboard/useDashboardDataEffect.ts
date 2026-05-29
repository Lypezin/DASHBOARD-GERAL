import { useEffect } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { DELAYS } from '@/constants/config';
import { createEmptyDashboardData } from '@/utils/dashboard/transformers';
import { updateDashboardState, clearDashboardState } from './utils/updateDashboardState';
import type { FilterPayload } from '@/types/filters';
import type {
    Totals, AderenciaSemanal, AderenciaDia, AderenciaTurno,
    AderenciaSubPraca, AderenciaOrigem, AderenciaDiaOrigem, DimensoesDashboard
} from '@/types';

const IS_DEV = process.env.NODE_ENV === 'development';

interface UseDashboardDataEffectProps {
    filterPayload: FilterPayload;
    fetchDashboardData: (payload: FilterPayload) => Promise<any>;
    checkCache: (key: string) => any;
    updateCache: (key: string, data: any) => void;
    clearCache: () => void;
    previousPayloadRef: React.MutableRefObject<string>;
    isFirstExecutionRef: React.MutableRefObject<boolean>;
    pendingPayloadKeyRef: React.MutableRefObject<string>;
    setters: {
        setTotals: (data: Totals | null) => void;
        setAderenciaSemanal: (data: AderenciaSemanal[]) => void;
        setAderenciaDia: (data: AderenciaDia[]) => void;
        setAderenciaTurno: (data: AderenciaTurno[]) => void;
        setAderenciaSubPraca: (data: AderenciaSubPraca[]) => void;
        setAderenciaOrigem: (data: AderenciaOrigem[]) => void;
        setAderenciaDiaOrigem: (data: AderenciaDiaOrigem[]) => void;
        setDimensoes: (data: DimensoesDashboard | null) => void;
    };
    shouldFetch?: boolean;
}

export function useDashboardDataEffect({
    filterPayload,
    fetchDashboardData,
    checkCache,
    updateCache,
    clearCache,
    previousPayloadRef,
    isFirstExecutionRef,
    pendingPayloadKeyRef,
    setters,
    shouldFetch = true
}: UseDashboardDataEffectProps, payloadKey: string) {
    useEffect(() => {
        if (!shouldFetch) return;

        if (previousPayloadRef.current === payloadKey) {
            if (IS_DEV) safeLog.info('[useDashboardDataEffect] Payload nao mudou, ignorando');
            return;
        }

        if (IS_DEV) {
            safeLog.info('[useDashboardDataEffect] useEffect acionado com payload:', {
                payloadKey,
                previousPayload: previousPayloadRef.current,
            });
        }

        const hasValidFilters = (filterPayload.p_ano != null) || (filterPayload.p_data_inicial != null);
        const previousPayloadWasInvalid = previousPayloadRef.current
            && (!previousPayloadRef.current.includes('"p_ano":') || previousPayloadRef.current.includes('"p_ano":null'))
            && (!previousPayloadRef.current.includes('"p_data_inicial":') || previousPayloadRef.current.includes('"p_data_inicial":null'));

        if (previousPayloadWasInvalid && hasValidFilters) {
            clearCache();
        }

        pendingPayloadKeyRef.current = payloadKey;

        const cachedData = checkCache(payloadKey);
        if (cachedData) {
            updateDashboardState(cachedData, setters, false);
            previousPayloadRef.current = payloadKey;
            isFirstExecutionRef.current = false;
            return;
        }

        const currentPayloadKey = payloadKey;
        const runFetch = async () => {
            if (pendingPayloadKeyRef.current !== currentPayloadKey) return;

            const isFirstExecution = isFirstExecutionRef.current;
            const hasValidFiltersForFetch = (filterPayload.p_ano !== null && filterPayload.p_ano !== undefined)
                || (filterPayload.p_data_inicial !== null && filterPayload.p_data_inicial !== undefined);

            if (IS_DEV) safeLog.info('[useDashboardDataEffect] Iniciando fetch com payload valido:', filterPayload);

            const data = await fetchDashboardData(filterPayload);

            if (data) {
                const cacheKeyToUse = isFirstExecution && !hasValidFiltersForFetch
                    ? '__first_execution_dimensions__'
                    : currentPayloadKey;
                updateCache(cacheKeyToUse, data);
                updateDashboardState(data, setters, false);
                previousPayloadRef.current = currentPayloadKey;
                isFirstExecutionRef.current = false;
                pendingPayloadKeyRef.current = '';
            } else {
                if (isFirstExecution) {
                    clearDashboardState(setters, createEmptyDashboardData());
                } else if (IS_DEV) {
                    safeLog.warn('[useDashboardDataEffect] Fetch falhou; mantendo ultimo estado valido do dashboard');
                }
                isFirstExecutionRef.current = false;
                pendingPayloadKeyRef.current = '';
            }
        };

        if (isFirstExecutionRef.current) {
            void runFetch();
            return;
        }

        const timeoutId = setTimeout(() => {
            void runFetch();
        }, DELAYS.DEBOUNCE);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [
        payloadKey,
        fetchDashboardData,
        checkCache,
        clearCache,
        filterPayload,
        isFirstExecutionRef,
        pendingPayloadKeyRef,
        previousPayloadRef,
        setters,
        shouldFetch,
        updateCache
    ]);
}
