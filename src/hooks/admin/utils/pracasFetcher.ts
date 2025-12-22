import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';

const IS_DEV = process.env.NODE_ENV === 'development';

export async function fetchPracasWithFallback(): Promise<string[]> {
    const cachedPracas = sessionStorage.getItem('admin_pracas_cache');
    const cacheTime = sessionStorage.getItem('admin_pracas_cache_time');

    if (cachedPracas && cacheTime) {
        const now = Date.now();
        const cached = parseInt(cacheTime);
        if (now - cached < 5 * 60 * 1000) {
            return JSON.parse(cachedPracas);
        }
    }

    try {
        const { data: pracasData, error: pracasError } = await safeRpc<string[]>('list_pracas_disponiveis', {}, {
            timeout: 30000,
            validateParams: false
        });

        if (!pracasError && pracasData && pracasData.length > 0) {
            const pracas = pracasData.map((p: any) => p.praca).filter(Boolean);
            sessionStorage.setItem('admin_pracas_cache', JSON.stringify(pracas));
            sessionStorage.setItem('admin_pracas_cache_time', Date.now().toString());
            return pracas;
        }
    } catch (err) {
        if (IS_DEV) safeLog.warn('Função list_pracas_disponiveis falhou, tentando fallback:', err);
    }

    try {
        const { data: mvPracas, error: mvError } = await supabase
            .from('mv_aderencia_agregada')
            .select('praca')
            .not('praca', 'is', null)
            .order('praca');

        if (!mvError && mvPracas && mvPracas.length > 0) {
            const uniquePracas = [...new Set(mvPracas.map(p => p.praca))].filter(Boolean);
            sessionStorage.setItem('admin_pracas_cache', JSON.stringify(uniquePracas));
            sessionStorage.setItem('admin_pracas_cache_time', Date.now().toString());
            return uniquePracas;
        }
    } catch (err) {
        if (IS_DEV) safeLog.warn('Fallback MV falhou, tentando dados_corridas:', err);
    }

    try {
        const { data: fallbackPracas, error: fallbackError } = await supabase
            .from('dados_corridas')
            .select('praca')
            .not('praca', 'is', null)
            .order('praca')
            .limit(500);

        if (!fallbackError && fallbackPracas) {
            const uniquePracas = [...new Set(fallbackPracas.map(p => p.praca))].filter(Boolean);
            sessionStorage.setItem('admin_pracas_cache', JSON.stringify(uniquePracas));
            sessionStorage.setItem('admin_pracas_cache_time', Date.now().toString());
            return uniquePracas;
        }
    } catch (err) {
        if (IS_DEV) safeLog.error('Todos os métodos de busca de praças falharam:', err);
    }

    return [];
}
