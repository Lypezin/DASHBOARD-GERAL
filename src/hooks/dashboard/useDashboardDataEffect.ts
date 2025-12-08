import { useEffect, useRef } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { DELAYS } from '@/constants/config';
import { transformDashboardData, createEmptyDashboardData } from '@/utils/dashboard/transformers';
import type { FilterPayload } from '@/types/filters';
import type {
    Totals, AderenciaSemanal, AderenciaDia, AderenciaTurno,
    AderenciaSubPraca, AderenciaOrigem, DimensoesDashboard
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
        setDimensoes: (data: DimensoesDashboard | null) => void;
    }
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
    setters
}: UseDashboardDataEffectProps, payloadKey: string) {

    const {
        setTotals, setAderenciaSemanal, setAderenciaDia,
        setAderenciaTurno, setAderenciaSubPraca, setAderenciaOrigem, setDimensoes
    } = setters;

    useEffect(() => {
        // Evitar processamento se o payload não mudou realmente
        if (previousPayloadRef.current === payloadKey) {
            if (IS_DEV) safeLog.info('[useDashboardDataEffect] Payload não mudou, ignorando');
            return;
        }

        if (true) { // IS_DEV override for debugging
            safeLog.info('[useDashboardDataEffect] useEffect acionado com payload:', {
                payloadKey,
                previousPayload: previousPayloadRef.current,
            });
        }

        const hasValidFilters = (filterPayload.p_ano !== null && filterPayload.p_ano !== undefined) ||
            (filterPayload.p_data_inicial !== null && filterPayload.p_data_inicial !== undefined);

        // Se o payload anterior era inválido e agora é válido, limpar cache
        const previousPayloadWasInvalid = previousPayloadRef.current &&
            (!previousPayloadRef.current.includes('"p_ano":') || previousPayloadRef.current.includes('"p_ano":null')) &&
            (!previousPayloadRef.current.includes('"p_data_inicial":') || previousPayloadRef.current.includes('"p_data_inicial":null'));

        if (previousPayloadWasInvalid && hasValidFilters) {
            clearCache();
        }

        pendingPayloadKeyRef.current = payloadKey;

        // Verificar cache
        const cachedData = checkCache(payloadKey);
        if (cachedData) {
            const processedData = transformDashboardData(cachedData);

            setTotals(processedData.totals);
            setAderenciaSemanal(processedData.aderencia_semanal);
            setAderenciaDia(processedData.aderencia_dia);
            setAderenciaTurno(processedData.aderencia_turno);
            setAderenciaSubPraca(processedData.aderencia_sub_praca);
            setAderenciaOrigem(processedData.aderencia_origem);

            if (processedData.dimensoes) setDimensoes(processedData.dimensoes);

            previousPayloadRef.current = payloadKey;
            isFirstExecutionRef.current = false;
            return;
        }

        const currentPayload = filterPayload;
        const currentPayloadKey = payloadKey;

        const timeoutId = setTimeout(async () => {
            if (JSON.stringify(currentPayload) !== currentPayloadKey) return;
            if (pendingPayloadKeyRef.current !== currentPayloadKey) return;

            const isFirstExecutionInTimeout = isFirstExecutionRef.current;
            const hasValidFiltersInTimeout = (currentPayload.p_ano !== null && currentPayload.p_ano !== undefined) ||
                (currentPayload.p_data_inicial !== null && currentPayload.p_data_inicial !== undefined);

            if (IS_DEV) safeLog.info('[useDashboardDataEffect] Iniciando fetch com payload válido:', currentPayload);

            console.log('[DEBUG] Calling fetchDashboardData with:', currentPayload);
            const data = await fetchDashboardData(currentPayload);
            console.log('[DEBUG] fetchDashboardData returned:', data ? 'Data Present' : 'Null/Empty', data);

            if (data) {
                const cacheKeyToUse = isFirstExecutionInTimeout && !hasValidFiltersInTimeout
                    ? '__first_execution_dimensions__'
                    : currentPayloadKey;

                updateCache(cacheKeyToUse, data);

                const processedData = transformDashboardData(data);

                setTotals(processedData.totals);
                setAderenciaSemanal(processedData.aderencia_semanal);
                setAderenciaDia(processedData.aderencia_dia);
                setAderenciaTurno(processedData.aderencia_turno);
                setAderenciaSubPraca(processedData.aderencia_sub_praca);
                setAderenciaOrigem(processedData.aderencia_origem);

                if (processedData.dimensoes) setDimensoes(processedData.dimensoes);

                previousPayloadRef.current = currentPayloadKey;
                isFirstExecutionRef.current = false;
                pendingPayloadKeyRef.current = '';
            } else {
                // Handle empty data
                const emptyData = createEmptyDashboardData();
                setTotals({ ofertadas: 0, aceitas: 0, rejeitadas: 0, completadas: 0 });
                setAderenciaSemanal([]);
                setAderenciaDia([]);
                setAderenciaTurno([]);
                setAderenciaSubPraca([]);
                setAderenciaOrigem([]);
                setDimensoes(emptyData.dimensoes);
                previousPayloadRef.current = currentPayloadKey;
                isFirstExecutionRef.current = false;
            }
        }, DELAYS.DEBOUNCE);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [payloadKey, fetchDashboardData]);
}
