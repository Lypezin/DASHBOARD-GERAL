import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function useEvolucaoUrlSync(viewMode: string, selectedMetrics: Set<string>) {
    const searchParams = useSearchParams();
    const pathname = usePathname();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        let changed = false;

        if (viewMode !== 'mensal') {
            if (params.get('evo_mode') !== viewMode) { params.set('evo_mode', viewMode); changed = true; }
        } else if (params.has('evo_mode')) { params.delete('evo_mode'); changed = true; }

        const metricsArray = Array.from(selectedMetrics);
        const metricsStr = metricsArray.join(',');

        const isDefault = metricsArray.length === 4 && ['ofertadas', 'aceitas', 'completadas', 'horas'].every(m => selectedMetrics.has(m));
        if (isDefault) {
            if (params.has('evo_metrics')) { params.delete('evo_metrics'); changed = true; }
        } else {
            if (params.get('evo_metrics') !== metricsStr) { params.set('evo_metrics', metricsStr); changed = true; }
        }

        if (changed) {
            const queryString = params.toString();
            const url = queryString ? `${pathname}?${queryString}` : pathname;
            window.history.replaceState(null, '', url);
        }
    }, [viewMode, selectedMetrics, pathname, searchParams]);
}
