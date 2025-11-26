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
      const mesRaw = (d as EvolucaoMensal).mes;
      const mes = typeof mesRaw === 'string' ? parseInt(mesRaw, 10) : Number(mesRaw);
      if (!isNaN(mes) && mes >= 1 && mes <= 12) {
        dadosPorMes.set(mes, d as EvolucaoMensal);
      }
    });

    // ⚠️ CRÍTICO: Preencher usando baseLabels para garantir correspondência exata
    // baseLabels já contém os meses em português na ordem correta (Janeiro, Fevereiro, ..., Dezembro)
    // Cada label corresponde ao índice + 1 (Janeiro = índice 0 = mês 1, Fevereiro = índice 1 = mês 2, etc.)
    baseLabels.forEach((label, index) => {
      const mesNumero = index + 1; // Janeiro = 1, Fevereiro = 2, ..., Dezembro = 12
      const dados = dadosPorMes.get(mesNumero);
      dadosPorLabel.set(label, dados ?? null);
    });

    // ⚠️ DEBUG: Verificar mapeamento
    if (IS_DEV) {
      safeLog.info(`[processEvolucaoData] Mensal - Ano selecionado: ${anoSelecionado}`);
      safeLog.info(`[processEvolucaoData] Mensal - Total de dados recebidos: ${dadosAtivos.length}`);
      safeLog.info(`[processEvolucaoData] Mensal - Dados por mês:`, Array.from(dadosPorMes.entries()).map(([mes, d]) => ({
        mes,
        mes_nome: d.mes_nome,
        completadas: d.corridas_completadas
      })));
      safeLog.info(`[processEvolucaoData] Mensal - Total de labels: ${baseLabels.length}`);
      safeLog.info(`[processEvolucaoData] Mensal - Labels: ${baseLabels.join(', ')}`);
      safeLog.info(`[processEvolucaoData] Mensal - Dados mapeados: ${Array.from(dadosPorLabel.values()).filter(d => d !== null).length}`);
      // Verificar mapeamento detalhado
      baseLabels.forEach((label, index) => {
        const dados = dadosPorLabel.get(label);
        if (dados) {
          safeLog.info(`[processEvolucaoData] ${label} (índice ${index}, mês ${index + 1}): completadas=${dados.corridas_completadas}`);
        } else {
          safeLog.info(`[processEvolucaoData] ${label} (índice ${index}, mês ${index + 1}): SEM DADOS`);
        }
      });
    }
  } else {
    // ⚠️ CRÍTICO: Mapear por número da semana (1-53)
    const dadosPorSemana = new Map<number, EvolucaoSemanal>();
    dadosAtivos.forEach(d => {
      // ⚠️ CORREÇÃO: Garantir conversão correta do número da semana
      const semanaRaw = (d as EvolucaoSemanal).semana;
      const semana = typeof semanaRaw === 'string' ? parseInt(semanaRaw, 10) : Number(semanaRaw);
      if (!isNaN(semana) && semana >= 1 && semana <= 53) {
        dadosPorSemana.set(semana, d as EvolucaoSemanal);
        if (IS_DEV) {
          safeLog.info(`[processEvolucaoData] Mapeando semana ${semana}: completadas=${(d as EvolucaoSemanal).corridas_completadas}, aceitas=${(d as EvolucaoSemanal).corridas_aceitas}, ofertadas=${(d as EvolucaoSemanal).corridas_ofertadas}`);
        }
      } else if (IS_DEV) {
        safeLog.warn(`[processEvolucaoData] Semana inválida ignorada: ${semanaRaw} (tipo: ${typeof semanaRaw})`);
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
    const mappedData = baseLabels.map((label, index) => {
      const d = dadosPorLabel.get(label);
      if (d === null || d === undefined) {
        if (IS_DEV && index < 3) {
          safeLog.info(`[getMetricConfig] Label ${label} (índice ${index}): SEM DADOS`);
        }
        return null;
      }
      const value = getValue(d);
      if (value == null || value === undefined) {
        if (IS_DEV && index < 3) {
          safeLog.info(`[getMetricConfig] Label ${label} (índice ${index}): valor é null/undefined`);
        }
        return null;
      }
      // ⚠️ CORREÇÃO: Converter para número de forma mais robusta (suporta string e number)
      const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
      if (isNaN(numValue) || !isFinite(numValue)) {
        if (IS_DEV && index < 3) {
          safeLog.info(`[getMetricConfig] Label ${label} (índice ${index}): valor inválido (${value})`);
        }
        return null;
      }
      if (IS_DEV && index < 3) {
        safeLog.info(`[getMetricConfig] Label ${label} (índice ${index}): valor=${numValue}`);
      }
      return numValue;
    });

    if (IS_DEV) {
      const nonNullCount = mappedData.filter(d => d !== null).length;
      safeLog.info(`[getMetricConfig] Total de valores não-nulos: ${nonNullCount} de ${mappedData.length}`);
    }

    return mappedData;
  };

  switch (metric) {
    case 'horas':
      return {
        labels: baseLabels,
        data: mapData(d => {
          // ⚠️ CORREÇÃO: Converter total_segundos de forma mais robusta (pode vir como string do Supabase)
          const segundosRaw = (d as any).total_segundos;
          const segundos = typeof segundosRaw === 'string' ? parseFloat(segundosRaw) : Number(segundosRaw) || 0;
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
        data: mapData(d => {
          // ⚠️ CORREÇÃO: Garantir conversão correta (pode vir como string ou number)
          const value = (d as any).corridas_ofertadas;
          return typeof value === 'string' ? parseFloat(value) : value;
        }),
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
        data: mapData(d => {
          // ⚠️ CORREÇÃO: Garantir conversão correta (pode vir como string ou number)
          const value = (d as any).corridas_aceitas;
          return typeof value === 'string' ? parseFloat(value) : value;
        }),
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
        data: mapData(d => {
          // ⚠️ CORREÇÃO: Garantir conversão correta (pode vir como string ou number)
          const value = (d as any).corridas_completadas ?? (d as any).total_corridas;
          return typeof value === 'string' ? parseFloat(value) : value;
        }),
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
      spanGaps: true, // ⚠️ CORREÇÃO: true para conectar linhas mesmo com valores null (gaps)
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
    safeLog.info(`[createChartData] ========== INÍCIO VALIDAÇÃO ==========`);
    safeLog.info(`[createChartData] Labels: ${baseLabels.length}, Datasets: ${datasets.length}`);
    safeLog.info(`[createChartData] Primeiros 5 labels: ${baseLabels.slice(0, 5).join(', ')}`);
    safeLog.info(`[createChartData] Últimos 5 labels: ${baseLabels.slice(-5).join(', ')}`);

    if (datasets.length > 0) {
      datasets.forEach((dataset, datasetIndex) => {
        safeLog.info(`[createChartData] Dataset ${datasetIndex} (${dataset.label}): ${dataset.data.length} elementos`);

        // Verificar primeiros e últimos valores
        const primeirosValores = dataset.data.slice(0, 5).map((v, i) => `${baseLabels[i]}=${v}`).join(', ');
        const ultimosValores = dataset.data.slice(-5).map((v, i) => `${baseLabels[baseLabels.length - 5 + i]}=${v}`).join(', ');
        safeLog.info(`[createChartData] Dataset ${datasetIndex} - Primeiros 5: ${primeirosValores}`);
        safeLog.info(`[createChartData] Dataset ${datasetIndex} - Últimos 5: ${ultimosValores}`);

        // Contar valores não-nulos
        const nonNullCount = dataset.data.filter(v => v !== null && v !== undefined).length;
        safeLog.info(`[createChartData] Dataset ${datasetIndex} - Valores não-nulos: ${nonNullCount} de ${dataset.data.length}`);
      });
    }
    safeLog.info(`[createChartData] ========== FIM VALIDAÇÃO ==========`);
  }

  return {
    labels: baseLabels, // ⚠️ CRÍTICO: Sempre retornar todos os labels na ordem correta
    datasets,
  };
};
