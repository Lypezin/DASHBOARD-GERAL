import { useEffect } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { DELAYS } from '@/constants/config';
import { IS_DEV } from '@/constants/environment';
import { updateDashboardState } from './utils/updateDashboardState';
import type { FilterPayload } from '@/types/filters';
import type {
    Totals, AderenciaSemanal, AderenciaDia, AderenciaTurno,
    AderenciaSubPraca, AderenciaOrigem, AderenciaDiaOrigem, DimensoesDashboard
} from '@/types';


interface UseDashboardDataEffectProps {
    filterPayload: FilterPayload;
    fetchDashboardData: (payload: FilterPayload) => Promise<any>;
    checkCache: (key: string) => any;
    updateCache: (key: string, data: any) => void;
    clearCache: () => void;
    previousPayloadRef: React.MutableRefObject<string>;
    isFirstExecutionRef: React.MutableRefObject<boolean>;
    pendingPayloadKeyRef: React.MutableRefObject<string>;
    setDataOrganizationId: (organizationId: string | null) => void;
    setDataScopeKey: (scopeKey: string) => void;
    accessScopeKey: string;
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
    setResolvedPayloadKey: (key: string) => void;
    retryNonce: number;
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
    setDataOrganizationId,
    setDataScopeKey,
    accessScopeKey,
    setters,
    setResolvedPayloadKey,
    retryNonce,
    shouldFetch = true
}: UseDashboardDataEffectProps, payloadKey: string) {
    useEffect(() => {
        if (!shouldFetch) {
            pendingPayloadKeyRef.current = '';
            return;
        }

        if (previousPayloadRef.current === payloadKey) {
            setDataOrganizationId(typeof filterPayload.p_organization_id === 'string'
                ? filterPayload.p_organization_id.trim()
                : null);
            setResolvedPayloadKey(payloadKey);
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
        let cancelled = false;

        const cachedData = checkCache(payloadKey);
        if (cachedData) {
            updateDashboardState(cachedData, setters, false);
            setDataOrganizationId(typeof filterPayload.p_organization_id === 'string'
                ? filterPayload.p_organization_id.trim()
                : null);
            setDataScopeKey(accessScopeKey);
            previousPayloadRef.current = payloadKey;
            isFirstExecutionRef.current = false;
            pendingPayloadKeyRef.current = '';
            setResolvedPayloadKey(payloadKey);
            return;
        }

        const currentPayloadKey = payloadKey;
        const runFetch = async () => {
            if (cancelled || pendingPayloadKeyRef.current !== currentPayloadKey) return;

            const isFirstExecution = isFirstExecutionRef.current;
            const hasValidFiltersForFetch = (filterPayload.p_ano !== null && filterPayload.p_ano !== undefined)
                || (filterPayload.p_data_inicial !== null && filterPayload.p_data_inicial !== undefined);

            if (IS_DEV) safeLog.info('[useDashboardDataEffect] Iniciando fetch com payload valido:', filterPayload);

            const data = await fetchDashboardData(filterPayload);

            // A newer filter request may have started while this one was in
            // flight. Do not let its late response overwrite the active view.
            if (cancelled || pendingPayloadKeyRef.current !== currentPayloadKey) return;

            if (data) {
                const cacheKeyToUse = isFirstExecution && !hasValidFiltersForFetch
                    ? '__first_execution_dimensions__'
                    : currentPayloadKey;
                updateCache(cacheKeyToUse, data);
                updateDashboardState(data, setters, false);
                setDataOrganizationId(typeof filterPayload.p_organization_id === 'string'
                    ? filterPayload.p_organization_id.trim()
                    : null);
                setDataScopeKey(accessScopeKey);
                previousPayloadRef.current = currentPayloadKey;
                isFirstExecutionRef.current = false;
                pendingPayloadKeyRef.current = '';
                setResolvedPayloadKey(currentPayloadKey);
            } else {
                if (IS_DEV) safeLog.warn('[useDashboardDataEffect] Fetch falhou; mantendo o estado visível e exibindo o erro');
                isFirstExecutionRef.current = false;
                pendingPayloadKeyRef.current = '';
                setResolvedPayloadKey(currentPayloadKey);
            }
        };

        if (isFirstExecutionRef.current) {
            void runFetch();
            return () => {
                cancelled = true;
                if (pendingPayloadKeyRef.current === currentPayloadKey) pendingPayloadKeyRef.current = '';
            };
        }

        const timeoutId = setTimeout(() => {
            void runFetch();
        }, DELAYS.DEBOUNCE);

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
            if (pendingPayloadKeyRef.current === currentPayloadKey) pendingPayloadKeyRef.current = '';
        };
    }, [
        payloadKey,
        fetchDashboardData,
        checkCache,
        clearCache,
        filterPayload,
        isFirstExecutionRef,
        pendingPayloadKeyRef,
        setDataOrganizationId,
        setDataScopeKey,
        accessScopeKey,
        previousPayloadRef,
        setters,
        shouldFetch,
        setResolvedPayloadKey,
        retryNonce,
        updateCache
    ]);
}
