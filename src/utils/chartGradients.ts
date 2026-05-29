/**
 * Funções utilitárias para criar gradientes em gráficos Chart.js
 */

// Chart.js context type is complex - using any is acceptable here
export const createGradientBlue = (context: any): CanvasGradient | string => {
  const chart = context.chart;
  const { ctx, chartArea } = chart;
  if (!chartArea) return 'rgba(59, 130, 246, 0.2)';
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, 'rgba(96, 165, 250, 0.5)');
  gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.3)');
  gradient.addColorStop(1, 'rgba(37, 99, 235, 0.1)');
  return gradient;
};

// Chart.js context type is complex - using any is acceptable here
export const createGradientGreen = (context: any): CanvasGradient | string => {
  const chart = context.chart;
  const { ctx, chartArea } = chart;
  if (!chartArea) return 'rgba(16, 185, 129, 0.2)';
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, 'rgba(52, 211, 153, 0.5)');
  gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.3)');
  gradient.addColorStop(1, 'rgba(5, 150, 105, 0.1)');
  return gradient;
};

// Chart.js context type is complex - using any is acceptable here
export const createGradientPurple = (context: any): CanvasGradient | string => {
  const chart = context.chart;
  const { ctx, chartArea } = chart;
  if (!chartArea) return 'rgba(139, 92, 246, 0.2)';
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, 'rgba(167, 139, 250, 0.5)');
  gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.3)');
  gradient.addColorStop(1, 'rgba(124, 58, 237, 0.1)');
  return gradient;
};

// Chart.js context type is complex - using any is acceptable here
export const createGradientAmber = (context: any): CanvasGradient | string => {
  const chart = context.chart;
  const { ctx, chartArea } = chart;
  if (!chartArea) return 'rgba(245, 158, 11, 0.2)';
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, 'rgba(251, 191, 36, 0.5)');
  gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.3)');
  gradient.addColorStop(1, 'rgba(217, 119, 6, 0.1)');
  return gradient;
};

