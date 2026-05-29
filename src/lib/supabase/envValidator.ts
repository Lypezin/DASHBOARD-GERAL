import { SupabaseClient } from '@supabase/supabase-js';

export function validateEnvVars() {
    const runtimeUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const runtimeKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const hasValidVars = runtimeUrl && runtimeKey &&
        runtimeUrl !== 'https://placeholder.supabase.co' &&
        runtimeUrl.includes('.supabase.co') &&
        runtimeKey.length > 20;

    if (typeof window !== 'undefined' && (process.env.NODE_ENV === 'development' || !runtimeUrl || runtimeUrl.includes('placeholder'))) {
        const { safeLog } = require('@/lib/errorHandler');
        safeLog.info('[Supabase Client] Verificando variáveis:', {
            hasUrl: !!runtimeUrl,
            hasKey: !!runtimeKey,
            url: runtimeUrl?.substring(0, 30) + '...',
            isPlaceholder: runtimeUrl?.includes('placeholder')
        });
    }

    return { runtimeUrl, runtimeKey, hasValidVars };
}

export function handleMissingEnvVars(supabaseInstance: SupabaseClient | null) {
    if (supabaseInstance && typeof window !== 'undefined') {
        const currentUrl = (supabaseInstance as any).supabaseUrl;
        if (currentUrl === 'https://placeholder.supabase.co') {
            const { safeLog } = require('@/lib/errorHandler');
            safeLog.error(
                '[Supabase Client] ⚠️ Variáveis de ambiente não encontradas em runtime!\n' +
                'Verifique se NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão configuradas no Vercel.\n' +
                'Após configurar, faça um novo deploy (não apenas redeploy, mas um novo build).'
            );
            return supabaseInstance;
        }
    }

    throw new Error(
        'As variáveis de ambiente do Supabase não estão configuradas corretamente. ' +
        'Verifique se NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão configuradas no Vercel.'
    );
}
