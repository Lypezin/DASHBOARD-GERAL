import { useEffect, useState } from 'react';
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
    const { organization } = useOrganization();
    const [semanas, setSemanas] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;

        if (!ano) {
            setSemanas([]);
            return;
        }

        const fetchSemanasComDados = async () => {
            const cachedWeeks = getCachedAvailableWeeks(ano, organization?.id);
            if (cachedWeeks) {
                setSemanas(cachedWeeks);
                setLoading(false);
                return;
            }

            setLoading(true);

            try {
                const semanasOtimizadas = await fetchAvailableWeeks(ano, organization?.id);
                if (!cancelled) setSemanas(semanasOtimizadas);
            } catch (err) {
                if (IS_DEV) safeLog.error('Erro ao buscar semanas com dados:', err);
                if (!cancelled) setSemanas([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void fetchSemanasComDados();

        return () => {
            cancelled = true;
        };
    }, [ano, organization?.id]);

    return { semanasComDados: semanas, loadingSemanasComDados: loading };
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

        const semanasOtimizadas = Array.isArray(data)
            ? data
                .map((item: { semana_iso?: number }) => Number(item?.semana_iso))
                .filter((semana) => Number.isFinite(semana) && semana > 0)
            : [];

        weeksCache.set(cacheKey, {
            data: semanasOtimizadas,
            expiresAt: Date.now() + WEEKS_CACHE_TTL_MS,
        });

        return semanasOtimizadas;
    })().finally(() => {
        weeksRequests.delete(cacheKey);
    });

    weeksRequests.set(cacheKey, request);
    return request;
}
