/**
 * Configuração do Chart.js
 * Registra componentes do Chart.js de forma segura para evitar re-registro
 * Funciona tanto no cliente quanto no servidor (SSR-safe)
 */

// Import condicional apenas no cliente para evitar problemas no SSR
let ChartJS: any;
let CategoryScale: any;
let LinearScale: any;
let BarElement: any;
let LineElement: any;
let PointElement: any;
let ArcElement: any;
let Title: any;
let Tooltip: any;
let Legend: any;
let Filler: any;

// Flag global para garantir registro único
let isRegistered = false;
let isImporting = false;

/**
 * Registra componentes do Chart.js apenas uma vez
 * Deve ser chamado antes de usar qualquer componente do Chart.js
 * Seguro para SSR - não faz nada no servidor
 */
export function registerChartJS() {
  // Não registrar no servidor (SSR)
  if (typeof window === 'undefined') {
    return;
  }

  if (isRegistered) {
    return;
  }

  if (isImporting) {
    return;
  }

      // Importar Chart.js apenas no cliente
      try {
        isImporting = true;
        // Usar require para importação dinâmica no cliente
        const chartModule = require('chart.js');
        ChartJS = chartModule.Chart;
        CategoryScale = chartModule.CategoryScale;
        LinearScale = chartModule.LinearScale;
        BarElement = chartModule.BarElement;
        LineElement = chartModule.LineElement;
        PointElement = chartModule.PointElement;
        ArcElement = chartModule.ArcElement;
        Title = chartModule.Title;
        Tooltip = chartModule.Tooltip;
        Legend = chartModule.Legend;
        Filler = chartModule.Filler;

        // Verificar se já está registrado
        try {
          if (ChartJS?.registry?.getScale('category') && ChartJS?.registry?.getScale('linear')) {
            isRegistered = true;
            isImporting = false;
            return;
          }
        } catch (error) {
          // Registry pode não estar disponível ainda, continuar com registro
        }

        try {
          ChartJS.register(
            CategoryScale,
            LinearScale,
            BarElement,
            LineElement,
            PointElement,
            ArcElement,
            Title,
            Tooltip,
            Legend,
            Filler
          );
          isRegistered = true;
          
          if (process.env.NODE_ENV === 'development') {
            console.log('Chart.js registrado com sucesso');
          }
        } catch (error) {
          // Se já estiver registrado, ignorar erro
          if (process.env.NODE_ENV === 'development') {
            console.warn('Chart.js registration warning:', error);
          }
          isRegistered = true;
        }
    isImporting = false;
  } catch (error) {
    isImporting = false;
    if (process.env.NODE_ENV === 'development') {
      console.error('Chart.js registration error:', error);
    }
  }
}

