import { RpcParams } from '@/types/rpc';
import { validateFilterPayload } from '@/lib/validate';
import { safeLog } from '@/lib/errorHandler';
import { sanitizeParams } from '@/lib/rpcUtils';

const IS_DEV = process.env.NODE_ENV === 'development';

export function normalizeParams(params: RpcParams = {}): RpcParams | undefined {
    if (params && typeof params === 'object' && !Array.isArray(params)) {
        const normalizedParams: RpcParams = {};
        for (const [key, value] of Object.entries(params)) {
            normalizedParams[key] = value === undefined ? null : value;
        }
        return normalizedParams;
    } else if (params === null || params === undefined || (typeof params === 'object' && Object.keys(params).length === 0)) {
        return undefined;
    }
    return params;
}

export function validateAndSanitize(params: RpcParams | undefined, functionName: string, shouldValidate: boolean): RpcParams | undefined {
    if (!shouldValidate || !params || typeof params !== 'object') return params;

    try {
        return validateFilterPayload(params) as RpcParams;
    } catch (err) {
        if (IS_DEV) safeLog.warn(`Validation failed for ${functionName}:`, err);
        return sanitizeParams(params);
    }
}
