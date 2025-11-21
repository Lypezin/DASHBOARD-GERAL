import { EvolucaoMensal, EvolucaoSemanal } from '@/types';
import { translateMonth, generateMonthlyLabels, generateWeeklyLabels } from '@/utils/charts';
import { CHART_CONSTANTS, alignDatasetData, padDatasetToMatchLabels, normalizeDatasetValues, adjustColorOpacity } from '@/utils/charts';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

export const processEvolucaoData = (
  viewMode: 'mensal' | 'semanal',
  evolucaoMensal: EvolucaoMensal[],
  evolucaoSemanal: EvolucaoSemanal[],
  anoSelecionado: number
) => {
  const mensalArray = Array.isArray(evolucaoMensal) ? evolucaoMensal : [];
  const semanalArray = Array.isArray(evolucaoSemanal) ? evolucaoSemanal : [];
  
  // ⚠️ CORREÇÃO: Filtrar dados do ano selecionado
  const dadosAtivos = viewMode === 'mensal' 
    ? [...mensalArray].filter(d => d && d.ano === anoSelecionado).sort((a, b) => {
        if (a.ano !== b.ano) return a.ano - b.ano;
        return a.mes - b.mes;
      })
    : [...semanalArray].filter(d => d && d.ano === anoSelecionado).sort((a, b) => {
        if (a.ano !== b.ano) return a.ano - b.ano;
        return a.semana - b.semana;
      });

  // ⚠️ OTIMIZAÇÃO: Sempre gerar todos os labels (12 meses ou 53 semanas)
  // Não importa quantos dados existem, sempre gerar todos os períodos
  const baseLabels = viewMode === 'mensal'
    ? generateMonthlyLabels([]) // Passar array vazio pois vamos gerar todos os meses
    : generateWeeklyLabels([]); // Passar array vazio pois vamos gerar todas as semanas

  // ⚠️ OTIMIZAÇÃO: Criar mapa com todos os labels (meses 1-12 ou semanas 1-53)
  // Preencher com dados quando disponíveis, deixar null quando não houver dados
  const dadosPorLabel = new Map<string, any>();
  
  if (viewMode === 'mensal') {
    // Mapear dados existentes por mês
    const dadosPorMes = new Map<number, EvolucaoMensal>();
    dadosAtivos
      .filter(d => d && (d as EvolucaoMensal).mes != null && (d as EvolucaoMensal).mes_nome)
      .forEach(d => {
        const mes = (d as EvolucaoMensal).mes;
        if (mes != null && mes >= 1 && mes <= 12) {
          dadosPorMes.set(mes, d as EvolucaoMensal);
        }
      });
    
    // ⚠️ CORREÇÃO: Preencher todos os 12 meses, garantindo que cada label tenha dados ou null
    const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    mesesNomes.forEach((mesNome, index) => {
      const mesNumero = index + 1;
      const label = translateMonth(mesNome);
      const dados = dadosPorMes.get(mesNumero);
      // ⚠️ IMPORTANTE: Sempre definir no mapa, mesmo que seja null (não undefined)
      dadosPorLabel.set(label, dados ?? null);
    });
  } else {
    // Mapear dados existentes por semana
    const dadosPorSemana = new Map<number, EvolucaoSemanal>();
    dadosAtivos
      .filter(d => d && (d as EvolucaoSemanal).semana != null && (d as EvolucaoSemanal).semana !== undefined)
      .forEach(d => {
        const semana = (d as EvolucaoSemanal).semana;
        if (semana != null && semana >= 1 && semana <= 53) {
          dadosPorSemana.set(semana, d as EvolucaoSemanal);
        }
      });
    
    // ⚠️ CORREÇÃO: Preencher todas as 53 semanas, garantindo que cada label tenha dados ou null
    for (let semana = 1; semana <= 53; semana++) {
      const label = `S${semana.toString().padStart(2, '0')}`;
      const dados = dadosPorSemana.get(semana);
      // ⚠️ IMPORTANTE: Sempre definir no mapa, mesmo que seja null (não undefined)
      // Usar ?? em vez de || para garantir que 0 não seja convertido para null
      dadosPorLabel.set(label, dados ?? null);
    }
    
    // ⚠️ DEBUG: Verificar se todos os labels foram criados
    if (IS_DEV && dadosPorLabel.size !== 53) {
      safeLog.warn(`[processEvolucaoData] Esperado 53 semanas, mas dadosPorLabel tem ${dadosPorLabel.size} entradas`);
    }
  }

  // ⚠️ DEBUG: Verificar se baseLabels e dadosPorLabel têm o mesmo tamanho
  if (IS_DEV) {
    const labelsComDados = Array.from(dadosPorLabel.values()).filter(d => d !== null).length;
    safeLog.info(`[processEvolucaoData] ${viewMode}: ${baseLabels.length} labels, ${labelsComDados} com dados, ${dadosPorLabel.size} no mapa`);
  }

  return { dadosAtivos, baseLabels, dadosPorLabel };
};

export const segundosParaHoras = (segundos: number): number => {
  return segundos / 3600;
};

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
  switch (metric) {
    case 'horas':
      // ⚠️ CORREÇÃO: Garantir que todos os labels tenham um valor (número ou null)
      const horasData = baseLabels.map(label => {
        const d = dadosPorLabel.get(label);
        // ⚠️ IMPORTANTE: Verificar explicitamente se é null ou undefined
        // Map.get() retorna undefined se a chave não existe, mas nós sempre definimos (null ou dados)
        if (d === null || d === undefined) return null;
        const segundos = Number(d.total_segundos) || 0;
        // Se segundos é 0, ainda retornar 0 (não null) para mostrar que há dados
        const horas = segundosParaHoras(segundos);
        return horas;
      });
      
      return {
        labels: baseLabels,
        data: horasData,
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
      // ⚠️ CORREÇÃO: Garantir que todos os labels tenham um valor (número ou null)
      const ofertadasData = baseLabels.map(label => {
        const d = dadosPorLabel.get(label);
        // ⚠️ IMPORTANTE: Verificar explicitamente se é null ou undefined
        if (d === null || d === undefined) return null;
        const value = (d as any).corridas_ofertadas;
        if (value == null || value === undefined) return null;
        const numValue = Number(value);
        return isNaN(numValue) || !isFinite(numValue) ? null : numValue;
      });
      return {
        labels: baseLabels,
        data: ofertadasData,
        label: '📢 Corridas Ofertadas',
        borderColor: 'rgba(14, 165, 233, 1)',
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(14, 165, 233, 0.2)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(56, 189, 248, 0.5)');
          gradient.addColorStop(0.3, 'rgba(14, 165, 233, 0.35)');
          gradient.addColorStop(0.7, 'rgba(2, 132, 199, 0.15)');
          gradient.addColorStop(1, 'rgba(3, 105, 161, 0.00)');
          return gradient;
        },
        pointColor: 'rgb(14, 165, 233)',
        yAxisID: 'y',
        useUtrData: false,
      };
    case 'aceitas':
      // ⚠️ CORREÇÃO: Garantir que todos os labels tenham um valor (número ou null)
      const aceitasData = baseLabels.map(label => {
        const d = dadosPorLabel.get(label);
        // ⚠️ IMPORTANTE: Verificar explicitamente se é null ou undefined
        if (d === null || d === undefined) return null;
        const value = (d as any).corridas_aceitas;
        if (value == null || value === undefined) return null;
        const numValue = Number(value);
        return isNaN(numValue) || !isFinite(numValue) ? null : numValue;
      });
      return {
        labels: baseLabels,
        data: aceitasData,
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
      // ⚠️ CORREÇÃO: Garantir que todos os labels tenham um valor (número ou null)
      const completadasData = baseLabels.map(label => {
        const d = dadosPorLabel.get(label);
        // ⚠️ IMPORTANTE: Verificar explicitamente se é null ou undefined
        if (d === null || d === undefined) return null;
        const value = (d as any).corridas_completadas ?? (d as any).total_corridas;
        if (value == null || value === undefined) return null;
        const numValue = Number(value);
        return isNaN(numValue) || !isFinite(numValue) ? null : numValue;
      });
      return {
        labels: baseLabels,
        data: completadasData,
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

  let globalMaxValue = 0;
  const datasetsComEixoY = metricConfigs
    .map((config, idx) => {
      let data: (number | null)[] = [];
      if (config.labels.length === baseLabels.length && 
          config.labels.every((label, i) => label === baseLabels[i])) {
        data = (config.data || []) as (number | null)[];
      } else {
        const labelMap = new Map<string, number | null>();
        config.labels.forEach((label, i) => {
          const value = config.data[i];
          labelMap.set(label, value != null && !isNaN(value) && isFinite(value) ? Number(value) : null);
        });
        data = baseLabels.map(label => labelMap.get(label) ?? null);
      }
      return { data, yAxisID: config.yAxisID, index: idx };
    })
    .filter(d => d.yAxisID === 'y');
  
  if (datasetsComEixoY.length > 0) {
    const allValues: number[] = [];
    datasetsComEixoY.forEach(d => {
      d.data.forEach(v => {
        if (v != null && v !== 0) allValues.push(v);
      });
    });
    if (allValues.length > 0) {
      globalMaxValue = Math.max(...allValues);
    }
  }

  const datasets = metricConfigs.map((config, index) => {
    // ⚠️ CORREÇÃO: Os dados já vêm mapeados corretamente de getMetricConfig
    // Não precisamos realinhar se os labels já estão corretos
    let data: (number | null)[] = config.data as (number | null)[];
    
    // ⚠️ IMPORTANTE: Garantir que o tamanho está correto (deve ser igual a baseLabels.length)
    if (data.length !== baseLabels.length) {
      // Se os tamanhos não batem, usar alignDatasetData
      data = alignDatasetData(config.data as (number | null)[], config.labels, baseLabels);
    }
    
    // Garantir que tem o tamanho correto
    data = padDatasetToMatchLabels(data, baseLabels.length);
    // Normalizar valores (garantir que null/undefined são null)
    data = normalizeDatasetValues(data);
    
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
      // ⚠️ OTIMIZAÇÃO: Ocultar pontos quando valor é null, mas manter a linha visível
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

  return {
    labels: baseLabels,
    datasets,
  };
};

