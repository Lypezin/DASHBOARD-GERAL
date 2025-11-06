import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { EvolucaoMensal, EvolucaoSemanal, UtrSemanal } from '@/types'; // Supondo que os tipos estarão em @/types
import { formatarHorasParaHMS } from '@/utils/formatters'; // Supondo que a função estará em @/utils/formatters

const IS_DEV = process.env.NODE_ENV === 'development';

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
  const isSemanal = viewMode === 'semanal';

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
    return viewMode === 'mensal' 
      ? [...evolucaoMensal].filter(d => d.ano === anoSelecionado).sort((a, b) => {
        // Ordenar por ano e mês
        if (a.ano !== b.ano) return a.ano - b.ano;
        return a.mes - b.mes;
      })
      : [...evolucaoSemanal].filter(d => d.ano === anoSelecionado).sort((a, b) => {
        // Ordenar por ano e semana
        if (a.ano !== b.ano) return a.ano - b.ano;
        return a.semana - b.semana;
      });
  }, [viewMode, evolucaoMensal, evolucaoSemanal, anoSelecionado]);

  // Dados de UTR filtrados por ano
  const dadosUtrAtivos = useMemo(() => {
    return utrSemanal
      .filter(d => d.ano === anoSelecionado)
      .sort((a, b) => {
        if (a.ano !== b.ano) return a.ano - b.ano;
        return a.semana - b.semana;
      });
  }, [utrSemanal, anoSelecionado]);

  // Função para traduzir meses para português
  const traduzirMes = useCallback((mesNome: string): string => {
    const meses: Record<string, string> = {
      'January': 'Janeiro', 'February': 'Fevereiro', 'March': 'Março',
      'April': 'Abril', 'May': 'Maio', 'June': 'Junho', 'July': 'Julho',
      'August': 'Agosto', 'September': 'Setembro', 'October': 'Outubro',
      'November': 'Novembro', 'December': 'Dezembro',
    };
    return meses[mesNome.trim()] || mesNome;
  }, []);

  // Helper function para obter configuração de métrica
  const getMetricConfig = useCallback((metric: 'ofertadas' | 'aceitas' | 'completadas' | 'rejeitadas' | 'horas' | 'utr'): {
    labels: string[]; data: number[]; label: string; borderColor: string;
    backgroundColor: any; pointColor: string; yAxisID: string; useUtrData: boolean;
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
  }, [dadosAtivos, dadosUtrAtivos, viewMode, segundosParaHoras, traduzirMes, gradientPurple, gradientRed]);

  // Dados do gráfico com múltiplas métricas (otimizado com useMemo)
  const chartData = useMemo(() => {
    if (selectedMetrics.size === 0) return { labels: [], datasets: [] };
    const hasData = dadosAtivos.length > 0 || dadosUtrAtivos.length > 0;
    if (!hasData) return { labels: [], datasets: [] };
    
    try {
        const metricConfigs = Array.from(selectedMetrics)
            .map(metric => getMetricConfig(metric))
            .filter(config => config !== null) as Array<NonNullable<ReturnType<typeof getMetricConfig>>>;

        if (metricConfigs.length === 0) return { labels: [], datasets: [] };

        const utrConfig = metricConfigs.find(c => c.useUtrData);
        const baseLabels = utrConfig?.labels || metricConfigs[0].labels;

        if (!baseLabels || baseLabels.length === 0) return { labels: [], datasets: [] };
        
        const datasets = metricConfigs.map((config) => {
            let data = config.data || [];
            if (!config.useUtrData && utrConfig && baseLabels.length !== config.data.length) {
                const labelMap = new Map(config.labels.map((label, idx) => [label, config.data[idx]]));
                data = baseLabels.map(label => labelMap.get(label) || 0);
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
            };
        });

        return { labels: baseLabels, datasets };
    } catch (error) {
        if (IS_DEV) console.error('Erro ao criar chartData:', error);
        return { labels: [], datasets: [] };
    }
  }, [selectedMetrics, getMetricConfig, isSemanal, dadosAtivos, dadosUtrAtivos]);
  
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 12, right: 16, bottom: 8, left: 12 } },
    animation: { duration: 300, easing: 'easeOutCubic' as const, delay: 0 },
    interaction: { mode: 'index' as const, intersect: false, axis: 'x' as const },
    plugins: {
        legend: {
            position: 'top' as const,
            align: 'center' as const,
            labels: {
                font: { size: 14, weight: 'bold' as const, family: "'Inter', 'system-ui', sans-serif" },
                padding: 16, usePointStyle: true, pointStyle: 'circle', boxWidth: 12, boxHeight: 12,
                color: isDarkMode ? 'rgb(226, 232, 240)' : 'rgb(51, 65, 85)',
            },
        },
        tooltip: {
            enabled: true, backgroundColor: 'rgba(15, 23, 42, 0.97)', titleColor: 'rgba(255, 255, 255, 1)',
            bodyColor: 'rgba(226, 232, 240, 1)', padding: 20,
            titleFont: { size: 16, weight: 'bold' as const, family: "'Inter', 'system-ui', sans-serif" },
            bodyFont: { size: 15, weight: '600' as any, family: "'Inter', 'system-ui', sans-serif" },
            borderColor: 'rgba(148, 163, 184, 0.5)', borderWidth: 2, cornerRadius: 12,
            displayColors: true, boxWidth: 14, boxHeight: 14, boxPadding: 6, usePointStyle: true,
            callbacks: {
                title: (context: any) => {
                    const label = context[0]?.label || '';
                    const icon = isSemanal ? '📊' : '📅';
                    const prefix = isSemanal ? 'Semana' : 'Mês de';
                    const cleanLabel = isSemanal ? label.replace('S','') : label;
                    return `${icon} ${prefix} ${cleanLabel}`;
                },
                label: (context: any) => {
                    let label = context.dataset.label || '';
                    if (label) label += ': ';
                    if (context.dataset.label.includes('Horas')) {
                        label += formatarHorasParaHMS(context.parsed.y);
                    } else if (context.dataset.label.includes('UTR')) {
                        label += context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    } else {
                        label += context.parsed.y.toLocaleString('pt-BR');
                    }
                    return label;
                },
            },
        },
    },
    scales: {
        y: {
            type: 'linear' as const, display: true, position: 'left' as const,
            title: { display: true, text: 'Valores', font: { size: 13, weight: 'bold' as const }, color: isDarkMode ? 'rgb(226, 232, 240)' : 'rgb(51, 65, 85)' },
            grid: { color: isDarkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.15)', },
            border: { display: false },
            ticks: { color: isDarkMode ? 'rgb(226, 232, 240)' : 'rgb(51, 65, 85)', font: { size: 12, weight: 'bold' as const } },
        },
        x: {
            grid: { display: false },
            border: { display: false },
            ticks: {
                maxTicksLimit: isSemanal ? 52 : 12, autoSkip: dadosAtivos.length <= (isSemanal ? 52 : 12) ? false : true,
                maxRotation: isSemanal ? 45 : 0, minRotation: isSemanal ? 45 : 0,
                font: { size: isSemanal ? 10 : 12, weight: '700' as any },
                color: isDarkMode ? 'rgb(203, 213, 225)' : 'rgb(71, 85, 105)', padding: 10,
            },
        },
    },
    elements: {
        line: { borderCapStyle: 'round' as const, borderJoinStyle: 'round' as const },
        point: { hoverBorderWidth: 4, radius: isSemanal ? 4 : 6, hoverRadius: isSemanal ? 8 : 10 },
    },
  }), [isSemanal, dadosAtivos.length, dadosUtrAtivos.length, isDarkMode, selectedMetrics.size]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Skeleton Loader */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-t-xl animate-pulse"></div>
        </div>
        <div className="h-[550px] rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
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
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ano:</label>
                <select value={anoSelecionado} onChange={(e) => onAnoChange(Number(e.target.value))} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                  {anosDisponiveis.map((ano) => ( <option key={ano} value={ano}>{ano}</option> ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setViewMode('mensal')} className={`px-4 py-2 text-sm font-semibold rounded-lg ${viewMode === 'mensal' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                  📅 Mensal
                </button>
                <button onClick={() => setViewMode('semanal')} className={`px-4 py-2 text-sm font-semibold rounded-lg ${viewMode === 'semanal' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                  📊 Semanal
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4">
            <div className="flex flex-wrap gap-2">
                {(['ofertadas', 'aceitas', 'completadas', 'rejeitadas', 'horas'] as const).map(metric => (
                    <label key={metric} className="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer">
                        <input type="checkbox" checked={selectedMetrics.has(metric)} onChange={e => {
                            const newSet = new Set(selectedMetrics);
                            if (e.target.checked) newSet.add(metric); else newSet.delete(metric);
                            if (newSet.size === 0) newSet.add('completadas');
                            setSelectedMetrics(newSet);
                        }}/>
                        {metric.charAt(0).toUpperCase() + metric.slice(1)}
                    </label>
                ))}
                {viewMode === 'semanal' && (
                    <label className="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer">
                        <input type="checkbox" checked={selectedMetrics.has('utr')} disabled={dadosUtrAtivos.length === 0} onChange={e => {
                            const newSet = new Set(selectedMetrics);
                            if (e.target.checked) newSet.add('utr'); else newSet.delete('utr');
                            if (newSet.size === 0) newSet.add('completadas');
                            setSelectedMetrics(newSet);
                        }}/>
                        UTR
                    </label>
                )}
            </div>
        </div>
      </div>
      
      <div className="relative rounded-2xl border p-8 shadow-xl">
        {chartData.datasets.length > 0 && chartData.labels.length > 0 ? (
          <div className="relative z-10">
            <h4 className="text-xl font-bold">Evolução de Métricas</h4>
            <div className="relative h-[550px] w-full">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        ) : (
          <div className="flex h-[500px] items-center justify-center">
            <p>Nenhum dado disponível para {anoSelecionado}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EvolucaoView;
