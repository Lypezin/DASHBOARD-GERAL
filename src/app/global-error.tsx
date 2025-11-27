'use client';

import { useEffect } from 'react';
import { safeLog } from '@/lib/errorHandler';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error
        safeLog.error('Global Error caught:', error);

        // Check for ChunkLoadError or 404s on JS files
        const isChunkLoadError =
            error.name === 'ChunkLoadError' ||
            error.message?.includes('Loading chunk') ||
            error.message?.includes('missing') ||
            error.message?.includes('not found');

        if (isChunkLoadError) {
            safeLog.warn('ChunkLoadError detected. Reloading page with cache busting...');

            // Force hard reload with cache busting
            // Appending a timestamp query param forces the browser to fetch the HTML again
            // bypassing the stale 'immutable' cache
            const url = new URL(window.location.href);
            url.searchParams.set('v', Date.now().toString());
            window.location.href = url.toString();
        }
    }, [error]);

    return (
        <html>
            <body>
                <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center dark:bg-slate-900">
                    <div className="max-w-md space-y-4 rounded-lg bg-white p-8 shadow-lg dark:bg-slate-800">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Algo deu errado
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            Uma nova versão do sistema está disponível ou ocorreu um erro inesperado.
                        </p>
                        <button
                            onClick={() => {
                                const url = new URL(window.location.href);
                                url.searchParams.set('v', Date.now().toString());
                                window.location.href = url.toString();
                            }}
                            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Atualizar Página
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
