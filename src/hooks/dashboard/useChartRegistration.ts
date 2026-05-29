import { useEffect, useState } from 'react';
import { registerChartJS } from '@/lib/chartConfig';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

let chartRegistered = false;
let chartRegistrationPromise: Promise<void> | null = null;

function ensureChartRegistration() {
    if (chartRegistered) {
        return Promise.resolve();
    }

    if (!chartRegistrationPromise) {
        chartRegistrationPromise = registerChartJS()
            .then(() => {
                chartRegistered = true;
                if (IS_DEV) {
                    safeLog.info('Chart.js esta pronto, componentes podem renderizar');
                }
            })
            .catch((error) => {
                safeLog.error('Erro ao registrar Chart.js:', error);
                chartRegistered = true;
            });
    }

    return chartRegistrationPromise;
}

export function useChartRegistration(enabled = true) {
    const [registrationReady, setRegistrationReady] = useState(chartRegistered);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        if (typeof window === 'undefined' || chartRegistered) {
            setRegistrationReady(true);
            return;
        }

        let cancelled = false;
        setRegistrationReady(false);

        ensureChartRegistration()
            .then(() => {
                if (!cancelled) {
                    setRegistrationReady(true);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [enabled]);

    return !enabled || chartRegistered || registrationReady;
}
