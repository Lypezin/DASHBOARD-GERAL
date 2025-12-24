
import { useEffect } from 'react';
import { registerChartJS } from '@/lib/chartConfig';
import { safeLog } from '@/lib/errorHandler';

export function useComparacaoChartRegistration() {
    useEffect(() => {
        if (typeof window !== 'undefined') {
            registerChartJS().catch((err) => {
                safeLog.error('Erro ao registrar Chart.js:', err);
            });
        }
    }, []);
}
