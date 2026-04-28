import { adminRpc } from '@/services/adminRpcClient';

export interface RpcResult<T = any> {
    data: T | null;
    error: any;
}

export async function executeAdminRpc<T = any>(
    rpcName: string,
    params: any,
    _fallbackUpdate?: () => Promise<{ error: any }>
): Promise<RpcResult<T>> {
    return adminRpc<T>(rpcName, params);
}
