/**
 * Configuração do Chart.js
 * Registra componentes do Chart.js de forma segura para evitar re-registro
 * Funciona tanto no cliente quanto no servidor (SSR-safe)
 */

// Flag global para garantir registro único
let registrationPromise: Promise<void> | null = null;
let isRegistered = false;

/**
 * Registra componentes do Chart.js apenas uma vez
 * Retorna uma Promise que resolve quando o Chart.js está pronto
 * Seguro para SSR - não faz nada no servidor
 */
export function registerChartJS(): Promise<void> {
  // Não registrar no servidor (SSR)
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  // Se já está registrado, retornar Promise resolvida
  if (isRegistered) {
    return Promise.resolve();
  }

  // Se já está em processo de registro, retornar a mesma Promise
  if (registrationPromise) {
    return registrationPromise;
  }

  // Criar nova Promise de registro
  registrationPromise = (async () => {
    try {
      // Importar chart.js/auto de forma dinâmica (mais confiável)
      const chartModule = await import('chart.js/auto');
      
      if (chartModule && chartModule.Chart) {
        const Chart = chartModule.Chart;
        
        // Verificar se as escalas já estão registradas (chart.js/auto já registra tudo)
        if (Chart.registry && Chart.registry.getScale('linear') && Chart.registry.getScale('category') && Chart.registry.getScale('time')) {
          isRegistered = true;
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Chart.js registrado via chart.js/auto (já estava registrado)');
          }
          return;
        }

        // Se chart.js/auto não registrou automaticamente, registrar manualmente
        const {
          CategoryScale,
          LinearScale,
          TimeScale,
          BarElement,
          LineElement,
          PointElement,
          ArcElement,
          Title,
          Tooltip,
          Legend,
          Filler
        } = await import('chart.js');

        Chart.register(
          CategoryScale,
          LinearScale,
          TimeScale,
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
          console.log('✅ Chart.js registrado manualmente com todas as escalas');
          
          // Verificar se o registro funcionou
          try {
            const hasLinear = Chart.registry?.getScale('linear');
            const hasCategory = Chart.registry?.getScale('category');
            const hasTime = Chart.registry?.getScale('time');
            console.log('Escalas disponíveis:', { 
              linear: !!hasLinear, 
              category: !!hasCategory,
              time: !!hasTime
            });
          } catch (e) {
            console.warn('Erro ao verificar escalas:', e);
          }
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Erro no registro do Chart.js:', error);
      }
      // Mesmo com erro, marcar como registrado para evitar loops infinitos
      isRegistered = true;
      throw error;
    }
  })();

  return registrationPromise;
}

