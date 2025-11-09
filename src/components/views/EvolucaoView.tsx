import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { EvolucaoMensal, EvolucaoSemanal, UtrSemanal } from '@/types';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { registerChartJS } from '@/lib/chartConfig';

const IS_DEV = process.env.NODE_ENV === 'development';

// Registrar Chart.js quando o componente for carregado
if (typeof window !== 'undefined') {
  registerChartJS();
}

function EvolucaoView({
  evolucaoMensal,
  evolucaoSemanal,
  utrSemanal,
  loading,
  anoSelecionado,
  anosDisponiveis,
  onAnoChange,
}: {
  evolucaoMensal: EvolucaoMensal[];
  evolucaoSemanal: EvolucaoSemanal[];
  utrSemanal: UtrSemanal[];
  loading: boolean;
  anoSelecionado: number;
  anosDisponiveis: number[];
  onAnoChange: (ano: number) => void;
}) {
  const [viewMode, setViewMode] = useState<'mensal' | 'semanal'>('mensal');
  const [selectedMetrics, setSelectedMetrics] = useState<Set<'ofertadas' | 'aceitas' | 'completadas' | 'rejeitadas' | 'horas' | 'utr'>>(new Set(['completadas']));
  const [chartError, setChartError] = useState<string | null>(null);
  const isSemanal = viewMode === 'semanal';
  
  // Garantir que Chart.js está registrado quando o componente montar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        registerChartJS();
      } catch (error) {
        if (IS_DEV) console.error('Erro ao registrar Chart.js:', error);
        setChartError('Erro ao inicializar gráficos. Tente recarregar a página.');
      }
    }
  }, []);

  // Ajustar métricas quando mudar o modo de visualização
  useEffect(() => {
    setSelectedMetrics(prev => {
      const newSet = new Set(prev);
      // Se estava em UTR e mudou para mensal, remover UTR
      if (viewMode === 'mensal' && newSet.has('utr')) {
        newSet.delete('utr');
        // Se não sobrou nenhuma métrica, adicionar completadas
        if (newSet.size === 0) {
          newSet.add('completadas');
        }
      }
      // Se mudou para semanal mas não tem dados de UTR e estava em UTR, remover UTR
      if (viewMode === 'semanal' && newSet.has('utr') && utrSemanal.length === 0) {
        newSet.delete('utr');
        // Se não sobrou nenhuma métrica, adicionar completadas
        if (newSet.size === 0) {
          newSet.add('completadas');
        }
      }
      return newSet;
    });
  }, [viewMode, utrSemanal.length]);
  
  // Detectar tema atual para ajustar cores do gráfico
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    // Detectar tema inicial
    const checkTheme = () => {
      if (typeof window !== 'undefined') {
        setIsDarkMode(document.documentElement.classList.contains('dark'));
      }
    };
    
    checkTheme();
    
    // Observar mudanças no tema
    const observer = new MutationObserver(() => {
      checkTheme();
    });
    
    if (typeof window !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      });
    }
    
    return () => observer.disconnect();
  }, []);

  // IMPORTANTE: Todos os hooks devem ser chamados ANTES de qualquer early return
  // Gradientes vibrantes e modernos com múltiplas paradas de cor (otimizado com useCallback)
  const gradientBlue = useCallback((context: any) => {
    const chart = context.chart;
    const { ctx, chartArea } = chart;
    if (!chartArea) return 'rgba(59, 130, 246, 0.2)';
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, 'rgba(96, 165, 250, 0.5)');    // Azul vibrante mais intenso
    gradient.addColorStop(0.3, 'rgba(59, 130, 246, 0.35)'); // Azul médio
    gradient.addColorStop(0.7, 'rgba(37, 99, 235, 0.15)');  // Azul escuro suave
    gradient.addColorStop(1, 'rgba(30, 64, 175, 0.00)');    // Transparente
    return gradient;
  }, []);

  const gradientGreen = useCallback((context: any) => {
    const chart = context.chart;
    const { ctx, chartArea } = chart;
    if (!chartArea) return 'rgba(34, 197, 94, 0.2)';
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, 'rgba(74, 222, 128, 0.5)');    // Verde vibrante mais intenso
    gradient.addColorStop(0.3, 'rgba(34, 197, 94, 0.35)');  // Verde médio
    gradient.addColorStop(0.7, 'rgba(22, 163, 74, 0.15)');   // Verde escuro suave
    gradient.addColorStop(1, 'rgba(20, 83, 45, 0.00)');     // Transparente
    return gradient;
  }, []);

  const gradientPurple = useCallback((context: any) => {
    const chart = context.chart;
    const { ctx, chartArea } = chart;
    if (!chartArea) return 'rgba(168, 85, 247, 0.2)';
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, 'rgba(196, 181, 253, 0.5)');    // Roxo vibrante mais intenso
    gradient.addColorStop(0.3, 'rgba(168, 85, 247, 0.35)');  // Roxo médio
    gradient.addColorStop(0.7, 'rgba(139, 92, 246, 0.15)');   // Roxo escuro suave
    gradient.addColorStop(1, 'rgba(124, 58, 237, 0.00)');     // Transparente
    return gradient;
  }, []);

  const gradientRed = useCallback((context: any) => {
    const chart = context.chart;
    const { ctx, chartArea } = chart;
    if (!chartArea) return 'rgba(239, 68, 68, 0.2)';
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, 'rgba(248, 113, 113, 0.5)');    // Vermelho vibrante mais intenso
    gradient.addColorStop(0.3, 'rgba(239, 68, 68, 0.35)');  // Vermelho médio
    gradient.addColorStop(0.7, 'rgba(220, 38, 38, 0.15)');   // Vermelho escuro suave
    gradient.addColorStop(1, 'rgba(185, 28, 28, 0.00)');     // Transparente
    return gradient;
  }, []);

  // Memoizar conversão de segundos para horas
  const segundosParaHoras = useCallback((segundos: number): number => {
    return segundos / 3600;
  }, []);

  // Ordenar e garantir que todos os dados sejam exibidos (otimizado com useMemo)
  const dadosAtivos = useMemo(() => {
    try {
      const mensalArray = Array.isArray(evolucaoMensal) ? evolucaoMensal : [];
      const semanalArray = Array.isArray(evolucaoSemanal) ? evolucaoSemanal : [];
      
      return viewMode === 'mensal' 
        ? [...mensalArray].filter(d => d && d.ano === anoSelecionado).sort((a, b) => {
            // Ordenar por ano e mês
            if (a.ano !== b.ano) return a.ano - b.ano;
            return a.mes - b.mes;
          })
        : [...semanalArray].filter(d => d && d.ano === anoSelecionado).sort((a, b) => {
            // Ordenar por ano e semana
            if (a.ano !== b.ano) return a.ano - b.ano;
            return a.semana - b.semana;
          });
    } catch (error) {
      if (IS_DEV) console.error('Erro ao processar dadosAtivos:', error);
      return [];
    }
  }, [viewMode, evolucaoMensal, evolucaoSemanal, anoSelecionado]);

  // Dados de UTR filtrados por ano
  const dadosUtrAtivos = useMemo(() => {
    try {
      const utrArray = Array.isArray(utrSemanal) ? utrSemanal : [];
      return utrArray
        .filter(d => d && d.ano === anoSelecionado)
        .sort((a, b) => {
          if (a.ano !== b.ano) return a.ano - b.ano;
          return a.semana - b.semana;
        });
    } catch (error) {
      if (IS_DEV) console.error('Erro ao processar dadosUtrAtivos:', error);
      return [];
    }
  }, [utrSemanal, anoSelecionado]);

  // Função para traduzir meses para português
  const traduzirMes = useCallback((mesNome: string): string => {
    const meses: Record<string, string> = {
      'January': 'Janeiro',
      'February': 'Fevereiro',
      'March': 'Março',
      'April': 'Abril',
      'May': 'Maio',
      'June': 'Junho',
      'July': 'Julho',
      'August': 'Agosto',
      'September': 'Setembro',
      'October': 'Outubro',
      'November': 'Novembro',
      'December': 'Dezembro',
      'January ': 'Janeiro',
      'February ': 'Fevereiro',
      'March ': 'Março',
      'April ': 'Abril',
      'May ': 'Maio',
      'June ': 'Junho',
      'July ': 'Julho',
      'August ': 'Agosto',
      'September ': 'Setembro',
      'October ': 'Outubro',
      'November ': 'Novembro',
      'December ': 'Dezembro',
    };
    return meses[mesNome] || mesNome;
  }, []);

  // Helper function para obter configuração de métrica
  const getMetricConfig = useCallback((metric: 'ofertadas' | 'aceitas' | 'completadas' | 'rejeitadas' | 'horas' | 'utr'): {
    labels: string[];
    data: number[];
    label: string;
    borderColor: string;
    backgroundColor: any;
    pointColor: string;
    yAxisID: string;
    useUtrData: boolean;
  } | null => {
    const baseLabels = viewMode === 'mensal'
      ? dadosAtivos.map(d => traduzirMes((d as EvolucaoMensal).mes_nome))
      : dadosAtivos.map(d => `S${(d as EvolucaoSemanal).semana}`);

    switch (metric) {
      case 'utr':
        if (viewMode === 'semanal' && dadosUtrAtivos.length > 0) {
          return {
            labels: dadosUtrAtivos.map(d => d.semana_label),
            data: dadosUtrAtivos.map(d => d.utr),
            label: '🎯 UTR (Taxa de Utilização)',
            borderColor: 'rgba(168, 85, 247, 1)',
            backgroundColor: gradientPurple,
            pointColor: 'rgb(168, 85, 247)',
        yAxisID: 'y',
            useUtrData: true,
          };
        }
        return null;
      case 'horas':
        return {
          labels: baseLabels,
          data: dadosAtivos.map(d => segundosParaHoras(d.total_segundos)),
          label: '⏱️ Horas Trabalhadas',
          borderColor: 'rgba(251, 146, 60, 1)', // Laranja (bem diferente do verde)
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
          data: dadosAtivos.map(d => (d as any).corridas_ofertadas || (d as any).total_corridas || 0),
          label: '📢 Corridas Ofertadas',
          borderColor: 'rgba(14, 165, 233, 1)', // Cyan/azul claro
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
        return {
          labels: baseLabels,
          data: dadosAtivos.map(d => (d as any).corridas_aceitas || 0),
          label: '✅ Corridas Aceitas',
          borderColor: 'rgba(16, 185, 129, 1)', // Verde esmeralda mais vibrante
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
      case 'rejeitadas':
        return {
          labels: baseLabels,
          data: dadosAtivos.map(d => (d as any).corridas_rejeitadas || 0),
          label: '❌ Corridas Rejeitadas',
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: gradientRed,
          pointColor: 'rgb(239, 68, 68)',
          yAxisID: 'y',
          useUtrData: false,
        };
      case 'completadas':
      default:
        return {
          labels: baseLabels,
          data: dadosAtivos.map(d => (d as any).corridas_completadas || (d as any).total_corridas || 0),
          label: '🚗 Corridas Completadas',
          borderColor: 'rgba(37, 99, 235, 1)', // Azul escuro
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
  }, [dadosAtivos, dadosUtrAtivos, viewMode, segundosParaHoras, traduzirMes, gradientPurple, gradientRed]); // Removido gradientGreen, gradientPurple, gradientRed (não são dependências)

  // Dados do gráfico com múltiplas métricas (otimizado com useMemo)
  const chartData = useMemo(() => {
    // Se não há métricas selecionadas, retornar gráfico vazio
    if (selectedMetrics.size === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    // Verificar se há dados disponíveis
    const hasData = dadosAtivos.length > 0 || dadosUtrAtivos.length > 0;
    if (!hasData) {
      return {
        labels: [],
        datasets: [],
      };
    }

    try {
      // Obter configurações para todas as métricas selecionadas
      const metricConfigs = Array.from(selectedMetrics)
        .map(metric => getMetricConfig(metric))
        .filter(config => config !== null) as Array<{
          labels: string[];
          data: number[];
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

      // Usar labels da primeira métrica (ou da UTR se estiver presente, pois pode ter labels diferentes)
      const utrConfig = metricConfigs.find(c => c.useUtrData);
      const baseLabels = utrConfig?.labels || metricConfigs[0].labels;

      if (!baseLabels || baseLabels.length === 0) {
        return {
          labels: [],
          datasets: [],
        };
      }

      // Criar datasets para cada métrica selecionada
      const datasets = metricConfigs.map((config) => {
        // Para UTR, usar dados próprios; para outras, alinhar com baseLabels
        let data = config.data || [];
        if (!config.useUtrData && utrConfig && baseLabels.length !== config.data.length) {
          // Se temos UTR e outras métricas, precisamos alinhar os dados
          // Mapear dados para os labels corretos
          const labelMap = new Map();
          config.labels.forEach((label, idx) => {
            labelMap.set(label, config.data[idx]);
          });
          data = baseLabels.map(label => labelMap.get(label) || 0);
        } else if (config.useUtrData && baseLabels.length !== config.data.length) {
          // Se UTR tem labels diferentes, alinhar outras métricas
          data = config.data || [];
        }

        return {
          label: config.label,
          data,
          borderColor: config.borderColor,
          backgroundColor: config.backgroundColor,
          yAxisID: config.yAxisID,
          tension: 0.5,
        cubicInterpolationMode: 'monotone' as const,
          pointRadius: isSemanal ? 5 : 7,
          pointHoverRadius: isSemanal ? 10 : 12,
          pointHitRadius: 20,
          pointBackgroundColor: config.pointColor,
        pointBorderColor: '#fff',
          pointBorderWidth: 3.5,
          pointHoverBackgroundColor: config.pointColor,
        pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 5,
          pointStyle: 'circle' as const,
          borderWidth: 3.5,
        fill: true,
        spanGaps: true,
        segment: {
          borderColor: (ctx: any) => {
              if (!ctx.p0 || !ctx.p1) return config.borderColor;
            const value0 = ctx.p0.parsed.y;
            const value1 = ctx.p1.parsed.y;
              
              // Para UTR, usar cores baseadas no valor
              if (config.useUtrData) {
                const avg = (value0 + value1) / 2;
                if (avg >= 1) return 'rgba(34, 197, 94, 1)'; // Verde para UTR >= 1
                if (avg >= 0.5) return 'rgba(251, 191, 36, 1)'; // Amarelo para UTR >= 0.5
                return 'rgba(239, 68, 68, 1)'; // Vermelho para UTR < 0.5
              }
              return config.borderColor;
          },
        },
        };
      });

      return {
        labels: baseLabels,
        datasets,
      };
    } catch (error) {
      if (IS_DEV) console.error('Erro ao criar chartData:', error);
      return {
        labels: [],
        datasets: [],
  };
    }
  }, [selectedMetrics, getMetricConfig, isSemanal, dadosAtivos.length, dadosUtrAtivos.length]);
  // Opções do gráfico otimizadas (useMemo para evitar recriação)
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 12,
        right: 16,
        bottom: 8,
        left: 12,
      },
    },
    animation: {
      duration: 300, // Animação muito mais rápida para melhor performance
      easing: 'easeOutCubic' as const, // Corrigido: easeOut não é válido, usando easeOutCubic
      delay: 0, // Sem delay para melhor performance
      // Desabilitar animação em dispositivos lentos
      ...(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? { duration: 0 } : {}),
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
      axis: 'x' as const,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'center' as const,
        labels: {
          font: {
            size: 14,
            weight: 'bold' as const,
            family: "'Inter', 'system-ui', sans-serif",
          },
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 12,
          boxHeight: 12,
          color: isDarkMode ? 'rgb(226, 232, 240)' : 'rgb(51, 65, 85)',
          generateLabels: (chart: any) => {
            const datasets = chart.data.datasets;
            return datasets.map((dataset: any, i: number) => ({
              text: dataset.label,
              fillStyle: i === 0 ? 'rgb(59, 130, 246)' : 'rgb(34, 197, 94)',
              strokeStyle: i === 0 ? 'rgb(59, 130, 246)' : 'rgb(34, 197, 94)',
              lineWidth: 3,
              hidden: !chart.isDatasetVisible(i),
              index: i,
              pointStyle: 'circle',
            }));
          },
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(15, 23, 42, 0.97)',
        titleColor: 'rgba(255, 255, 255, 1)',
        bodyColor: 'rgba(226, 232, 240, 1)',
        padding: 20,
        titleFont: {
          size: 16,
          weight: 'bold' as const,
          family: "'Inter', 'system-ui', sans-serif",
        },
        bodyFont: {
          size: 15,
          weight: '600' as any,
          family: "'Inter', 'system-ui', sans-serif",
        },
        borderColor: 'rgba(148, 163, 184, 0.5)',
        borderWidth: 2,
        cornerRadius: 12,
        displayColors: true,
        boxWidth: 14,
        boxHeight: 14,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          title: function(context: any) {
            const label = context[0]?.label || '';
            const icon = isSemanal ? '📊' : '📅';
            const prefix = isSemanal ? 'Semana' : 'Mês de';
            const cleanLabel = isSemanal ? label.replace('S','') : label;
            return `${icon} ${prefix} ${cleanLabel}`;
          },
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.dataset.label.includes('Horas')) {
              const horasDecimais = context.parsed.y;
              const totalSegundos = Math.round(horasDecimais * 3600);
              label += formatarHorasParaHMS(totalSegundos / 3600);
            } else if (context.dataset.label.includes('UTR')) {
              label += context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            } else if (context.dataset.label.includes('Corridas')) {
              label += context.parsed.y.toLocaleString('pt-BR') + ' corridas';
            } else {
              label += context.parsed.y.toLocaleString('pt-BR');
            }
            return label;
          },
          afterLabel: function(context: any) {
            // Adicionar variação percentual se houver dados anteriores
            const dataIndex = context.dataIndex;
            if (dataIndex > 0) {
              const currentValue = context.parsed.y;
              const previousValue = context.dataset.data[dataIndex - 1];
              if (previousValue && previousValue !== 0) {
                const variation = ((currentValue - previousValue) / previousValue * 100);
                const arrow = variation > 0 ? '📈' : variation < 0 ? '📉' : '➡️';
                const sign = variation > 0 ? '+' : '';
                return `${arrow} ${sign}${variation.toFixed(1)}% vs anterior`;
              }
            }
            return '';
          },
        }
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: selectedMetrics.size === 1 && selectedMetrics.has('utr')
            ? '🎯 UTR (Corridas/Hora)' 
            : selectedMetrics.size === 1 && selectedMetrics.has('horas')
            ? '⏱️ Horas Trabalhadas'
            : selectedMetrics.size === 1 && selectedMetrics.has('ofertadas')
            ? '📢 Corridas Ofertadas'
            : selectedMetrics.size === 1 && selectedMetrics.has('aceitas')
            ? '✅ Corridas Aceitas'
            : selectedMetrics.size === 1 && selectedMetrics.has('rejeitadas')
            ? '❌ Corridas Rejeitadas'
            : 'Métricas Selecionadas',
          font: {
            size: 13,
            weight: 'bold' as const,
            family: "'Inter', 'system-ui', sans-serif",
          },
          color: isDarkMode ? 'rgb(226, 232, 240)' : 'rgb(51, 65, 85)',
          padding: { top: 0, bottom: 8 },
        },
        grid: {
          color: (context: any) => {
            // Grid com opacidade alternada e adaptado ao tema
            if (context.tick.value === 0) return 'rgba(100, 116, 139, 0)';
            return isDarkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.15)';
          },
          lineWidth: 1,
          drawTicks: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: isDarkMode ? 'rgb(226, 232, 240)' : 'rgb(51, 65, 85)',
          font: {
            size: 12,
            weight: 'bold' as const,
            family: "'Inter', 'system-ui', sans-serif",
          },
          padding: 8,
          callback: function(value: any) {
            // Se tiver UTR selecionado, formatar como decimal
            if (selectedMetrics.has('utr') && selectedMetrics.size === 1) {
              return value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
            }
            // Se tiver horas selecionado, formatar com 'h'
            if (selectedMetrics.has('horas') && selectedMetrics.size === 1) {
            return value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + 'h';
            }
            return value.toLocaleString('pt-BR');
          }
        },
      },
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          maxTicksLimit: isSemanal ? 52 : 12, // Mostrar todas as semanas (até 52) ou todos os meses (12)
          autoSkip: dadosAtivos.length <= (isSemanal ? 52 : 12) ? false : true, // Desabilitar autoSkip se houver poucos dados
          maxRotation: isSemanal ? 45 : 0, // Permitir rotação para semanas para melhor visualização
          minRotation: isSemanal ? 45 : 0,
          font: {
            size: isSemanal ? 10 : 12, // Font menor para semanas quando houver muitos dados
            weight: '700' as any,
            family: "'Inter', 'system-ui', sans-serif",
          },
          color: isDarkMode ? 'rgb(203, 213, 225)' : 'rgb(71, 85, 105)',
          padding: 10,
        },
      },
    },
    elements: {
      line: {
        borderCapStyle: 'round' as const,
        borderJoinStyle: 'round' as const,
      },
      point: {
        hoverBorderWidth: 4,
        radius: isSemanal ? 4 : 6,
        hoverRadius: isSemanal ? 8 : 10,
      },
    },
  }), [isSemanal, dadosAtivos.length, isDarkMode, selectedMetrics]);

  // Early return APÓS todos os hooks
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header Skeleton */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-blue-950/30">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico Skeleton */}
        <div className="relative rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/30 to-blue-50/20 p-8 shadow-xl dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/50 dark:to-blue-950/10 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="mb-6 space-y-2">
              <div className="h-7 w-56 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              <div className="h-4 w-80 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>
            
            <div className="h-[550px] rounded-xl bg-white/50 dark:bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-400"></div>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">Carregando dados de evolução...</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Aguarde enquanto buscamos as informações</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200/50 bg-gradient-to-br from-slate-50 via-slate-100/50 to-slate-100/30 p-6 shadow-lg dark:border-slate-800/50 dark:from-slate-950/40 dark:via-slate-900/30 dark:to-slate-950/20">
              <div className="space-y-3">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-12 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-3 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header com controles */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-blue-950/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                <span className="text-xl">📉</span>
                Evolução {viewMode === 'mensal' ? 'Mensal' : 'Semanal'}
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Acompanhe a evolução de corridas e horas ao longo do tempo
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Seletor de Ano */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ano:</label>
                <select
                  value={anoSelecionado}
                  onChange={(e) => onAnoChange(Number(e.target.value))}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {anosDisponiveis.map((ano) => (
                    <option key={ano} value={ano}>
                      {ano}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggle Mensal/Semanal */}
              <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('mensal')}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                    viewMode === 'mensal'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  📅 Mensal
                </button>
                <button
                  onClick={() => setViewMode('semanal')}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                    viewMode === 'semanal'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  📊 Semanal
                </button>
              </div>

                {/* Seletor de Métricas (Múltipla Seleção) */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Métricas:</label>
                  <div className="flex flex-wrap gap-2">
                    {(['ofertadas', 'aceitas', 'completadas', 'rejeitadas', 'horas'] as const).map(metric => {
                      const labels: Record<typeof metric, string> = {
                        ofertadas: '📢 Ofertadas',
                        aceitas: '✅ Aceitas',
                        completadas: '🚗 Completadas',
                        rejeitadas: '❌ Rejeitadas',
                        horas: '⏱️ Horas',
                      };
                      const colors: Record<typeof metric, { bg: string; border: string; dot: string }> = {
                        ofertadas: { bg: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-300 dark:border-cyan-700', dot: 'bg-cyan-500' },
                        aceitas: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-300 dark:border-emerald-700', dot: 'bg-emerald-500' },
                        completadas: { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-300 dark:border-blue-700', dot: 'bg-blue-500' },
                        rejeitadas: { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-300 dark:border-red-700', dot: 'bg-red-500' },
                        horas: { bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-300 dark:border-orange-700', dot: 'bg-orange-500' },
                      };
                      const metricColors = colors[metric];
                      return (
                        <label
                          key={metric}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                            selectedMetrics.has(metric)
                              ? `${metricColors.bg} ${metricColors.border}`
                              : 'bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-700 hover:border-blue-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedMetrics.has(metric)}
                            onChange={(e) => {
                              const newSet = new Set(selectedMetrics);
                              if (e.target.checked) {
                                newSet.add(metric);
                              } else {
                                newSet.delete(metric);
                                // Garantir que pelo menos uma métrica esteja selecionada
                                if (newSet.size === 0) {
                                  newSet.add('completadas');
                                }
                              }
                              setSelectedMetrics(newSet);
                            }}
                            className={`w-4 h-4 rounded focus:ring-2 ${
                              metric === 'ofertadas' ? 'text-cyan-600 focus:ring-cyan-500' :
                              metric === 'aceitas' ? 'text-emerald-600 focus:ring-emerald-500' :
                              metric === 'completadas' ? 'text-blue-600 focus:ring-blue-500' :
                              metric === 'rejeitadas' ? 'text-red-600 focus:ring-red-500' :
                              'text-orange-600 focus:ring-orange-500'
                            }`}
                          />
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${metricColors.dot} shadow-md`}></span>
                            {labels[metric]}
                          </span>
                        </label>
                      );
                    })}
                    {viewMode === 'semanal' && (
                      <label
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                          selectedMetrics.has('utr')
                            ? 'bg-purple-50 border-purple-300 dark:bg-purple-950/30 dark:border-purple-700'
                            : 'bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-700 hover:border-purple-400'
                        } ${dadosUtrAtivos.length === 0 && utrSemanal.length === 0 ? 'opacity-50 cursor-not-allowed' : dadosUtrAtivos.length === 0 && utrSemanal.length > 0 ? 'opacity-75' : ''}`}
                        title={
                          dadosUtrAtivos.length === 0 && utrSemanal.length === 0
                            ? 'Dados de UTR não disponíveis. Verifique se a função SQL listar_utr_semanal está configurada corretamente.'
                            : dadosUtrAtivos.length === 0 && utrSemanal.length > 0
                            ? `Dados de UTR disponíveis para outros anos, mas não para ${anoSelecionado}. Anos disponíveis: ${[...new Set(utrSemanal.map(d => d.ano))].join(', ')}`
                            : `Selecionar UTR (${dadosUtrAtivos.length} semanas disponíveis)`
                        }
                      >
                        <input
                          type="checkbox"
                          checked={selectedMetrics.has('utr')}
                          disabled={dadosUtrAtivos.length === 0}
                          onChange={(e) => {
                            if (dadosUtrAtivos.length === 0) {
                              if (IS_DEV) {
                                console.warn('⚠️ Tentativa de selecionar UTR sem dados disponíveis');
                                console.warn('- Ano selecionado:', anoSelecionado);
                                console.warn('- Total UTR semanal:', utrSemanal.length);
                                console.warn('- Anos disponíveis:', [...new Set(utrSemanal.map(d => d.ano))]);
                                console.warn('- Dados filtrados:', dadosUtrAtivos.length);
                              }
                              return;
                            }
                            const newSet = new Set(selectedMetrics);
                            if (e.target.checked) {
                              newSet.add('utr');
                            } else {
                              newSet.delete('utr');
                              // Garantir que pelo menos uma métrica esteja selecionada
                              if (newSet.size === 0) {
                                newSet.add('completadas');
                              }
                            }
                            setSelectedMetrics(newSet);
                          }}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                        />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-purple-500 shadow-md"></span>
                          🎯 UTR {
                            dadosUtrAtivos.length > 0 
                              ? `(${dadosUtrAtivos.length})` 
                              : utrSemanal.length > 0 
                                ? `(sem dados para ${anoSelecionado})` 
                                : '(indisponível)'
                          }
                        </span>
                      </label>
                    )}
            </div>
          </div>
        </div>
      </div>
          </div>
        </div>
      </div>
      {/* Gráfico de Evolução - Visual Premium */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/30 to-blue-50/20 p-8 shadow-xl dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/50 dark:to-blue-950/10 overflow-hidden">
        {/* Elementos decorativos de fundo */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        </div>
        
        {chartData.datasets.length > 0 && chartData.labels.length > 0 ? (
          <div className="relative z-10">
            {/* Título do gráfico */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-white text-lg shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                    📊
                  </span>
                  Evolução {selectedMetrics.size === 1 ? 'de ' + (selectedMetrics.has('utr') ? 'UTR' : selectedMetrics.has('horas') ? 'Horas Trabalhadas' : selectedMetrics.has('ofertadas') ? 'Corridas Ofertadas' : selectedMetrics.has('aceitas') ? 'Corridas Aceitas' : selectedMetrics.has('rejeitadas') ? 'Corridas Rejeitadas' : 'Corridas Completadas') : 'de Métricas'} {viewMode === 'mensal' ? 'Mensal' : 'Semanal'}
                </h4>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {selectedMetrics.has('utr') && viewMode === 'semanal' && dadosUtrAtivos.length > 0 && selectedMetrics.size === 1
                    ? `Análise detalhada de UTR por semana (${dadosUtrAtivos.length} semanas exibidas)`
                    : `Análise detalhada de ${selectedMetrics.size} ${selectedMetrics.size === 1 ? 'métrica' : 'métricas'} (${selectedMetrics.has('utr') && dadosUtrAtivos.length > 0 ? dadosUtrAtivos.length : dadosAtivos.length} ${viewMode === 'mensal' ? 'meses' : 'semanas'} exibidos)`}
                </p>
              </div>
              
              {/* Indicadores de métricas selecionadas */}
              <div className="hidden lg:flex items-center gap-2 flex-wrap">
                {selectedMetrics.has('utr') && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                    <div className="w-3 h-3 rounded-full bg-purple-500 shadow-md"></div>
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-300">UTR</span>
                </div>
                )}
                {selectedMetrics.has('horas') && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-md"></div>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Horas</span>
                </div>
                )}
                {selectedMetrics.has('ofertadas') && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800">
                    <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-md"></div>
                    <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300">Ofertadas</span>
                  </div>
                )}
                {selectedMetrics.has('aceitas') && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-md"></div>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Aceitas</span>
                  </div>
                )}
                {selectedMetrics.has('completadas') && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-md"></div>
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Completadas</span>
                  </div>
                )}
                {selectedMetrics.has('horas') && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                    <div className="w-3 h-3 rounded-full bg-orange-500 shadow-md"></div>
                    <span className="text-xs font-bold text-orange-700 dark:text-orange-300">Horas</span>
                  </div>
                )}
                {selectedMetrics.has('rejeitadas') && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-md"></div>
                    <span className="text-xs font-bold text-red-700 dark:text-red-300">Rejeitadas</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Container do gráfico com altura aumentada e melhor performance */}
            <div className="relative h-[550px] rounded-xl bg-white/80 dark:bg-slate-900/80 p-6 backdrop-blur-md shadow-inner border border-slate-200/50 dark:border-slate-700/50">
              {/* Efeito de brilho sutil */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-50/50 via-blue-100/30 to-indigo-100/20 dark:from-blue-950/20 dark:via-blue-900/10 dark:to-indigo-950/10"></div>
              <div className="relative z-10 h-full w-full">
                {chartError ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Erro ao carregar gráfico</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{chartError}</p>
                    </div>
                  </div>
                ) : chartData && chartData.datasets && chartData.datasets.length > 0 && chartData.labels && chartData.labels.length > 0 ? (
                  (() => {
                    try {
                      return (
                        <Line 
                          data={chartData} 
                          options={chartOptions}
                          redraw={false}
                          updateMode="none"
                        />
                      );
                    } catch (error: any) {
                      if (IS_DEV) console.error('Erro ao renderizar gráfico:', error);
                      setChartError('Erro ao renderizar gráfico. Tente recarregar a página.');
                      return (
                        <div className="flex h-full items-center justify-center">
                          <div className="text-center">
                            <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Erro ao carregar gráfico</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Tente recarregar a página.</p>
                          </div>
                        </div>
                      );
                    }
                  })()
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-slate-500 dark:text-slate-400">Preparando dados do gráfico...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex h-[500px] items-center justify-center">
            <div className="text-center max-w-md mx-auto">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <span className="text-4xl">⚠️</span>
              </div>
              <p className="text-xl font-bold text-amber-800 dark:text-amber-200">
                Dados de evolução temporariamente indisponíveis
              </p>
              <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                As funções de evolução estão sendo ajustadas no servidor.
              </p>
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Esta funcionalidade será reativada em breve.
              </p>
            </div>
          </div>
        )}
      </div>
      {/* Cards com estatísticas - Design Premium */}
      {dadosAtivos.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total de Corridas */}
          <div className="group relative rounded-2xl border border-white/20 bg-white/90 backdrop-blur-sm p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-white/30 dark:border-white/10 dark:bg-slate-900/90 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-blue-100/30 to-indigo-100/20 dark:from-blue-950/20 dark:via-blue-900/10 dark:to-indigo-950/10"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  Total de Corridas
                </p>
                <p className="mt-3 text-4xl font-black text-blue-900 dark:text-blue-100 tracking-tight">
                  {dadosAtivos.reduce((sum, d) => sum + ((d as any).corridas_completadas || (d as any).total_corridas || 0), 0).toLocaleString('pt-BR')}
                </p>
                <p className="mt-1 text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">
                  {dadosAtivos.length} {viewMode === 'mensal' ? 'meses' : 'semanas'} analisadas
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl shadow-lg group-hover:scale-110 transition-transform">
                🚗
              </div>
            </div>
          </div>

          {/* Total de Horas */}
          <div className="group relative rounded-2xl border border-white/20 bg-white/90 backdrop-blur-sm p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-white/30 dark:border-white/10 dark:bg-slate-900/90 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-emerald-100/30 to-teal-100/20 dark:from-emerald-950/20 dark:via-emerald-900/10 dark:to-teal-950/10"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Total de Horas
                </p>
                <p className="mt-3 text-4xl font-black text-emerald-900 dark:text-emerald-100 tracking-tight">
                  {formatarHorasParaHMS(dadosAtivos.reduce((sum, d) => sum + d.total_segundos, 0) / 3600)}
                </p>
                <p className="mt-1 text-xs text-emerald-600/70 dark:text-emerald-400/70 font-medium">
                  Tempo total trabalhado
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-3xl shadow-lg group-hover:scale-110 transition-transform">
                ⏱️
              </div>
            </div>
          </div>

          {/* Média de Corridas */}
          <div className="group relative rounded-2xl border border-white/20 bg-white/90 backdrop-blur-sm p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-white/30 dark:border-white/10 dark:bg-slate-900/90 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-purple-100/30 to-pink-100/20 dark:from-purple-950/20 dark:via-purple-900/10 dark:to-pink-950/10"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                  Média {viewMode === 'mensal' ? 'Mensal' : 'Semanal'}
                </p>
                <p className="mt-3 text-4xl font-black text-purple-900 dark:text-purple-100 tracking-tight">
                  {dadosAtivos.length > 0 ? (dadosAtivos.reduce((sum, d) => sum + ((d as any).corridas_completadas || (d as any).total_corridas || 0), 0) / dadosAtivos.length).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}
                </p>
                <p className="mt-1 text-xs text-purple-600/70 dark:text-purple-400/70 font-medium">
                  Corridas por período
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-3xl shadow-lg group-hover:scale-110 transition-transform">
                📊
              </div>
            </div>
          </div>

          {/* Período */}
          <div className="group relative rounded-2xl border border-white/20 bg-white/90 backdrop-blur-sm p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-white/30 dark:border-white/10 dark:bg-slate-900/90 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-amber-100/30 to-orange-100/20 dark:from-amber-950/20 dark:via-amber-900/10 dark:to-orange-950/10"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  Período Analisado
                </p>
                <p className="mt-3 text-4xl font-black text-amber-900 dark:text-amber-100 tracking-tight">
                  {anoSelecionado}
                </p>
                <p className="mt-1 text-xs text-amber-600/70 dark:text-amber-400/70 font-medium">
                  {dadosAtivos.length} {viewMode === 'mensal' ? 'meses' : 'semanas'} registradas
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-3xl shadow-lg group-hover:scale-110 transition-transform">
                📅
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EvolucaoView;
