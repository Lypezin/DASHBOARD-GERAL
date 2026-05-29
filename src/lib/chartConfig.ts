/**
 * Configuracao do Chart.js
 * Registra componentes do Chart.js de forma segura para evitar re-registro
 * Funciona tanto no cliente quanto no servidor (SSR-safe)
 */

import { safeLog } from './errorHandler';

let chartRegistrationPromise: Promise<void> | null = null;

/**
 * Registra componentes do Chart.js apenas uma vez
 * Retorna uma Promise que resolve quando o Chart.js esta pronto
 * Seguro para SSR - nao faz nada no servidor
 */
export async function registerChartJS() {
  if (chartRegistrationPromise) {
    return chartRegistrationPromise;
  }

  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  chartRegistrationPromise = (async () => {
    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);

    const fontFamily = typeof document !== 'undefined'
      ? window.getComputedStyle(document.body).fontFamily || "'Inter', sans-serif"
      : "'Inter', sans-serif";

    Chart.defaults.font.family = fontFamily;
    Chart.defaults.plugins.legend.position = 'bottom';
    Chart.defaults.plugins.tooltip.backgroundColor = '#2c3e50';
    Chart.defaults.plugins.tooltip.titleFont = { weight: 'bold', size: 14 };
    Chart.defaults.plugins.tooltip.bodyFont = { size: 12 };
  })().catch((error) => {
    chartRegistrationPromise = null;
    safeLog.error('Falha ao registrar Chart.js ou plugins:', error);
    throw error;
  });

  return chartRegistrationPromise;
}
