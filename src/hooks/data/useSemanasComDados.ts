import { useCallback, useEffect, useState } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { useOrganization } from '@/contexts/OrganizationContext';
import { safeRpc } from '@/lib/rpcWrapper';
import { IS_DEV } from '@/constants/environment';

const WEEKS_CACHE_TTL_MS = 5 * 60 * 1000;

const weeksCache = new Map<string, { data: number[]; expiresAt: number }>();
const weeksRequests = new Map<string, Promise<number[]>>();

/**
 * Busca as semanas com dados para o ano/organizacao ativos.
 * O cache curto evita repetir a mesma RPC ao remontar filtros ou alternar abas.
 */
export function useSemanasComDados(ano: number | null) {
    const { organization, isLoading: isOrganizationLoading } = useOrganization();
    const [semanas, setSemanas] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resolvedRequestKey, setResolvedRequestKey] = useState<string | null>(null);
    const [dataRequestKey, setDataRequestKey] = useState<string | null>(null);
    const [retryNonce, setRetryNonce] = useState(0);
    const requestKey = ano ? `${organization?.id || 'no-org'}:${ano}` : null;

    useEffect(() => {
        let cancelled = false;

        if (isOrganizationLoading) return;

        if (!ano) {
            setSemanas([]);
            setResolvedRequestKey(null);
            setDataRequestKey(null);
            setLoading(false);
            setError(null);
            return;
        }

        const fetchSemanasComDados = async () => {
            const cachedWeeks = getCachedAvailableWeeks(ano, organization?.id);
            if (cachedWeeks) {
                setSemanas(cachedWeeks);
                setResolvedRequestKey(requestKey);
                setDataRequestKey(requestKey);
                setLoading(false);
                setError(null);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const semanasOtimizadas = await fetchAvailableWeeks(ano, organization?.id);
                if (!cancelled) {
                    setSemanas(semanasOtimizadas);
                    setResolvedRequestKey(requestKey);
                    setDataRequestKey(requestKey);
                }
            } catch (err) {
                if (IS_DEV) safeLog.error('Erro ao buscar semanas com dados:', err);
                if (!cancelled) {
                    setSemanas([]);
                    setResolvedRequestKey(requestKey);
                    setDataRequestKey(requestKey);
                    setError('Não foi possível carregar as semanas disponíveis.');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void fetchSemanasComDados();

        return () => {
            cancelled = true;
        };
    }, [ano, isOrganizationLoading, organization?.id, requestKey, retryNonce]);

    const retry = useCallback(() => setRetryNonce((current) => current + 1), []);

    return {
        semanasComDados: dataRequestKey === requestKey ? semanas : [],
        loadingSemanasComDados: loading || isOrganizationLoading || Boolean(ano && resolvedRequestKey !== requestKey),
        error: resolvedRequestKey === requestKey ? error : null,
        retry,
    };
}

function getCachedAvailableWeeks(ano: number, organizationId?: string | null) {
    const cacheKey = `${organizationId || 'no-org'}:${ano}`;
    const cached = weeksCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
    }

    return null;
}
async function fetchAvailableWeeks(ano: number, organizationId?: string | null) {
    const cacheKey = `${organizationId || 'no-org'}:${ano}`;
    const cached = weeksCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
    }

    const activeRequest = weeksRequests.get(cacheKey);
    if (activeRequest) return activeRequest;

    const request = (async () => {
        const { data, error } = await safeRpc<{ semana_iso?: number }[]>('get_available_weeks', {
            p_ano_iso: ano,
            p_organization_id: organizationId,
        }, { validateParams: false });

        if (error) {
            throw error;
        }
        if (!Array.isArray(data)) {
            throw new Error('A consulta de semanas respondeu em um formato inválido.');
        }

        const semanasOtimizadas = data.map((item: unknown) => {
            if (!item || typeof item !== 'object' || Array.isArray(item)) {
                throw new Error('A consulta de semanas respondeu em um formato inválido.');
            }

            const week = Number((item as { semana_iso?: unknown }).semana_iso);
            if (!Number.isInteger(week) || week < 1 || week > 53) {
                throw new Error('A consulta de semanas respondeu em um formato inválido.');
            }

            return week;
        });

        const uniqueWeeks = Array.from(new Set(semanasOtimizadas)).sort((a, b) => a - b);

        weeksCache.set(cacheKey, {
            data: uniqueWeeks,
            expiresAt: Date.now() + WEEKS_CACHE_TTL_MS,
        });

        return uniqueWeeks;
    })().finally(() => {
        weeksRequests.delete(cacheKey);
    });

    weeksRequests.set(cacheKey, request);
    return request;
}
