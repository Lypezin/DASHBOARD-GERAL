import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';

export function checkMockClient(functionName: string) {
    try {
        const clientUrl = (supabase as any).supabaseUrl;
        if (clientUrl === 'https://placeholder.supabase.co' && typeof window !== 'undefined') {
            const recreateFn = (supabase as any)._recreate;
            if (recreateFn && typeof recreateFn === 'function') {
                recreateFn();
            }
            safeLog.error(
                `[safeRpc] ⚠️ Mock client detected! env vars missing. ` +
                `Func: ${functionName}. ` +
                `NEXT_PUBLIC_ vars are build-time injected.`
            );
        }
    } catch (e) { /* ignore */ }
}

export function isClientReady(): boolean {
    if (!supabase.rpc || typeof supabase.rpc !== 'function') {
        return false;
    }
    return true;
}
