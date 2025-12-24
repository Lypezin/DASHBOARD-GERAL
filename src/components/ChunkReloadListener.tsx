'use client';

import { useEffect } from 'react';
import { safeLog } from '@/lib/errorHandler';

export function ChunkReloadListener() {
    useEffect(() => {
        const handleError = (event: ErrorEvent | PromiseRejectionEvent) => {
            let message = '';

            if (event instanceof ErrorEvent) {
                message = event.message || '';
            } else if (event instanceof PromiseRejectionEvent) {
                message = event.reason?.message || String(event.reason || '');
            }

            const msgLower = message.toLowerCase();

            // Detecção de erros de Chunk/Deploy
            // Detecção de erros de Chunk/Deploy (JS antigo tentando carregar chunks novos)
            const isChunkError =
                msgLower.includes('loading chunk') ||
                msgLower.includes('unexpected token <') || // Retorno de HTML 404 no lugar de JS
                (msgLower.includes('cannot read properties of undefined') && msgLower.includes('reading \'call\'')); // Webpack bootstrap failure

            // REMOVIDO: Erros de Hydration (#418, #423) não devem causar reload automático pois muitas vezes são benignos
            // ou causados por extensões do browser.

            if (isChunkError) {
                // Prevenir loop infinito de reloads (se o erro persistir por > 10s, deixa crashar)
                const lastReload = typeof window !== 'undefined' ? sessionStorage.getItem('chunk_reload_timestamp') : null;
                const now = Date.now();

                if (!lastReload || (now - Number(lastReload) > 10000)) {
                    console.warn('[ChunkReloadListener] Erro de chunk detectado. Recarregando página...', message);
                    sessionStorage.setItem('chunk_reload_timestamp', now.toString());
                    window.location.reload();
                } else {
                    console.error('[ChunkReloadListener] Loop de reload detectado. Abortando reload.', message);
                }
            }
        };

        // Listeners globais
        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleError);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleError);
        };
    }, []);

    return null;
}
