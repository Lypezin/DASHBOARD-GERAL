export const evolucaoScales = (isSemanal: boolean, isDarkMode: boolean, selectedMetrics: Set<string>, yAxisRange: { min?: number; max?: number }) => ({
    y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: true,
        ...(yAxisRange.min !== undefined && yAxisRange.min >= 0 && { min: Math.max(0, yAxisRange.min - (yAxisRange.max || 0) * 0.05) }),
        ...(yAxisRange.max !== undefined && { max: yAxisRange.max + (yAxisRange.max * 0.08) }),
        grace: '8%',
        title: {
            display: true,
            text: selectedMetrics.size === 1 && selectedMetrics.has('horas') ? 'Horas trabalhadas' :
                selectedMetrics.size === 1 && selectedMetrics.has('ofertadas') ? 'Corridas ofertadas' :
                    selectedMetrics.size === 1 && selectedMetrics.has('aceitas') ? 'Corridas aceitas' : 'Métricas selecionadas',
            font: { size: 12, weight: '700' as const, family: "'Outfit', 'Inter', 'system-ui', sans-serif" },
            color: isDarkMode ? 'rgb(203, 213, 225)' : 'rgb(71, 85, 105)',
            padding: { top: 0, bottom: 10 },
        },
        grid: {
            color: (context: any) => context.tick.value === 0 ? 'rgba(100, 116, 139, 0)' : isDarkMode ? 'rgba(148, 163, 184, 0.12)' : 'rgba(148, 163, 184, 0.18)',
            lineWidth: 1,
            drawTicks: false,
        },
        border: { display: false },
        ticks: {
            color: isDarkMode ? 'rgb(148, 163, 184)' : 'rgb(100, 116, 139)',
            font: { size: 11, weight: '700' as const, family: "'Outfit', 'Inter', 'system-ui', sans-serif" },
            padding: 10,
            callback: function (value: any) {
                if (selectedMetrics.has('horas') && selectedMetrics.size === 1) return value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + 'h';
                return value.toLocaleString('pt-BR');
            }
        },
    },
    x: {
        type: 'category' as const,
        grid: { display: false },
        border: { display: false },
        ticks: {
            autoSkip: isSemanal,
            maxTicksLimit: isSemanal ? 18 : 12,
            includeBounds: true,
            maxRotation: isSemanal ? 0 : 0,
            minRotation: 0,
            font: { size: isSemanal ? 10 : 11, weight: '700' as const, family: "'Outfit', 'Inter', 'system-ui', sans-serif" },
            color: isDarkMode ? 'rgb(148, 163, 184)' : 'rgb(100, 116, 139)',
            padding: 10,
        },
    },
});
