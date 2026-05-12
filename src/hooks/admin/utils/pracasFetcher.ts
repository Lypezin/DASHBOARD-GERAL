import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { adminRpc } from '@/services/adminRpcClient';

const IS_DEV = process.env.NODE_ENV === 'development';
const CACHE_KEY = 'admin_pracas_cache_v2';
const CACHE_TIME_KEY = 'admin_pracas_cache_v2_time';
const CACHE_TTL_MS = 5 * 60 * 1000;
const MIN_COMPLETE_PRACAS = 4;

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
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(pracas));
    sessionStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
}

function clearLegacyPracasCache() {
    sessionStorage.removeItem('admin_pracas_cache');
    sessionStorage.removeItem('admin_pracas_cache_time');
}

export async function fetchPracasWithFallback(): Promise<string[]> {
    clearLegacyPracasCache();

    const cachedPracas = sessionStorage.getItem(CACHE_KEY);
    const cacheTime = sessionStorage.getItem(CACHE_TIME_KEY);

    if (cachedPracas && cacheTime) {
        const now = Date.now();
        const cached = parseInt(cacheTime);
        const parsedCache = (() => {
            try {
                return normalizePracas(JSON.parse(cachedPracas));
            } catch {
                sessionStorage.removeItem(CACHE_KEY);
                sessionStorage.removeItem(CACHE_TIME_KEY);
                return [];
            }
        })();

        if (now - cached < CACHE_TTL_MS && parsedCache.length >= MIN_COMPLETE_PRACAS) {
            return parsedCache;
        }
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
