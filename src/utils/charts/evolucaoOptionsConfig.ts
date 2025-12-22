import { getEvolucaoPluginsConfig } from './evolucaoPluginsConfig';

/**
 * Cria configuração de opções do gráfico de evolução
 */
export const createEvolucaoChartOptions = (isDarkMode: boolean, isSemanal: boolean) => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: {
        padding: {
            top: 12,
            right: 16,
            bottom: 8,
            left: 12,
        },
    },
    animation: {
        duration: 300,
        easing: 'easeOutCubic' as const,
        delay: 0,
        ...(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? { duration: 0 } : {}),
    },
    interaction: {
        mode: 'index' as const,
        intersect: false,
        axis: 'x' as const,
    },
    onHover: (event: any, activeElements: any[]) => {
        if (activeElements && activeElements.length > 0) {
            event.native.target.style.cursor = 'pointer';
        } else {
            event.native.target.style.cursor = 'default';
        }
    },
    plugins: getEvolucaoPluginsConfig(isDarkMode),
    scales: {
        x: {
            display: true,
            grid: {
                display: true,
                color: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                lineWidth: 1,
            },
            ticks: {
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(15, 23, 42, 0.7)',
                font: {
                    size: isSemanal ? 11 : 12,
                    weight: '500' as const,
                },
                maxRotation: isSemanal ? 45 : 0,
                minRotation: isSemanal ? 45 : 0,
                padding: 8,
            },
            border: {
                display: true,
                color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.1)',
            },
        },
        y: {
            display: true,
            type: 'linear' as const,
            position: 'left' as const,
            grid: {
                display: true,
                color: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                lineWidth: 1,
            },
            ticks: {
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(15, 23, 42, 0.7)',
                font: {
                    size: 12,
                    weight: '500' as const,
                },
                padding: 8,
                callback: function (value: any) {
                    if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
                        return '';
                    }
                    return value.toLocaleString('pt-BR');
                },
            },
            border: {
                display: true,
                color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.1)',
            },
        },
    },
});
