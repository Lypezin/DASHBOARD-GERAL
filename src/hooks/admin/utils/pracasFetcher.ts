import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { adminRpc } from '@/services/adminRpcClient';
import { IS_DEV } from '@/constants/environment';
import { readJsonStorage, removeJsonStorage, writeJsonStorage } from '@/utils/storage/jsonStorage';

const CACHE_KEY = 'admin_pracas_cache_v3';
const CACHE_TTL_MS = 5 * 60 * 1000;
const MIN_COMPLETE_PRACAS = 4;

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

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        const parsedCache = normalizePracas(cached.pracas);
        if (parsedCache.length >= MIN_COMPLETE_PRACAS) return parsedCache;
    }

    try {
        const { data, error } = await adminRpc<Array<string | { praca?: string }>>('list_pracas_disponiveis');
        const pracas = normalizePracas(data);

        if (!error && pracas.length > 0) {
            savePracasCache(pracas);
            return pracas;
        }
    } catch (err) {
        if (IS_DEV) safeLog.warn('API administrativa de pracas falhou, tentando RPC direta:', err);
    }

    try {
        const { data: pracasData, error: pracasError } = await safeRpc<Array<string | { praca?: string }>>('list_pracas_disponiveis', {}, {
            timeout: 30000,
            validateParams: false
        });
        const pracas = normalizePracas(pracasData);

        if (!pracasError && pracas.length > 0) {
            savePracasCache(pracas);
            return pracas;
        }
    } catch (err) {
        if (IS_DEV) safeLog.warn('Função list_pracas_disponiveis falhou, tentando fallback:', err);
    }

    try {
        const { data: fallbackPracas, error: fallbackError } = await supabase
            .from('dados_corridas')
            .select('praca')
            .not('praca', 'is', null)
            .order('praca')
            .limit(500);

        if (!fallbackError && fallbackPracas) {
            const uniquePracas = normalizePracas(fallbackPracas);
            if (uniquePracas.length >= MIN_COMPLETE_PRACAS) {
                savePracasCache(uniquePracas);
            }
            return uniquePracas;
        }
    } catch (err) {
        if (IS_DEV) safeLog.error('Todos os métodos de busca de praças falharam:', err);
    }

    return [];
}
