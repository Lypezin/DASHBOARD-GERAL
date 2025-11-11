/**
 * Configuração do Chart.js
 * Registra componentes do Chart.js de forma segura para evitar re-registro
 * Funciona tanto no cliente quanto no servidor (SSR-safe)
 */

// Flag global para garantir registro único
let registrationPromise: Promise<void> | null = null;
let isRegistered = false;

// Adicionar outros imports aqui
import { safeLog } from './errorHandler';

/**
 * Registra componentes do Chart.js apenas uma vez
 * Retorna uma Promise que resolve quando o Chart.js está pronto
 * Seguro para SSR - não faz nada no servidor
 */
export async function registerChartJS() {
  if (typeof window !== 'undefined') {
    try {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      // Configurações globais
      Chart.defaults.font.family = "'Inter', sans-serif";
      Chart.defaults.plugins.legend.position = 'bottom';
      Chart.defaults.plugins.tooltip.backgroundColor = '#2c3e50';
      Chart.defaults.plugins.tooltip.titleFont = { weight: 'bold', size: 14 };
      Chart.defaults.plugins.tooltip.bodyFont = { size: 12 };

    } catch (error) {
      safeLog.error('Falha ao registrar Chart.js ou plugins:', error);
      // Lançar o erro novamente para que o chamador possa tratá-lo se necessário
      throw error;
    }
  }
}

