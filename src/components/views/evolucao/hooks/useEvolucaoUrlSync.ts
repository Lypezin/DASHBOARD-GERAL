import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export function useEvolucaoUrlSync(viewMode: string, selectedMetrics: Set<string>) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        let changed = false;

        if (viewMode !== 'mensal') {
            if (params.get('evo_mode') !== viewMode) { params.set('evo_mode', viewMode); changed = true; }
        } else if (params.has('evo_mode')) { params.delete('evo_mode'); changed = true; }

        const metricsArray = Array.from(selectedMetrics);
        const metricsStr = metricsArray.join(',');

        if (metricsArray.length === 1 && metricsArray[0] === 'completadas') {
            if (params.has('evo_metrics')) { params.delete('evo_metrics'); changed = true; }
        } else {
            if (params.get('evo_metrics') !== metricsStr) { params.set('evo_metrics', metricsStr); changed = true; }
        }

        if (changed) {
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [viewMode, selectedMetrics, pathname, router, searchParams]);
}
