import { EvolucaoMensal, EvolucaoSemanal } from '@/types';
import { translateMonth, generateMonthlyLabels, generateWeeklyLabels } from '@/utils/charts';
import { CHART_CONSTANTS, alignDatasetData, padDatasetToMatchLabels, normalizeDatasetValues, adjustColorOpacity } from '@/utils/charts';

export const processEvolucaoData = (
  viewMode: 'mensal' | 'semanal',
  evolucaoMensal: EvolucaoMensal[],
  evolucaoSemanal: EvolucaoSemanal[],
  anoSelecionado: number
) => {
  const mensalArray = Array.isArray(evolucaoMensal) ? evolucaoMensal : [];
  const semanalArray = Array.isArray(evolucaoSemanal) ? evolucaoSemanal : [];
  
  const dadosAtivos = viewMode === 'mensal' 
    ? [...mensalArray].filter(d => d && d.ano === anoSelecionado).sort((a, b) => {
        if (a.ano !== b.ano) return a.ano - b.ano;
        return a.mes - b.mes;
      })
    : [...semanalArray].filter(d => d && d.ano === anoSelecionado).sort((a, b) => {
        if (a.ano !== b.ano) return a.ano - b.ano;
        return a.semana - b.semana;
      });

  const baseLabels = viewMode === 'mensal'
    ? generateMonthlyLabels(dadosAtivos as EvolucaoMensal[])
    : generateWeeklyLabels(dadosAtivos as EvolucaoSemanal[]);

  const dadosPorLabel = new Map<string, any>();
  if (viewMode === 'mensal') {
    dadosAtivos
      .filter(d => d && (d as EvolucaoMensal).mes != null && (d as EvolucaoMensal).mes_nome)
      .sort((a, b) => {
        if ((a as EvolucaoMensal).ano !== (b as EvolucaoMensal).ano) {
          return (a as EvolucaoMensal).ano - (b as EvolucaoMensal).ano;
        }
        return (a as EvolucaoMensal).mes - (b as EvolucaoMensal).mes;
      })
      .forEach(d => {
        const label = translateMonth((d as EvolucaoMensal).mes_nome);
        dadosPorLabel.set(label, d);
      });
  } else {
    dadosAtivos
      .filter(d => d && (d as EvolucaoSemanal).semana != null && (d as EvolucaoSemanal).semana !== undefined)
      .sort((a, b) => {
        if ((a as EvolucaoSemanal).ano !== (b as EvolucaoSemanal).ano) {
          return (a as EvolucaoSemanal).ano - (b as EvolucaoSemanal).ano;
        }
        return (a as EvolucaoSemanal).semana - (b as EvolucaoSemanal).semana;
      })
      .forEach(d => {
        const semana = (d as EvolucaoSemanal).semana;
        if (semana != null && semana !== undefined) {
          dadosPorLabel.set(`S${semana}`, d);
        }
      });
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
      const horasData = baseLabels.map(label => {
        const d = dadosPorLabel.get(label);
        if (!d) return null;
        const segundos = Number(d.total_segundos) || 0;
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
      const ofertadasData = baseLabels.map(label => {
        const d = dadosPorLabel.get(label);
        if (!d) return null;
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
      const aceitasData = baseLabels.map(label => {
        const d = dadosPorLabel.get(label);
        if (!d) return null;
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
      const completadasData = baseLabels.map(label => {
        const d = dadosPorLabel.get(label);
        if (!d) return null;
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
    let data: (number | null)[] = [];
    
    data = alignDatasetData(config.data as (number | null)[], config.labels, baseLabels);
    data = padDatasetToMatchLabels(data, baseLabels.length);
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

