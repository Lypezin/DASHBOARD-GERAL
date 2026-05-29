import { safeLog } from '@/lib/errorHandler';
import { DELAYS } from '@/constants/config';
import { postUploadApi } from '@/utils/upload/fetchUploadApi';

const IS_DEV = process.env.NODE_ENV === 'development';

export function triggerConcurrentRefresh(table: string) {
    setTimeout(async () => {
        try {
            const { ok, payload } = await postUploadApi<{
                success?: boolean;
                view?: string;
                duration_seconds?: number;
            }>('/api/upload/refresh-view', {
                table,
            });

            if (ok && payload?.success && IS_DEV) {
                const duration = payload.duration_seconds ? `${payload.duration_seconds.toFixed(2)}s` : 'N/A';
                safeLog.info(`Refresh CONCURRENTLY concluido: ${payload.view || table} em ${duration}`);
            } else if (IS_DEV && !ok) {
                safeLog.warn(`Refresh concurrently falhou ou nao disponivel: ${payload?.error || 'erro desconhecido'}`);
            }
        } catch {
            /* ignore */
        }
    }, DELAYS.REFRESH_ASYNC);
}
