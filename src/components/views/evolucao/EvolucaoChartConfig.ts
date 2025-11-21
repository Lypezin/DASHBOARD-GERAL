import { formatarHorasParaHMS } from '@/utils/formatters';
import {
  formatTooltipValue,
  formatVariation,
  calculateVariationPercent,
  calculateYAxisRange,
} from '@/utils/charts';

export const createEvolucaoChartOptions = (
  isSemanal: boolean,
  isDarkMode: boolean,
  selectedMetrics: Set<'ofertadas' | 'aceitas' | 'completadas' | 'horas'>,
  yAxisRange: { min?: number; max?: number }
) => ({
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
        pointStyle: 'circle',
        boxWidth: 14,
        boxHeight: 14,
        color: isDarkMode ? 'rgb(226, 232, 240)' : 'rgb(51, 65, 85)',
        generateLabels: (chart: any) => {
          const datasets = chart.data.datasets;
          return datasets.map((dataset: any, i: number) => ({
            text: dataset.label,
            fillStyle: dataset.borderColor || dataset.backgroundColor || 'rgb(59, 130, 246)',
            strokeStyle: dataset.borderColor || 'rgb(59, 130, 246)',
            lineWidth: dataset.borderWidth || 3,
            hidden: dataset.hidden || !chart.isDatasetVisible(i),
            index: i,
            pointStyle: 'circle',
            fontColor: isDarkMode ? 'rgb(226, 232, 240)' : 'rgb(51, 65, 85)',
          }));
        },
        onClick: (e: any, legendItem: any, legend: any) => {
          const index = legendItem.datasetIndex;
          const chart = legend.chart;
          const meta = chart.getDatasetMeta(index);
          meta.hidden = meta.hidden === null ? !chart.data.datasets[index].hidden : null;
          chart.update();
        },
      },
    },
    tooltip: {
      enabled: true,
      backgroundColor: 'rgba(15, 23, 42, 0.97)',
      titleColor: 'rgba(255, 255, 255, 1)',
      bodyColor: 'rgba(226, 232, 240, 1)',
      padding: 20,
      titleFont: {
        size: 16,
        weight: 'bold' as const,
        family: "'Inter', 'system-ui', sans-serif",
      },
      bodyFont: {
        size: 15,
        weight: '600' as any,
        family: "'Inter', 'system-ui', sans-serif",
      },
      borderColor: 'rgba(148, 163, 184, 0.5)',
      borderWidth: 2,
      cornerRadius: 12,
      displayColors: true,
      boxWidth: 14,
      boxHeight: 14,
      boxPadding: 6,
      usePointStyle: true,
      callbacks: {
        title: function(context: any) {
          const label = context[0]?.label || '';
          const icon = isSemanal ? '📊' : '📅';
          const prefix = isSemanal ? 'Semana' : 'Mês de';
          const cleanLabel = isSemanal ? label.replace('S','') : label;
          return `${icon} ${prefix} ${cleanLabel}`;
        },
        label: function(context: any) {
          const datasetLabel = context.dataset.label || '';
          const value = context.parsed.y;
          const formattedValue = formatTooltipValue(value, datasetLabel, formatarHorasParaHMS);
          return datasetLabel ? `${datasetLabel}: ${formattedValue}` : formattedValue;
        },
        afterLabel: function(context: any) {
          const dataIndex = context.dataIndex;
          if (dataIndex > 0) {
            const currentValue = context.parsed.y;
            const previousValue = context.dataset.data[dataIndex - 1];
            const variation = calculateVariationPercent(currentValue, previousValue);
            return variation != null ? formatVariation(variation) : '';
          }
          return '';
        },
      },
    },
  },
  scales: {
    y: {
      type: 'linear' as const,
      display: true,
      position: 'left' as const,
      beginAtZero: true,
      ...(yAxisRange.min !== undefined && yAxisRange.min >= 0 && { 
        min: Math.max(0, yAxisRange.min - (yAxisRange.max || 0) * 0.05)
      }),
      ...(yAxisRange.max !== undefined && { 
        max: yAxisRange.max + (yAxisRange.max * 0.05)
      }),
      grace: '5%',
      title: {
        display: true,
        text: selectedMetrics.size === 1 && selectedMetrics.has('horas')
          ? '⏱️ Horas Trabalhadas'
          : selectedMetrics.size === 1 && selectedMetrics.has('ofertadas')
          ? '📢 Corridas Ofertadas'
          : selectedMetrics.size === 1 && selectedMetrics.has('aceitas')
          ? '✅ Corridas Aceitas'
          : 'Métricas Selecionadas',
        font: {
          size: 13,
          weight: 'bold' as const,
          family: "'Inter', 'system-ui', sans-serif",
        },
        color: isDarkMode ? 'rgb(226, 232, 240)' : 'rgb(51, 65, 85)',
        padding: { top: 0, bottom: 8 },
      },
      grid: {
        color: (context: any) => {
          if (context.tick.value === 0) return 'rgba(100, 116, 139, 0)';
          return isDarkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.15)';
        },
        lineWidth: 1,
        drawTicks: false,
      },
      border: {
        display: false,
      },
      ticks: {
        color: isDarkMode ? 'rgb(226, 232, 240)' : 'rgb(51, 65, 85)',
        font: {
          size: 12,
          weight: 'bold' as const,
          family: "'Inter', 'system-ui', sans-serif",
        },
        padding: 8,
        callback: function(value: any) {
          if (selectedMetrics.has('horas') && selectedMetrics.size === 1) {
            return value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + 'h';
          }
          return value.toLocaleString('pt-BR');
        }
      },
    },
    x: {
      grid: {
        display: false,
      },
      border: {
        display: false,
      },
      ticks: {
        // ⚠️ OTIMIZAÇÃO: Mostrar todos os meses (12) e todas as semanas (até 53)
        maxTicksLimit: isSemanal ? 53 : 12,
        autoSkip: false, // ⚠️ IMPORTANTE: false para mostrar todos os labels
        maxRotation: isSemanal ? 45 : 0,
        minRotation: isSemanal ? 45 : 0,
        // ⚠️ OTIMIZAÇÃO: Permitir que todos os pontos sejam exibidos
        stepSize: undefined, // Sem step size para mostrar todos
        // ⚠️ IMPORTANTE: Garantir que todos os labels sejam exibidos mesmo com muitos nulls
        sampleSize: isSemanal ? 53 : 12, // Forçar exibição de todos os labels
        font: {
          size: isSemanal ? 10 : 12,
          weight: '700' as any,
          family: "'Inter', 'system-ui', sans-serif",
        },
        color: isDarkMode ? 'rgb(203, 213, 225)' : 'rgb(71, 85, 105)',
        padding: 10,
      },
    },
  },
  elements: {
    line: {
      borderCapStyle: 'round' as const,
      borderJoinStyle: 'round' as const,
    },
    point: {
      hoverBorderWidth: 4,
      radius: isSemanal ? 4 : 6,
      hoverRadius: isSemanal ? 8 : 10,
    },
  },
});

