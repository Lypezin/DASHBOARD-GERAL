import { useState, useEffect } from 'react';
import { registerChartJS } from '@/lib/chartConfig';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useChartRegistration() {
    const [chartReady, setChartReady] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            registerChartJS()
                .then(() => {
                    setChartReady(true);
                    if (IS_DEV) {
                        safeLog.info('✅ Chart.js está pronto, componentes podem renderizar');
                    }
                })
                .catch((error) => {
                    safeLog.error('Erro ao registrar Chart.js:', error);
                    setChartReady(true);
                });
        } else {
            setChartReady(true);
        }
    }, []);

    return chartReady;
}
