import { RpcParams, RpcResult, RpcOptions } from '@/types/rpc';
import { RPC_TIMEOUTS } from '@/constants/config';
import { rpcRateLimiter } from './rateLimiter';
import { checkMockClient, isClientReady } from '@/lib/rpc/clientChecker';
import { normalizeParams, validateAndSanitize } from '@/lib/rpc/validationInterceptor';
import { executeRpcRequest } from '@/lib/rpc/requestHandler';

const DEFAULT_TIMEOUT = RPC_TIMEOUTS.DEFAULT;

export async function safeRpc<T = unknown>(
  functionName: string,
  params: RpcParams = {},
  options: RpcOptions = {}
): Promise<RpcResult<T>> {
  const { timeout = DEFAULT_TIMEOUT, validateParams = true, client } = options;

  const rateLimit = rpcRateLimiter();
  if (!rateLimit.allowed) {
    const waitTime = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
    return { data: null, error: { message: `Muitas requisições. Aguarde ${waitTime}s`, code: 'RATE_LIMIT_EXCEEDED', resetTime: rateLimit.resetTime } };
  }

  checkMockClient(functionName);
  if (!isClientReady()) {
    return { data: null, error: { message: 'Cliente não pronto', code: 'CLIENT_NOT_READY' } };
  }

  const normalized = normalizeParams(params);
  const finalParams = validateAndSanitize(normalized, functionName, validateParams);

  return executeRpcRequest<T>(functionName, finalParams, timeout, client);
}
