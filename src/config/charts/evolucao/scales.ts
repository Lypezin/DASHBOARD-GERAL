export const evolucaoScales = (isSemanal: boolean, isDarkMode: boolean, selectedMetrics: Set<string>, yAxisRange: { min?: number; max?: number }) => ({
    y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: true,
        ...(yAxisRange.min !== undefined && yAxisRange.min >= 0 && { min: Math.max(0, yAxisRange.min - (yAxisRange.max || 0) * 0.05) }),
        ...(yAxisRange.max !== undefined && { max: yAxisRange.max + (yAxisRange.max * 0.05) }),
        grace: '5%',
        title: {
            display: true,
            text: selectedMetrics.size === 1 && selectedMetrics.has('horas') ? '⏱️ Horas Trabalhadas' :
                selectedMetrics.size === 1 && selectedMetrics.has('ofertadas') ? '📢 Corridas Ofertadas' :
                    selectedMetrics.size === 1 && selectedMetrics.has('aceitas') ? '✅ Corridas Aceitas' : 'Métricas Selecionadas',
            font: { size: 13, weight: 'bold' as const, family: "'Inter', 'system-ui', sans-serif" },
            color: isDarkMode ? 'rgb(226, 232, 240)' : 'rgb(51, 65, 85)',
            padding: { top: 0, bottom: 8 },
        },
        grid: {
            color: (context: any) => context.tick.value === 0 ? 'rgba(100, 116, 139, 0)' : isDarkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.15)',
            lineWidth: 1,
            drawTicks: false,
        },
        border: { display: false },
        ticks: {
            color: isDarkMode ? 'rgb(226, 232, 240)' : 'rgb(51, 65, 85)',
            font: { size: 12, weight: 'bold' as const, family: "'Inter', 'system-ui', sans-serif" },
            padding: 8,
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
            autoSkip: false,
            maxTicksLimit: isSemanal ? 53 : 12,
            includeBounds: true,
            maxRotation: isSemanal ? 45 : 0,
            minRotation: isSemanal ? 45 : 0,
            font: { size: isSemanal ? 8 : 11, weight: '600' as const, family: "'Inter', 'system-ui', sans-serif" },
            color: isDarkMode ? 'rgb(203, 213, 225)' : 'rgb(71, 85, 105)',
            padding: isSemanal ? 3 : 10,
        },
    },
});
