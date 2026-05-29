export const getEvolucaoPluginsConfig = (isDarkMode: boolean) => ({
    legend: {
        position: 'top' as const,
        align: 'center' as const,
        display: true,
        labels: {
            font: {
                size: 14,
                weight: 'bold' as const,
                family: "'Inter', 'system-ui', sans-serif",
            },
            padding: 16,
            usePointStyle: true,
            pointStyle: 'circle' as const,
            color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 23, 42, 0.9)',
            boxWidth: 12,
            boxHeight: 12,
        },
    },
    tooltip: {
        enabled: true,
        backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDarkMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.95)',
        bodyColor: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 23, 42, 0.9)',
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(15, 23, 42, 0.2)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        usePointStyle: true,
        callbacks: {
            // Chart.js context type is complex - using any is acceptable here
            label: function (context: any) {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                if (value == null || isNaN(value) || !isFinite(value)) {
                    return `${label}: N/A`;
                }
                if (label.includes('Horas')) {
                    return `${label}: ${value.toFixed(1)}h`;
                }
                return `${label}: ${value.toLocaleString('pt-BR')}`;
            },
        },
    },
});
