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

        // DESABILITADO - estava causando loop infinito de reload
        // const isChunkLoadError = 
        //   error.name === 'ChunkLoadError' || 
        //   error.message?.includes('Loading chunk');
        // if (isChunkLoadError) {
        //   window.location.reload();
        // }
    }, [error]);

    return (
        <html>
            <body>
                <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center dark:bg-slate-900">
                    <div className="max-w-md space-y-4 rounded-lg bg-white p-8 shadow-lg dark:bg-slate-800">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Erro ao carregar
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            Ocorreu um erro. Por favor, recarregue a página manualmente com Ctrl+Shift+R.
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-500">
                            Erro: {error.message}
                        </p>
                    </div>
                </div>
            </body>
        </html>
    );
}
