import { EvolucaoMensal, EvolucaoSemanal } from '@/types';
import { translateMonth, generateMonthlyLabels, generateWeeklyLabels } from '@/utils/charts';
import { CHART_CONSTANTS, alignDatasetData, padDatasetToMatchLabels, normalizeDatasetValues, adjustColorOpacity } from '@/utils/charts';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Processa dados de evolução e cria estrutura para gráficos
 * ⚠️ REFORMULAÇÃO COMPLETA: Garantir mapeamento correto por índice
 */
export const processEvolucaoData = (
  viewMode: 'mensal' | 'semanal',
  evolucaoMensal: EvolucaoMensal[],
  evolucaoSemanal: EvolucaoSemanal[],
  anoSelecionado: number
) => {
  const mensalArray = Array.isArray(evolucaoMensal) ? evolucaoMensal : [];
  const semanalArray = Array.isArray(evolucaoSemanal) ? evolucaoSemanal : [];
  
  // Filtrar e ordenar dados do ano selecionado
  const dadosAtivos = viewMode === 'mensal' 
    ? [...mensalArray].filter(d => d && d.ano === anoSelecionado).sort((a, b) => {
        if (a.ano !== b.ano) return a.ano - b.ano;
        return a.mes - b.mes;
      })
    : [...semanalArray]
        .filter(d => d && d.ano === anoSelecionado)
        .sort((a, b) => {
          if (a.ano !== b.ano) return a.ano - b.ano;
          const semanaA = Number(a.semana);
          const semanaB = Number(b.semana);
          if (isNaN(semanaA) || isNaN(semanaB)) return 0;
          return semanaA - semanaB;
        });

  // Gerar TODOS os labels (12 meses ou 53 semanas)
  const baseLabels = viewMode === 'mensal'
    ? generateMonthlyLabels([])
    : generateWeeklyLabels([]);

  // ⚠️ REFORMULAÇÃO: Criar array de dados diretamente por índice
  // Chart.js mapeia: data[0] -> labels[0], data[1] -> labels[1], etc.
  const dadosPorLabel = new Map<string, any>();
  
  if (viewMode === 'mensal') {
    // Mapear por número do mês (1-12)
    const dadosPorMes = new Map<number, EvolucaoMensal>();
    dadosAtivos.forEach(d => {
      const mes = (d as EvolucaoMensal).mes;
      if (mes != null && mes >= 1 && mes <= 12) {
        dadosPorMes.set(mes, d as EvolucaoMensal);
      }
    });
    
    // ⚠️ CRÍTICO: Preencher usando baseLabels para garantir correspondência exata
    // Garantir que os labels gerados correspondam exatamente aos dados
    baseLabels.forEach((label) => {
      // Encontrar o número do mês correspondente ao label
      const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const mesIndex = mesesNomes.findIndex(mesNome => translateMonth(mesNome) === label);
      if (mesIndex >= 0) {
        const mesNumero = mesIndex + 1;
        const dados = dadosPorMes.get(mesNumero);
        dadosPorLabel.set(label, dados ?? null);
      } else {
        // Fallback: se não encontrar, usar null
        dadosPorLabel.set(label, null);
      }
    });
    
    // ⚠️ DEBUG: Verificar mapeamento
    if (IS_DEV) {
      safeLog.info(`[processEvolucaoData] Mensal - Total de labels: ${baseLabels.length}`);
      safeLog.info(`[processEvolucaoData] Mensal - Labels: ${baseLabels.join(', ')}`);
      safeLog.info(`[processEvolucaoData] Mensal - Dados mapeados: ${Array.from(dadosPorLabel.values()).filter(d => d !== null).length}`);
    }
  } else {
    // ⚠️ CRÍTICO: Mapear por número da semana (1-53)
    const dadosPorSemana = new Map<number, EvolucaoSemanal>();
    dadosAtivos.forEach(d => {
      const semana = Number((d as EvolucaoSemanal).semana);
      if (!isNaN(semana) && semana >= 1 && semana <= 53) {
        dadosPorSemana.set(semana, d as EvolucaoSemanal);
      }
    });
    
    // ⚠️ CRÍTICO: Preencher todas as 53 semanas na ordem correta
    // Garantir que os labels gerados correspondam exatamente aos dados
    baseLabels.forEach((label, index) => {
      // Extrair número da semana do label (S01 -> 1, S02 -> 2, etc.)
      const semanaMatch = label.match(/^S(\d+)$/);
      if (semanaMatch) {
        const semana = Number(semanaMatch[1]);
        const dados = dadosPorSemana.get(semana);
        dadosPorLabel.set(label, dados ?? null);
      } else {
        // Fallback: se o label não seguir o padrão, usar null
        dadosPorLabel.set(label, null);
      }
    });
    
    // ⚠️ DEBUG: Verificar mapeamento crítico
    if (IS_DEV) {
      const s22Index = baseLabels.indexOf('S22');
      const s22Dados = dadosPorLabel.get('S22');
      safeLog.info(`[processEvolucaoData] S22 está no índice ${s22Index}, tem dados: ${s22Dados !== null && s22Dados !== undefined}`);
      if (s22Dados) {
        safeLog.info(`[processEvolucaoData] S22 dados: semana=${(s22Dados as EvolucaoSemanal).semana}, completadas=${(s22Dados as EvolucaoSemanal).corridas_completadas}`);
      }
      // Verificar primeiras e últimas semanas
      safeLog.info(`[processEvolucaoData] Primeiros labels: ${baseLabels.slice(0, 5).join(', ')}`);
      safeLog.info(`[processEvolucaoData] Últimos labels: ${baseLabels.slice(-5).join(', ')}`);
      safeLog.info(`[processEvolucaoData] Total de labels: ${baseLabels.length}`);
      safeLog.info(`[processEvolucaoData] Total de dados mapeados: ${Array.from(dadosPorLabel.values()).filter(d => d !== null).length}`);
    }
  }

  return { dadosAtivos, baseLabels, dadosPorLabel };
};

export const segundosParaHoras = (segundos: number): number => {
  return segundos / 3600;
};

/**
 * Obtém configuração de métrica
 * ⚠️ REFORMULAÇÃO: Garantir mapeamento correto por índice
 */
export const getMetricConfig = (
  metric: 'ofertadas' | 'aceitas' | 'completadas' | 'horas',
  baseLabels: string[],
  dadosPorLabel: Map<string, any>
): {
  labels: string[];
  data: (number | null)[];
  label: string;
  borderColor: string;
  backgroundColor: any;
  pointColor: string;
  yAxisID: string;
  useUtrData: boolean;
} | null => {
  // ⚠️ CRÍTICO: Mapear dados na mesma ordem dos labels
  // baseLabels[0] -> data[0], baseLabels[1] -> data[1], etc.
  const mapData = (getValue: (d: any) => number | null): (number | null)[] => {
    return baseLabels.map((label, index) => {
      const d = dadosPorLabel.get(label);
      if (d === null || d === undefined) return null;
      const value = getValue(d);
      if (value == null || value === undefined) return null;
      const numValue = Number(value);
      return isNaN(numValue) || !isFinite(numValue) ? null : numValue;
    });
  };

  switch (metric) {
    case 'horas':
      return {
        labels: baseLabels,
        data: mapData(d => {
          const segundos = Number((d as any).total_segundos) || 0;
          return segundosParaHoras(segundos);
        }),
        label: '⏱️ Horas Trabalhadas',
        borderColor: 'rgba(251, 146, 60, 1)',
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(251, 146, 60, 0.2)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(253, 186, 116, 0.5)');
          gradient.addColorStop(0.3, 'rgba(251, 146, 60, 0.35)');
          gradient.addColorStop(0.7, 'rgba(234, 88, 12, 0.15)');
          gradient.addColorStop(1, 'rgba(194, 65, 12, 0.00)');
          return gradient;
        },
        pointColor: 'rgb(251, 146, 60)',
        yAxisID: 'y',
        useUtrData: false,
      };
    case 'ofertadas':
      return {
        labels: baseLabels,
        data: mapData(d => (d as any).corridas_ofertadas),
        label: '📢 Corridas Ofertadas',
        borderColor: 'rgba(139, 92, 246, 1)',
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(139, 92, 246, 0.2)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(167, 139, 250, 0.5)');
          gradient.addColorStop(0.3, 'rgba(139, 92, 246, 0.35)');
          gradient.addColorStop(0.7, 'rgba(124, 58, 237, 0.15)');
          gradient.addColorStop(1, 'rgba(109, 40, 217, 0.00)');
          return gradient;
        },
        pointColor: 'rgb(139, 92, 246)',
        yAxisID: 'y',
        useUtrData: false,
      };
    case 'aceitas':
      return {
        labels: baseLabels,
        data: mapData(d => (d as any).corridas_aceitas),
        label: '✅ Corridas Aceitas',
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(16, 185, 129, 0.2)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(52, 211, 153, 0.5)');
          gradient.addColorStop(0.3, 'rgba(16, 185, 129, 0.35)');
          gradient.addColorStop(0.7, 'rgba(5, 150, 105, 0.15)');
          gradient.addColorStop(1, 'rgba(4, 120, 87, 0.00)');
          return gradient;
        },
        pointColor: 'rgb(16, 185, 129)',
        yAxisID: 'y',
        useUtrData: false,
      };
    case 'completadas':
    default:
      return {
        labels: baseLabels,
        data: mapData(d => (d as any).corridas_completadas ?? (d as any).total_corridas),
        label: '🚗 Corridas Completadas',
        borderColor: 'rgba(37, 99, 235, 1)',
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(37, 99, 235, 0.2)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
          gradient.addColorStop(0.3, 'rgba(37, 99, 235, 0.35)');
          gradient.addColorStop(0.7, 'rgba(30, 64, 175, 0.15)');
          gradient.addColorStop(1, 'rgba(29, 78, 216, 0.00)');
          return gradient;
        },
        pointColor: 'rgb(37, 99, 235)',
        yAxisID: 'y',
        useUtrData: false,
      };
  }
};

/**
 * Cria dados do gráfico
 * ⚠️ REFORMULAÇÃO COMPLETA: Garantir alinhamento perfeito
 */
export const createChartData = (
  selectedMetrics: Set<'ofertadas' | 'aceitas' | 'completadas' | 'horas'>,
  baseLabels: string[],
  dadosPorLabel: Map<string, any>,
  isSemanal: boolean
) => {
  if (selectedMetrics.size === 0 || baseLabels.length === 0) {
    return {
      labels: [],
      datasets: [],
    };
  }

  const metricConfigs = Array.from(selectedMetrics)
    .map(metric => getMetricConfig(metric, baseLabels, dadosPorLabel))
    .filter(config => config !== null) as Array<{
      labels: string[];
      data: (number | null)[];
      label: string;
      borderColor: string;
      backgroundColor: any;
      pointColor: string;
      yAxisID: string;
      useUtrData: boolean;
    }>;

  if (metricConfigs.length === 0) {
    return {
      labels: [],
      datasets: [],
    };
  }

  // Calcular valor máximo global para offset visual
  let globalMaxValue = 0;
  metricConfigs.forEach(config => {
    if (config.yAxisID === 'y') {
      config.data.forEach(v => {
        if (v != null && v !== 0 && v > globalMaxValue) {
          globalMaxValue = v;
        }
      });
    }
  });

  // Criar datasets
  const datasets = metricConfigs.map((config, index) => {
    // ⚠️ CRÍTICO: Os dados já vêm na ordem correta dos labels
    let data: (number | null)[] = [...config.data];
    
    // Garantir tamanho correto
    if (data.length !== baseLabels.length) {
      if (IS_DEV) {
        safeLog.warn(`[createChartData] Dataset ${index} tem tamanho ${data.length}, esperado ${baseLabels.length}`);
      }
      while (data.length < baseLabels.length) {
        data.push(null);
      }
      data = data.slice(0, baseLabels.length);
    }
    
    // Normalizar valores
    data = data.map(v => {
      if (v == null || v === undefined) return null;
      const num = Number(v);
      return isNaN(num) || !isFinite(num) ? null : num;
    });
    
    // Aplicar offset visual se necessário
    if (data.length > 0 && data.some(v => v != null) && config.yAxisID === 'y' && globalMaxValue > 0 && !config.label.includes('Horas')) {
      const baseOffset = globalMaxValue * CHART_CONSTANTS.VISUAL_OFFSET_BASE_PERCENT;
      const offsets = [0, baseOffset * 0.5, baseOffset];
      const offset = offsets[index] || 0;
      
      if (offset > 0) {
        data = data.map((value: number | null) => {
          if (value == null || value === 0) return value;
          return value + offset;
        });
      }
    }
    
    const order = index;
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
      data,
      borderColor: borderColorWithOpacity,
      backgroundColor: config.backgroundColor,
      yAxisID: config.yAxisID,
      type: 'line' as const,
      tension: 0.4,
      cubicInterpolationMode: 'monotone' as const,
      pointRadius: data.map((v: number | null) => v != null ? pointRadius : 0),
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
      order: order,
      z: index,
      stack: undefined,
      stepped: false,
      segment: {
        borderColor: (ctx: any) => borderColorWithOpacity,
        borderWidth: borderWidth,
        borderDash: dashPattern,
      },
    };
  });

  // ⚠️ DEBUG: Validação final
  if (IS_DEV) {
    safeLog.info(`[createChartData] Labels: ${baseLabels.length}, Datasets: ${datasets.length}`);
    if (datasets.length > 0) {
      const firstDataset = datasets[0];
      safeLog.info(`[createChartData] Primeiro dataset tem ${firstDataset.data.length} elementos`);
      
      // Verificar mapeamento crítico
      const s22Index = baseLabels.indexOf('S22');
      if (s22Index >= 0 && s22Index < firstDataset.data.length) {
        safeLog.info(`[createChartData] S22 (índice ${s22Index}) = ${firstDataset.data[s22Index]}`);
      }
      safeLog.info(`[createChartData] Primeiros 3: S01=${firstDataset.data[0]}, S02=${firstDataset.data[1]}, S03=${firstDataset.data[2]}`);
    }
  }

  return {
    labels: baseLabels, // ⚠️ CRÍTICO: Sempre retornar todos os labels na ordem correta
    datasets,
  };
};
