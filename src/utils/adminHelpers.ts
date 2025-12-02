import { supabase } from '@/lib/supabaseClient';
import { safeRpc } from '@/lib/rpcWrapper';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

export interface RpcResult<T = any> {
    data: T | null;
    error: any;
}

export async function executeAdminRpc<T = any>(
    rpcName: string,
    params: any,
    fallbackUpdate?: () => Promise<{ error: any }>
): Promise<RpcResult<T>> {
    let result: any;
    let error: any;

    try {
        // Tenta chamada direta primeiro
        const directResult = await supabase.rpc(rpcName, params);
        result = directResult.data;
        error = directResult.error;
    } catch (rpcErr) {
        // Se falhar, tenta safeRpc
        const safeResult = await safeRpc(rpcName, params, {
            timeout: 30000,
            validateParams: false
        });
        result = safeResult.data;
        error = safeResult.error;
    }

    if (error && fallbackUpdate) {
        const errorCode = (error as any)?.code;
        const errorMessage = String((error as any)?.message || '');
        const is404 = errorCode === 'PGRST116' ||
            errorCode === '42883' ||
            errorMessage.includes('404') ||
            errorMessage.includes('not found') ||
            (errorMessage.includes('function') && errorMessage.includes('does not exist'));

        if (is404) {
            if (IS_DEV) {
                safeLog.warn(`Função RPC ${rpcName} não encontrada, tentando atualização direta via Supabase`);
            }
            const { error: updateError } = await fallbackUpdate();
            if (updateError) throw updateError;
            return { data: null, error: null }; // Sucesso no fallback
        }
    }

    return { data: result, error };
}
