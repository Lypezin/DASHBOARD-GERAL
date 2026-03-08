export const getInitialViewMode = (searchParams: URLSearchParams | { get: (k: string) => string | null }) => {
    const mode = searchParams.get('evo_mode');
    return (mode === 'semanal' ? 'semanal' : 'mensal');
};

export const getInitialMetrics = (searchParams: URLSearchParams | { get: (k: string) => string | null }) => {
    const metricsParam = searchParams.get('evo_metrics');
    if (metricsParam) {
        const metrics = metricsParam.split(',').filter(Boolean) as Array<'ofertadas' | 'aceitas' | 'completadas' | 'horas'>;
        if (metrics.length > 0) return new Set(metrics);
    }
    return new Set<'ofertadas' | 'aceitas' | 'completadas' | 'horas'>(['completadas']);
};
