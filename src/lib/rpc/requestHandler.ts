import { supabase } from '@/lib/supabaseClient';
import { RpcResult, RpcError } from '@/types/rpc';
import { sanitizeError } from '@/lib/rpcUtils';

export async function executeRpcRequest<T>(
    functionName: string,
    params: any,
    timeout: number
): Promise<RpcResult<T>> {
    let rpcPromise: Promise<any>;
    try {
        rpcPromise = params === undefined
            ? (supabase.rpc as any)(functionName)
            : supabase.rpc(functionName, params);

        if (!rpcPromise || typeof rpcPromise.then !== 'function') {
            return { data: null, error: { message: 'Erro criação RPC', code: 'RPC_CREATION_ERROR' } };
        }
    } catch (e: any) {
        return { data: null, error: { message: 'Erro init RPC', code: 'RPC_INIT_ERROR', details: e?.message } };
    }

    let timeoutId: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<RpcResult<null>>((resolve) => {
        timeoutId = setTimeout(() => resolve({
            data: null,
            error: { message: 'Timeout na requisição', code: 'TIMEOUT' }
        }), timeout);
    });

    try {
        const result = await Promise.race([rpcPromise, timeoutPromise]);
        if (timeoutId) clearTimeout(timeoutId);

        if (result.error) {
            const code = (result.error as RpcError)?.code;
            const msg = String((result.error as RpcError)?.message || '');
            const isIgnorable = ['PGRST116', '42883', 'PGRST204', '404', 'not found'].some(t => code === t || msg.includes(t));

            if (isIgnorable) result.error = { code: code || '400', message: 'Requisição inválida' };
            else result.error = sanitizeError(result.error);
        }
        return result;
    } catch (err) {
        if (timeoutId) clearTimeout(timeoutId);
        return { data: null, error: sanitizeError(err) };
    }
}
