import { safeRpc } from '@/lib/rpcWrapper';
import { safeLog } from '@/lib/errorHandler';
import { RPC_TIMEOUTS, DELAYS } from '@/constants/config';

const IS_DEV = process.env.NODE_ENV === 'development';

export function triggerConcurrentRefresh(refreshRpcFunction: string) {
    setTimeout(async () => {
        try {
            const { data, error } = await safeRpc<{
                success: boolean;
                view?: string;
                duration_seconds?: number;
            }>(refreshRpcFunction, {}, {
                timeout: RPC_TIMEOUTS.LONG * 2,
                validateParams: false
            });

            if (data?.success && IS_DEV) {
                const duration = data.duration_seconds ? `${data.duration_seconds.toFixed(2)}s` : 'N/A';
                safeLog.info(`✅ Refresh CONCURRENTLY concluído: ${data.view || refreshRpcFunction} em ${duration}`);
            } else if (IS_DEV && error) {
                safeLog.warn(`Refresh concurrently falhou ou não disponível: ${error.message}`);
            }
        } catch (e) {
            /* ignore */
        }
    }, DELAYS.REFRESH_ASYNC);
}
