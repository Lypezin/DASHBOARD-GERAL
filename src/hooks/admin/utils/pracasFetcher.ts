import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { adminRpc } from '@/services/adminRpcClient';
import { IS_DEV } from '@/constants/environment';
import { readJsonStorage, removeJsonStorage, writeJsonStorage } from '@/utils/storage/jsonStorage';

const CACHE_KEY = 'admin_pracas_cache_v3';
const CACHE_TTL_MS = 5 * 60 * 1000;

interface PracasCacheEntry {
    timestamp: number;
    pracas: unknown;
}

function normalizePracas(raw: unknown): string[] {
    const rows = Array.isArray(raw) ? raw : [];
    const pracas = rows
        .map((item: any) => {
            if (typeof item === 'string') return item;
            if (typeof item?.praca === 'string') return item.praca;
            return '';
        })
        .map((praca) => praca.trim())
        .filter(Boolean);

    return Array.from(new Set(pracas)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function savePracasCache(pracas: string[]) {
    writeJsonStorage(typeof window !== 'undefined' ? sessionStorage : undefined, CACHE_KEY, {
        timestamp: Date.now(),
        pracas,
    });
}

function clearLegacyPracasCache() {
    const storage = typeof window !== 'undefined' ? sessionStorage : undefined;
    removeJsonStorage(storage, 'admin_pracas_cache');
    removeJsonStorage(storage, 'admin_pracas_cache_time');
    removeJsonStorage(storage, 'admin_pracas_cache_v2');
    removeJsonStorage(storage, 'admin_pracas_cache_v2_time');
}

export async function fetchPracasWithFallback(): Promise<string[]> {
    clearLegacyPracasCache();

    const cached = readJsonStorage<PracasCacheEntry | null>(
        typeof window !== 'undefined' ? sessionStorage : undefined,
        CACHE_KEY,
        null
    );

    if (cached && Array.isArray(cached.pracas) && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        const parsedCache = normalizePracas(cached.pracas);
        return parsedCache;
    }

    let lastError: unknown = null;

    try {
        const result = await adminRpc<Array<string | { praca?: string }>>('list_pracas_disponiveis');

        if (!result.error && Array.isArray(result.data)) {
            const pracas = normalizePracas(result.data);
            savePracasCache(pracas);
            return pracas;
        }
        lastError = result.error || new Error('A API administrativa retornou uma lista de praças inválida.');
    } catch (err) {
        lastError = err;
        if (IS_DEV) safeLog.warn('API administrativa de pracas falhou, tentando RPC direta:', err);
    }

    try {
        const result = await safeRpc<Array<string | { praca?: string }>>('list_pracas_disponiveis', {}, {
            timeout: 30000,
            validateParams: false
        });

        if (!result.error && Array.isArray(result.data)) {
            const pracas = normalizePracas(result.data);
            savePracasCache(pracas);
            return pracas;
        }
        lastError = result.error || new Error('A RPC de praças retornou uma resposta inválida.');
    } catch (err) {
        lastError = err;
        if (IS_DEV) safeLog.warn('Função list_pracas_disponiveis falhou, tentando fallback:', err);
    }

    if (IS_DEV) safeLog.error('Todas as fontes completas da lista de praças falharam:', lastError);
    throw new Error('Não foi possível carregar a lista completa de praças. Tente novamente.');
}
