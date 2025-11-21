import { CHART_CONSTANTS, adjustColorOpacity } from '@/utils/charts';
import { createGradientBlue, createGradientGreen, createGradientPurple, createGradientAmber } from './chartGradients';

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
  plugins: {
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
        label: function(context: any) {
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
  },
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
        callback: function(value: any) {
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

/**
 * Cria configuração de dataset para uma métrica específica
 */
export const createMetricDatasetConfig = (
  metric: 'ofertadas' | 'aceitas' | 'completadas' | 'horas',
  index: number,
  isSemanal: boolean,
  config: {
    label: string;
    data: (number | null)[];
    borderColor: string;
    backgroundColor: any;
    pointColor: string;
    yAxisID: string;
  }
) => {
  const borderWidth = CHART_CONSTANTS.BORDER_WIDTHS[index] || 4;
  const pointRadius = isSemanal
    ? (CHART_CONSTANTS.POINT_RADIUS_SEMANAL[index] || 6)
    : (CHART_CONSTANTS.POINT_RADIUS_MENSAL[index] || 9);
  const dashPattern = CHART_CONSTANTS.DASH_PATTERNS[index] || [];
  const opacity = CHART_CONSTANTS.OPACITIES[index] || 1.0;

  const borderColorWithOpacity = adjustColorOpacity(config.borderColor, opacity);
  const pointColorWithOpacity = adjustColorOpacity(config.pointColor, opacity);

  return {
    label: config.label,
    data: config.data,
    borderColor: borderColorWithOpacity,
    backgroundColor: config.backgroundColor,
    yAxisID: config.yAxisID,
    type: 'line' as const,
    tension: 0.4,
    cubicInterpolationMode: 'monotone' as const,
    pointRadius: pointRadius,
    pointHoverRadius: isSemanal ? 12 : 14,
    pointHitRadius: 35,
    pointBackgroundColor: pointColorWithOpacity,
    pointBorderColor: '#fff',
    pointBorderWidth: 4,
    pointHoverBackgroundColor: config.pointColor,
    pointHoverBorderColor: '#fff',
    pointHoverBorderWidth: 6,
    pointStyle: 'circle' as const,
    borderWidth: borderWidth,
    borderDash: dashPattern,
    fill: false,
    spanGaps: false,
    showLine: true,
    hidden: false,
    order: index,
    z: index,
    stack: undefined,
    stepped: false,
    segment: {
      borderColor: (ctx: any) => {
        if (!ctx.p0 || !ctx.p1) return borderColorWithOpacity;
        return borderColorWithOpacity;
      },
      borderWidth: borderWidth,
      borderDash: dashPattern,
    },
  };
};

