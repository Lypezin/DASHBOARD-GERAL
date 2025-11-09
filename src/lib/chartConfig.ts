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

  if (isImporting) {
    return;
  }

  try {
    isImporting = true;
    
    // MÉTODO 1: Tentar usar chart.js/auto primeiro (mais confiável)
    try {
      const autoChart = require('chart.js/auto');
      if (autoChart && autoChart.Chart) {
        ChartJS = autoChart.Chart;
        
        // Verificar se as escalas estão registradas
        if (ChartJS?.registry?.getScale('linear') && ChartJS?.registry?.getScale('category')) {
          isRegistered = true;
          isImporting = false;
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Chart.js registrado via chart.js/auto');
          }
          return;
        }
      }
    } catch (autoError) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('chart.js/auto falhou, tentando registro manual:', autoError);
      }
    }

    // MÉTODO 2: Registro manual como fallback
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
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Chart.js já estava registrado');
        }
        return;
      }
    } catch (error) {
      // Registry pode não estar disponível ainda, continuar com registro
    }

    // Forçar registro manual
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
      console.log('✅ Chart.js registrado manualmente');
      
      // Verificar se o registro funcionou
      try {
        const hasLinear = ChartJS?.registry?.getScale('linear');
        const hasCategory = ChartJS?.registry?.getScale('category');
        console.log('Escalas disponíveis:', { linear: !!hasLinear, category: !!hasCategory });
      } catch (e) {
        console.warn('Erro ao verificar escalas:', e);
      }
    }

    isImporting = false;
  } catch (error) {
    isImporting = false;
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Erro no registro do Chart.js:', error);
    }
    
    // MÉTODO 3: Último recurso - definir como registrado para evitar loops
    isRegistered = true;
  }
}

