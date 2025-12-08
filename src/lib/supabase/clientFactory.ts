import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { validateEnvVars, handleMissingEnvVars } from './envValidator';

let supabaseInstance: SupabaseClient | null = null;

const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-development-build';

export function getSupabaseClient(): SupabaseClient {
    const { runtimeUrl, runtimeKey, hasValidVars } = validateEnvVars();

    if (hasValidVars && runtimeUrl && runtimeKey) {
        if (!supabaseInstance) {
            if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
                const { safeLog } = require('@/lib/errorHandler');
                safeLog.info('[Supabase Client] Criando nova instância com variáveis válidas');
            }
            return createNewClient(runtimeUrl, runtimeKey);
        }

        const currentUrl = (supabaseInstance as any).supabaseUrl;
        if (currentUrl === 'https://placeholder.supabase.co') {
            if (typeof window !== 'undefined') {
                const { safeLog } = require('@/lib/errorHandler');
                safeLog.warn('[Supabase Client] ⚠️ Instância mock detectada, recriando com variáveis reais...');
            }
            return createNewClient(runtimeUrl, runtimeKey);
        }
        return supabaseInstance;
    }

    if (isBuildTime) {
        if (!supabaseInstance) {
            supabaseInstance = createClient('https://placeholder.supabase.co', 'dummy-key', {
                auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
            });
        }
        return supabaseInstance;
    }

    return handleMissingEnvVars(supabaseInstance);
}

function createNewClient(url: string, key: string) {
    supabaseInstance = createClient(url, key, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: typeof window !== 'undefined' ? window.localStorage : undefined,
            storageKey: 'supabase.auth.token',
            flowType: 'pkce'
        }
    });
    return supabaseInstance;
}

export function recreateSupabaseClient() {
    supabaseInstance = null;
    return getSupabaseClient();
}
