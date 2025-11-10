import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { EvolucaoMensal, EvolucaoSemanal, UtrSemanal } from '@/types';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { registerChartJS } from '@/lib/chartConfig';

const IS_DEV = process.env.NODE_ENV === 'development';
// Forçar logs sempre para debug
const FORCE_LOGS = true;

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
  
  // LOG INICIAL - verificar dados recebidos
  useEffect(() => {
    if (FORCE_LOGS) {
      console.log('🔍 [EVOLUÇÃO] Componente montado/renderizado:', {
        loading,
        evolucaoMensalLength: Array.isArray(evolucaoMensal) ? evolucaoMensal.length : 0,
        evolucaoSemanalLength: Array.isArray(evolucaoSemanal) ? evolucaoSemanal.length : 0,
        utrSemanalLength: Array.isArray(utrSemanal) ? utrSemanal.length : 0,
        anoSelecionado,
        viewMode,
        selectedMetrics: Array.from(selectedMetrics),
        firstMensal: Array.isArray(evolucaoMensal) && evolucaoMensal.length > 0 ? evolucaoMensal[0] : null,
        firstSemanal: Array.isArray(evolucaoSemanal) && evolucaoSemanal.length > 0 ? evolucaoSemanal[0] : null
      });
    }
  }, [loading, evolucaoMensal, evolucaoSemanal, utrSemanal, anoSelecionado, viewMode, selectedMetrics]);
  
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
      
      const result = viewMode === 'mensal' 
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
      
      // LOG FORÇADO - sempre mostrar
      if (FORCE_LOGS) {
        console.log('🔍 [EVOLUÇÃO] dadosAtivos processados:', {
          viewMode,
          anoSelecionado,
          mensalArrayLength: mensalArray.length,
          semanalArrayLength: semanalArray.length,
          resultLength: result.length,
          firstItem: result.length > 0 ? result[0] : null,
          allItems: result.slice(0, 5)
        });
      }
      
      return result;
    } catch (error) {
      console.error('❌ [EVOLUÇÃO] Erro ao processar dadosAtivos:', error);
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

  // Criar baseLabels uma vez para todas as métricas (garantir consistência)
  const baseLabels = useMemo(() => {
    // Filtrar dados com semana/mês válidos e gerar labels
    const labels = viewMode === 'mensal'
      ? dadosAtivos
          .filter(d => d && (d as EvolucaoMensal).mes != null && (d as EvolucaoMensal).mes_nome)
          .sort((a, b) => {
            if ((a as EvolucaoMensal).ano !== (b as EvolucaoMensal).ano) {
              return (a as EvolucaoMensal).ano - (b as EvolucaoMensal).ano;
            }
            return (a as EvolucaoMensal).mes - (b as EvolucaoMensal).mes;
          })
          .map(d => traduzirMes((d as EvolucaoMensal).mes_nome))
      : dadosAtivos
          .filter(d => d && (d as EvolucaoSemanal).semana != null && (d as EvolucaoSemanal).semana !== undefined)
          .sort((a, b) => {
            if ((a as EvolucaoSemanal).ano !== (b as EvolucaoSemanal).ano) {
              return (a as EvolucaoSemanal).ano - (b as EvolucaoSemanal).ano;
            }
            return (a as EvolucaoSemanal).semana - (b as EvolucaoSemanal).semana;
          })
          .map(d => {
            const semana = (d as EvolucaoSemanal).semana;
            return semana != null && semana !== undefined ? `S${semana}` : null;
          })
          .filter((label): label is string => label !== null);
    
    if (IS_DEV && viewMode === 'semanal') {
      const semanas = dadosAtivos
        .filter(d => d && (d as EvolucaoSemanal).semana != null && (d as EvolucaoSemanal).semana !== undefined)
        .map(d => (d as EvolucaoSemanal).semana)
        .filter((s): s is number => s != null && s !== undefined)
        .sort((a, b) => a - b);
      console.log('📊 Semanas processadas:', semanas.length, 'semanas:', semanas);
      console.log('📊 Semana mínima:', semanas.length > 0 ? Math.min(...semanas) : 'N/A');
      console.log('📊 Semana máxima:', semanas.length > 0 ? Math.max(...semanas) : 'N/A');
      console.log('📊 Labels gerados:', labels.length, 'labels:', labels);
    }
    
    return labels;
  }, [dadosAtivos, viewMode, traduzirMes]);

  // Criar um mapa de dados ordenados por label para facilitar o acesso
  const dadosPorLabel = useMemo(() => {
    const map = new Map<string, any>();
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
          const label = traduzirMes((d as EvolucaoMensal).mes_nome);
          map.set(label, d);
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
            map.set(`S${semana}`, d);
          }
        });
    }
    
    // LOG FORÇADO - sempre mostrar
    if (FORCE_LOGS) {
      const firstKey = map.size > 0 ? Array.from(map.keys())[0] : null;
      const firstValue = firstKey ? map.get(firstKey) : null;
      console.log('🔍 [EVOLUÇÃO] dadosPorLabel criado:', {
        viewMode,
        totalEntries: map.size,
        keys: Array.from(map.keys()).slice(0, 10),
        firstEntry: firstValue ? {
          key: firstKey,
          value: firstValue,
          keys: Object.keys(firstValue),
          corridas_ofertadas: (firstValue as any)?.corridas_ofertadas,
          corridas_aceitas: (firstValue as any)?.corridas_aceitas,
          corridas_completadas: (firstValue as any)?.corridas_completadas,
          corridas_rejeitadas: (firstValue as any)?.corridas_rejeitadas,
        } : null
      });
    }
    
    return map;
  }, [dadosAtivos, viewMode, traduzirMes]);

  // Helper function para obter configuração de métrica
  const getMetricConfig = useCallback((metric: 'ofertadas' | 'aceitas' | 'completadas' | 'rejeitadas' | 'horas' | 'utr'): {
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
          data: baseLabels.map(label => {
            const d = dadosPorLabel.get(label);
            return d ? segundosParaHoras(d.total_segundos) : null;
          }),
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
        const ofertadasData = baseLabels.map(label => {
          const d = dadosPorLabel.get(label);
          if (!d) {
            if (FORCE_LOGS && label === baseLabels[0]) {
              console.warn('⚠️ [EVOLUÇÃO] Ofertadas - dado não encontrado para label:', label);
            }
            return null;
          }
          // Acessar diretamente a propriedade corridas_ofertadas
          const value = (d as any).corridas_ofertadas;
          if (FORCE_LOGS && label === baseLabels[0]) {
            console.log('🔍 [EVOLUÇÃO] Ofertadas - primeiro dado:', { 
              label, 
              d, 
              value,
              type: typeof value,
              keys: Object.keys(d),
              corridas_ofertadas: (d as any).corridas_ofertadas,
              corridas_aceitas: (d as any).corridas_aceitas,
              corridas_completadas: (d as any).corridas_completadas,
              corridas_rejeitadas: (d as any).corridas_rejeitadas
            });
          }
          // Retornar número válido ou null
          if (value == null || value === undefined) return null;
          const numValue = Number(value);
          return isNaN(numValue) || !isFinite(numValue) ? null : numValue;
        });
        if (FORCE_LOGS) {
          const nonNull = ofertadasData.filter(v => v != null);
          const nonZero = ofertadasData.filter(v => v != null && v !== 0);
          console.log('🔍 [EVOLUÇÃO] Ofertadas - resumo:', {
            total: ofertadasData.length,
            nonNull: nonNull.length,
            nonZero: nonZero.length,
            zeros: ofertadasData.filter(v => v === 0).length,
            sample: ofertadasData.slice(0, 10),
            allValues: ofertadasData
          });
        }
        return {
          labels: baseLabels,
          data: ofertadasData,
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
        const aceitasData = baseLabels.map(label => {
          const d = dadosPorLabel.get(label);
          if (!d) {
            if (FORCE_LOGS && label === baseLabels[0]) {
              console.warn('⚠️ [EVOLUÇÃO] Aceitas - dado não encontrado para label:', label);
            }
            return null;
          }
          // Acessar diretamente a propriedade corridas_aceitas
          const value = (d as any).corridas_aceitas;
          if (FORCE_LOGS && label === baseLabels[0]) {
            console.log('🔍 [EVOLUÇÃO] Aceitas - primeiro dado:', { 
              label, 
              d, 
              value,
              type: typeof value,
              keys: Object.keys(d),
              corridas_aceitas: (d as any).corridas_aceitas
            });
          }
          // Retornar número válido ou null
          if (value == null || value === undefined) return null;
          const numValue = Number(value);
          return isNaN(numValue) || !isFinite(numValue) ? null : numValue;
        });
        if (FORCE_LOGS) {
          const nonNull = aceitasData.filter(v => v != null);
          const nonZero = aceitasData.filter(v => v != null && v !== 0);
          console.log('🔍 [EVOLUÇÃO] Aceitas - resumo:', {
            total: aceitasData.length,
            nonNull: nonNull.length,
            nonZero: nonZero.length,
            zeros: aceitasData.filter(v => v === 0).length,
            sample: aceitasData.slice(0, 10),
            allValues: aceitasData
          });
        }
        return {
          labels: baseLabels,
          data: aceitasData,
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
        const rejeitadasData = baseLabels.map(label => {
          const d = dadosPorLabel.get(label);
          if (!d) {
            if (FORCE_LOGS && label === baseLabels[0]) {
              console.warn('⚠️ [EVOLUÇÃO] Rejeitadas - dado não encontrado para label:', label);
            }
            return null;
          }
          // Acessar diretamente a propriedade corridas_rejeitadas
          let value = (d as any).corridas_rejeitadas;
          
          // FALLBACK: Se rejeitadas está zerado ou null, calcular como ofertadas - aceitas
          // IMPORTANTE: Rejeitadas = Ofertadas - Aceitas (lógica de negócio)
          if ((value == null || value === 0 || Number(value) === 0) && 
              (d as any).corridas_ofertadas != null && 
              (d as any).corridas_aceitas != null) {
            const ofertadas = Number((d as any).corridas_ofertadas) || 0;
            const aceitas = Number((d as any).corridas_aceitas) || 0;
            const calculado = ofertadas - aceitas;
            
            // SEMPRE usar o cálculo se houver dados de ofertadas e aceitas
            // Mesmo que seja 0, isso é o valor correto se ofertadas === aceitas
            if (ofertadas > 0 || aceitas > 0) {
              value = calculado;
              if (FORCE_LOGS && label === baseLabels[0]) {
                console.log('🔍 [EVOLUÇÃO] Rejeitadas - usando cálculo fallback:', {
                  label,
                  original_rejeitadas: (d as any).corridas_rejeitadas,
                  ofertadas,
                  aceitas,
                  calculado,
                  motivo: calculado === 0 ? 'Ofertadas === Aceitas (todas foram aceitas)' : 'Rejeitadas calculadas como Ofertadas - Aceitas'
                });
              }
            }
          }
          
          if (FORCE_LOGS && label === baseLabels[0]) {
            console.log('🔍 [EVOLUÇÃO] Rejeitadas - primeiro dado:', { 
              label, 
              d, 
              value,
              type: typeof value,
              keys: Object.keys(d),
              corridas_rejeitadas: (d as any).corridas_rejeitadas,
              corridas_ofertadas: (d as any).corridas_ofertadas,
              corridas_aceitas: (d as any).corridas_aceitas,
              corridas_completadas: (d as any).corridas_completadas
            });
          }
          // Retornar número válido ou null
          // IMPORTANTE: 0 é um valor válido e deve ser retornado como 0, não null
          if (value == null || value === undefined) return null;
          const numValue = Number(value);
          // Se for NaN ou não finito, retornar null, caso contrário retornar o valor (incluindo 0)
          return isNaN(numValue) || !isFinite(numValue) ? null : numValue;
        });
        if (FORCE_LOGS) {
          const nonNull = rejeitadasData.filter(v => v != null);
          const nonZero = rejeitadasData.filter(v => v != null && v !== 0);
          const zeroValues = rejeitadasData.filter(v => v === 0);
          
          // Verificar se há diferença entre ofertadas e aceitas para entender por que rejeitadas está zerado
          const primeiroDado = dadosPorLabel.get(baseLabels[0]);
          const ofertadasPrimeiro = primeiroDado ? Number((primeiroDado as any).corridas_ofertadas) || 0 : 0;
          const aceitasPrimeiro = primeiroDado ? Number((primeiroDado as any).corridas_aceitas) || 0 : 0;
          const diferencaPrimeiro = ofertadasPrimeiro - aceitasPrimeiro;
          
          console.log('🔍 [EVOLUÇÃO] Rejeitadas - resumo completo:', {
            total: rejeitadasData.length,
            nonNull: nonNull.length,
            nonZero: nonZero.length,
            zeros: zeroValues.length,
            sample: rejeitadasData.slice(0, 10),
            allValues: rejeitadasData,
            minValue: nonNull.length > 0 ? Math.min(...nonNull as number[]) : null,
            maxValue: nonNull.length > 0 ? Math.max(...nonNull as number[]) : null,
            analise_primeiro_periodo: {
              label: baseLabels[0],
              ofertadas: ofertadasPrimeiro,
              aceitas: aceitasPrimeiro,
              diferenca: diferencaPrimeiro,
              rejeitadas_original: primeiroDado ? (primeiroDado as any).corridas_rejeitadas : null,
              rejeitadas_calculada: rejeitadasData[0]
            }
          });
          
          if (nonZero.length === 0 && zeroValues.length > 0) {
            console.warn('⚠️ [EVOLUÇÃO] ATENÇÃO: Todas as rejeitadas estão em 0!', {
              motivo_possivel: diferencaPrimeiro === 0 
                ? 'Ofertadas === Aceitas, então não há rejeitadas (isso pode ser normal se todas as corridas ofertadas foram aceitas)'
                : 'Rejeitadas está zerado no banco de dados, mas há diferença entre ofertadas e aceitas',
              diferenca_media: diferencaPrimeiro
            });
          }
        }
        return {
          labels: baseLabels,
          data: rejeitadasData,
          label: '❌ Corridas Rejeitadas',
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: gradientRed,
          pointColor: 'rgb(239, 68, 68)',
          yAxisID: 'y',
          useUtrData: false,
        };
      case 'completadas':
      default:
        const completadasData = baseLabels.map(label => {
          const d = dadosPorLabel.get(label);
          if (!d) {
            if (FORCE_LOGS && label === baseLabels[0]) {
              console.warn('⚠️ [EVOLUÇÃO] Completadas - dado não encontrado para label:', label);
            }
            return null;
          }
          // Acessar diretamente a propriedade corridas_completadas ou total_corridas
          const value = (d as any).corridas_completadas ?? (d as any).total_corridas;
          if (FORCE_LOGS && label === baseLabels[0]) {
            console.log('🔍 [EVOLUÇÃO] Completadas - primeiro dado:', { 
              label, 
              d, 
              value,
              type: typeof value,
              keys: Object.keys(d),
              corridas_completadas: (d as any).corridas_completadas,
              total_corridas: (d as any).total_corridas
            });
          }
          // Retornar número válido ou null
          if (value == null || value === undefined) return null;
          const numValue = Number(value);
          return isNaN(numValue) || !isFinite(numValue) ? null : numValue;
        });
        if (FORCE_LOGS) {
          const nonNull = completadasData.filter(v => v != null);
          const nonZero = completadasData.filter(v => v != null && v !== 0);
          console.log('🔍 [EVOLUÇÃO] Completadas - resumo:', {
            total: completadasData.length,
            nonNull: nonNull.length,
            nonZero: nonZero.length,
            zeros: completadasData.filter(v => v === 0).length,
            sample: completadasData.slice(0, 10),
            allValues: completadasData
          });
        }
        return {
          labels: baseLabels,
          data: completadasData,
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
  }, [baseLabels, dadosPorLabel, dadosUtrAtivos, viewMode, segundosParaHoras, gradientPurple, gradientRed]);

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

      // Usar labels da primeira métrica (ou da UTR se estiver presente, pois pode ter labels diferentes)
      // IMPORTANTE: Todas as métricas já usam o mesmo baseLabels definido no componente
      // Mas precisamos garantir que os labels sejam consistentes
      const utrConfig = metricConfigs.find(c => c.useUtrData);
      const chartBaseLabels = utrConfig?.labels || baseLabels; // Usar baseLabels do componente

      if (!chartBaseLabels || chartBaseLabels.length === 0) {
        return {
          labels: [],
          datasets: [],
        };
      }

      // PRIMEIRO: Calcular o valor máximo global de todos os datasets (exceto Horas/UTR que usam eixo diferente)
      // Isso é necessário para calcular offsets consistentes que separem visualmente as linhas
      let globalMaxValue = 0;
      const datasetsComEixoY = metricConfigs
        .map((config, idx) => {
          let data: (number | null)[] = [];
          if (config.useUtrData && config.labels.length !== chartBaseLabels.length) {
            const labelMap = new Map<string, number | null>();
            config.labels.forEach((label, i) => {
              const value = config.data[i];
              labelMap.set(label, value != null && !isNaN(value) && isFinite(value) ? Number(value) : null);
            });
            data = chartBaseLabels.map(label => labelMap.get(label) ?? null);
          } else {
            if (config.labels.length === chartBaseLabels.length && 
                config.labels.every((label, i) => label === chartBaseLabels[i])) {
              data = (config.data || []) as (number | null)[];
            } else {
              const labelMap = new Map<string, number | null>();
              config.labels.forEach((label, i) => {
                const value = config.data[i];
                labelMap.set(label, value != null && !isNaN(value) && isFinite(value) ? Number(value) : null);
              });
              data = chartBaseLabels.map(label => labelMap.get(label) ?? null);
            }
          }
          return { data, yAxisID: config.yAxisID, index: idx };
        })
        .filter(d => d.yAxisID === 'y'); // Apenas datasets que usam o eixo Y principal
      
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
      
      if (FORCE_LOGS && globalMaxValue > 0) {
        console.log('🔍 [EVOLUÇÃO] Valor máximo global para cálculo de offset:', globalMaxValue);
      }

      // Criar datasets para cada métrica selecionada
      const datasets = metricConfigs.map((config, index) => {
        // IMPORTANTE: Garantir que os dados estejam sempre alinhados com chartBaseLabels
        let data: (number | null)[] = [];
        
        // Se é UTR e tem labels diferentes, manter dados originais mas alinhá-los
        if (config.useUtrData && config.labels.length !== chartBaseLabels.length) {
          // Criar mapa de label -> valor para UTR
          const labelMap = new Map<string, number | null>();
          config.labels.forEach((label, idx) => {
            const value = config.data[idx];
            labelMap.set(label, value != null && !isNaN(value) && isFinite(value) ? Number(value) : null);
          });
          // Mapear para chartBaseLabels
          data = chartBaseLabels.map(label => {
            const value = labelMap.get(label);
            return value != null ? value : null;
          });
        } else {
          // Para outras métricas, garantir alinhamento correto
          if (config.labels.length === chartBaseLabels.length && 
              config.labels.every((label, idx) => label === chartBaseLabels[idx])) {
            // Labels já estão alinhados, usar dados diretamente
            data = (config.data || []) as (number | null)[];
          } else {
            // Labels não estão alinhados, criar mapa e realinhar
            const labelMap = new Map<string, number | null>();
            config.labels.forEach((label, idx) => {
              const value = config.data[idx];
              labelMap.set(label, value != null && !isNaN(value) && isFinite(value) ? Number(value) : null);
            });
            // Mapear para chartBaseLabels
            data = chartBaseLabels.map(label => {
              const value = labelMap.get(label);
              return value != null ? value : null;
            });
          }
        }
        
        // Garantir que o tamanho está correto
        if (data.length !== chartBaseLabels.length) {
          if (IS_DEV) {
            console.warn(`⚠️ Dataset ${config.label} tem tamanho incorreto: ${data.length} vs ${chartBaseLabels.length}`);
          }
          // Preencher ou truncar para corresponder
          if (data.length < chartBaseLabels.length) {
            data = [...data, ...Array(chartBaseLabels.length - data.length).fill(null)];
          } else {
            data = data.slice(0, chartBaseLabels.length);
          }
        }
        
        // Garantir que todos os valores são números válidos ou null
        // IMPORTANTE: Não converter 0 para null, pois 0 é um valor válido
        data = data.map((value: any) => {
          if (value == null || value === undefined) {
            return null; // Chart.js vai tratar null como gap
          }
          const numValue = Number(value);
          // Verificar se é um número válido
          if (isNaN(numValue) || !isFinite(numValue)) {
            return null;
          }
          // Retornar o valor numérico (incluindo 0, que é válido)
          return numValue;
        });
        
        // ADICIONAR OFFSET VISUAL para linhas com valores idênticos
        // Isso permite ver linhas separadas mesmo quando os valores são iguais
        // Usar o valor máximo global para calcular offsets consistentes
        if (data.length > 0 && data.some(v => v != null) && config.yAxisID === 'y' && globalMaxValue > 0) {
          // Offset baseado no índice para diferenciar visualmente
          // Usar 3% do valor máximo global como offset base para melhor visibilidade
          // Isso garante que as linhas sejam claramente separadas mesmo quando valores são idênticos
          const baseOffset = globalMaxValue * 0.03; // 3% do valor máximo global
          const offsets = [
            0,                    // Completadas: sem offset (linha base)
            baseOffset * 0.4,     // Ofertadas: +1.2% do máximo global
            baseOffset * 0.8,     // Aceitas: +2.4% do máximo global
            0,                     // Rejeitadas: sem offset
            0                      // Horas: sem offset (usa eixo diferente)
          ];
          const offset = offsets[index] || 0;
          
          // Aplicar offset apenas se o valor não for zero (para não mover a linha de rejeitadas quando for 0)
          if (offset > 0) {
            data = data.map((value: number | null) => {
              if (value == null || value === 0) return value;
              return value + offset;
            });
            
            if (FORCE_LOGS && offset > 0) {
              console.log(`🔍 [EVOLUÇÃO] Offset aplicado a ${config.label}: ${offset.toFixed(2)} (${((offset / globalMaxValue) * 100).toFixed(2)}% do máximo global)`);
            }
          }
        }
        
        // LOG FORÇADO - sempre mostrar
        if (FORCE_LOGS) {
          const datasetLabel = config.label;
          const nonNullValues = data.filter(v => v != null);
          const zeroValues = data.filter(v => v === 0);
          const nonZeroValues = data.filter(v => v != null && v !== 0);
          console.log(`🔍 [EVOLUÇÃO] Dataset ${datasetLabel}:`, {
            total: data.length,
            nonNull: nonNullValues.length,
            zeros: zeroValues.length,
            nonZero: nonZeroValues.length,
            hasData: nonNullValues.length > 0,
            hasNonZeroData: nonZeroValues.length > 0,
            sample: data.slice(0, 10),
            allValues: data
          });
        }

        // IMPORTANTE: Sempre renderizar o dataset, mesmo se todos os valores forem 0
        // O Chart.js deve mostrar a linha mesmo com valores zero
        const hasValidData = data.some(v => v != null && v !== undefined);
        
        if (FORCE_LOGS) {
          console.log(`🔍 [EVOLUÇÃO] Dataset ${config.label} - hasValidData:`, hasValidData, 'data sample:', data.slice(0, 5));
          console.log(`🔍 [EVOLUÇÃO] Dataset ${config.label} - valores completos:`, data);
        }

        // IMPORTANTE: Sempre criar o dataset, mesmo se todos os valores forem 0 ou null
        // O Chart.js deve renderizar a linha mesmo com valores zero
        // Usar ordem diferente para cada dataset para garantir que todos apareçam
        const order = index; // Ordem baseada no índice para garantir renderização
        
        // Para linhas com valores idênticos, usar estilos MUITO diferentes para diferenciá-las
        // Usar borderWidth e pointRadius diferentes para cada linha para garantir visibilidade
        const borderWidths = [5, 4, 4, 3, 4]; // Larguras diferentes e mais grossas
        const pointRadii = isSemanal ? [7, 6, 6, 5, 6] : [10, 9, 9, 8, 9]; // Pontos maiores e diferentes
        const borderWidth = borderWidths[index] || 4;
        const pointRadius = pointRadii[index] || (isSemanal ? 6 : 9);
        
        // Usar estilos de linha MUITO diferentes para diferenciar quando valores são iguais
        // Padrões mais distintos para melhor visibilidade
        const dashPatterns = [
          [], // Sólida (Completadas)
          [8, 4], // Tracejada média (Aceitas)
          [15, 5], // Tracejada longa (Ofertadas)
          [3, 3], // Pontilhada curta (Rejeitadas)
          [], // Sólida (Horas)
        ];
        
        // Usar opacidades ligeiramente diferentes para linhas sobrepostas
        const opacities = [1.0, 0.95, 0.90, 1.0, 1.0]; // Pequenas diferenças de opacidade
        const opacity = opacities[index] || 1.0;
        
        // Função para ajustar opacidade de cor (suporta rgba, rgb e hex)
        const adjustColorOpacity = (color: string, newOpacity: number): string => {
          // Se já é rgba, substituir opacidade
          if (color.startsWith('rgba(')) {
            return color.replace(/,\s*[\d.]+\)$/, `, ${newOpacity})`);
          }
          // Se é rgb, converter para rgba
          if (color.startsWith('rgb(')) {
            return color.replace('rgb(', 'rgba(').replace(')', `, ${newOpacity})`);
          }
          // Se é hex, converter para rgba (simplificado - assume formato #RRGGBB)
          if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${newOpacity})`;
          }
          // Se não conseguir converter, retornar original
          return color;
        };
        
        // Ajustar cor da borda com opacidade para melhor diferenciação
        const borderColorWithOpacity = adjustColorOpacity(config.borderColor, opacity);
        const pointColorWithOpacity = adjustColorOpacity(config.pointColor, opacity);
        
        return {
          label: config.label,
          data,
          borderColor: borderColorWithOpacity, // Usar cor com opacidade ajustada
          backgroundColor: config.backgroundColor,
          yAxisID: config.yAxisID,
          type: 'line' as const, // Forçar tipo line explicitamente
          tension: 0.4,
          cubicInterpolationMode: 'monotone' as const,
          pointRadius: pointRadius,
          pointHoverRadius: isSemanal ? 12 : 14, // Aumentado para melhor visibilidade
          pointHitRadius: 35, // Aumentado para melhor interação
          pointBackgroundColor: pointColorWithOpacity, // Aplicar opacidade aos pontos também
          pointBorderColor: '#fff',
          pointBorderWidth: 4, // Aumentado para melhor visibilidade
          pointHoverBackgroundColor: config.pointColor,
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 6,
          pointStyle: 'circle' as const,
          borderWidth: borderWidth, // Largura variável para cada linha
          borderDash: dashPatterns[index] || [], // Padrão de linha diferente para cada dataset
          fill: false, // Não preencher para não esconder outras linhas
          spanGaps: false, // Não conectar gaps - mostrar gaps como null
          showLine: true, // SEMPRE mostrar a linha, mesmo com valores zero
          hidden: false, // Garantir que o dataset não esteja escondido
          order: order, // Ordem diferente para cada dataset
          z: index, // Z-index para controle de sobreposição
          stack: undefined, // Não usar stack para evitar sobreposição
          // Adicionar propriedades para garantir renderização
          stepped: false,
          segment: {
            borderColor: (ctx: any) => {
              if (!ctx.p0 || !ctx.p1) return borderColorWithOpacity;
              const value0 = ctx.p0.parsed.y;
              const value1 = ctx.p1.parsed.y;
              
              // Para UTR, usar cores baseadas no valor
              if (config.useUtrData) {
                const avg = (value0 + value1) / 2;
                if (avg >= 1) return 'rgba(34, 197, 94, 1)'; // Verde para UTR >= 1
                if (avg >= 0.5) return 'rgba(251, 191, 36, 1)'; // Amarelo para UTR >= 0.5
                return 'rgba(239, 68, 68, 1)'; // Vermelho para UTR < 0.5
              }
              return borderColorWithOpacity;
            },
            borderWidth: borderWidth,
            borderDash: dashPatterns[index] || [],
          },
        };
      });

      // LOG FORÇADO - sempre mostrar
      if (FORCE_LOGS) {
        console.log('🔍 [EVOLUÇÃO] ChartData criado:', {
          labelsCount: chartBaseLabels.length,
          datasetsCount: datasets.length,
          datasetsLabels: datasets.map(d => d.label),
          selectedMetrics: Array.from(selectedMetrics),
          chartBaseLabels: chartBaseLabels.slice(0, 10), // Primeiros 10 labels
          datasetsDetails: datasets.map((d, idx) => ({
            index: idx,
            label: d.label,
            dataLength: d.data.length,
            nonNullCount: d.data.filter(v => v != null).length,
            nonZeroCount: d.data.filter(v => v != null && v !== 0).length,
            zeroCount: d.data.filter(v => v === 0).length,
            firstValues: d.data.slice(0, 10),
            lastValues: d.data.slice(-5),
            borderColor: d.borderColor,
            hasData: d.data.some(v => v != null && v !== 0),
            hasAnyData: d.data.some(v => v != null),
            minValue: d.data.filter(v => v != null).length > 0 ? Math.min(...d.data.filter(v => v != null) as number[]) : null,
            maxValue: d.data.filter(v => v != null).length > 0 ? Math.max(...d.data.filter(v => v != null) as number[]) : null,
            showLine: d.showLine,
            hidden: d.hidden,
            fill: d.fill,
            order: d.order,
            z: d.z,
            type: d.type
          })),
          fullDatasets: datasets // Log completo dos datasets para debug
        });
        
        // Log adicional para verificar se há dados válidos
        datasets.forEach((d, idx) => {
          const validData = d.data.filter(v => v != null && v !== 0);
          if (validData.length === 0) {
            console.warn(`⚠️ [EVOLUÇÃO] Dataset ${d.label} (índice ${idx}) não tem dados não-zero!`, {
              total: d.data.length,
              nulls: d.data.filter(v => v == null).length,
              zeros: d.data.filter(v => v === 0).length,
              sample: d.data.slice(0, 10)
            });
          } else {
            console.log(`✅ [EVOLUÇÃO] Dataset ${d.label} (índice ${idx}) tem ${validData.length} valores não-zero`);
          }
        });
      }

      return {
        labels: chartBaseLabels,
        datasets,
      };
    } catch (error) {
      if (IS_DEV) console.error('Erro ao criar chartData:', error);
      return {
        labels: [],
        datasets: [],
  };
    }
  }, [selectedMetrics, getMetricConfig, isSemanal, baseLabels, dadosAtivos.length, dadosUtrAtivos.length]); // baseLabels é necessário pois é usado diretamente no retorno

  // Calcular min e max dos dados para ajustar a escala do eixo Y
  const yAxisRange = useMemo(() => {
    if (!chartData || !chartData.datasets || chartData.datasets.length === 0) {
      return { min: undefined, max: undefined };
    }

    // Coletar todos os valores válidos de todos os datasets
    // IMPORTANTE: Incluir valores zero também, pois são válidos
    const allValues: number[] = [];
    chartData.datasets.forEach(dataset => {
      if (dataset.data && Array.isArray(dataset.data)) {
        dataset.data.forEach((value: any) => {
          // Filtrar apenas valores numéricos válidos e finitos (incluindo 0)
          if (value != null && typeof value === 'number' && !isNaN(value) && isFinite(value)) {
            allValues.push(value);
          }
        });
      }
    });

    if (allValues.length === 0) {
      return { min: undefined, max: undefined };
    }

    // Ordenar valores para análise
    const sortedValues = [...allValues].sort((a, b) => a - b);
    
    const minValue = Math.min(...sortedValues);
    const maxValue = Math.max(...sortedValues);

    // Se todos os valores forem zero, definir um range mínimo para visualização
    if (maxValue === 0 && minValue === 0) {
      const result = {
        min: 0,
        max: 10 // Range mínimo para visualizar a linha em zero
      };
      if (IS_DEV) console.log('Y-axis range (todos valores zero):', result);
      return result;
    }

    // Se a diferença for muito pequena (menos de 1% do valor máximo), criar uma faixa ao redor
    if (maxValue - minValue < maxValue * 0.01 && maxValue > 0) {
      const padding = Math.max(maxValue * 0.1, 1); // Mínimo de 1 para valores pequenos
      const result = {
        min: Math.max(0, minValue - padding),
        max: maxValue + padding
      };
      if (IS_DEV) console.log('Y-axis range (valores muito próximos):', result, 'valores:', { minValue, maxValue });
      return result;
    }

    // Adicionar padding de 8% acima e abaixo para melhor visualização
    const range = maxValue - minValue;
    const padding = Math.max(range * 0.08, maxValue * 0.05); // Garantir padding mínimo

    const result = {
      min: Math.max(0, minValue - padding),
      max: maxValue + padding
    };
    
    if (IS_DEV) {
      console.log('Y-axis range calculado:', result);
      console.log('Estatísticas:', { 
        min: minValue, 
        max: maxValue,
        totalValues: allValues.length,
        zeros: allValues.filter(v => v === 0).length,
        nonZeros: allValues.filter(v => v !== 0).length,
        firstValues: chartData.datasets[0]?.data?.slice(0, 10)
      });
    }

    return result;
  }, [chartData, dadosAtivos.length, dadosUtrAtivos.length]);

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
    onHover: (event: any, activeElements: any[]) => {
      // Garantir que todas as linhas sejam destacadas no hover
      if (activeElements && activeElements.length > 0) {
        event.native.target.style.cursor = 'pointer';
      } else {
        event.native.target.style.cursor = 'default';
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'center' as const,
        display: true, // Sempre mostrar legenda
        labels: {
          font: {
            size: 14,
            weight: 'bold' as const,
            family: "'Inter', 'system-ui', sans-serif",
          },
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 14,
          boxHeight: 14,
          color: isDarkMode ? 'rgb(226, 232, 240)' : 'rgb(51, 65, 85)',
          generateLabels: (chart: any) => {
            const datasets = chart.data.datasets;
            return datasets.map((dataset: any, i: number) => ({
              text: dataset.label,
              fillStyle: dataset.borderColor || dataset.backgroundColor || 'rgb(59, 130, 246)',
              strokeStyle: dataset.borderColor || 'rgb(59, 130, 246)',
              lineWidth: dataset.borderWidth || 3,
              hidden: dataset.hidden || !chart.isDatasetVisible(i),
              index: i,
              pointStyle: 'circle',
              fontColor: isDarkMode ? 'rgb(226, 232, 240)' : 'rgb(51, 65, 85)',
            }));
          },
          onClick: (e: any, legendItem: any, legend: any) => {
            const index = legendItem.datasetIndex;
            const chart = legend.chart;
            const meta = chart.getDatasetMeta(index);
            
            // Toggle visibility
            meta.hidden = meta.hidden === null ? !chart.data.datasets[index].hidden : null;
            chart.update();
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
        beginAtZero: true, // Começar em zero para melhor visualização de valores pequenos (incluindo 0)
        ...(yAxisRange.min !== undefined && yAxisRange.min >= 0 && { 
          min: Math.max(0, yAxisRange.min - (yAxisRange.max || 0) * 0.05) // Adicionar pequeno padding abaixo
        }),
        ...(yAxisRange.max !== undefined && { 
          max: yAxisRange.max + (yAxisRange.max * 0.05) // Adicionar padding acima
        }),
        grace: '5%', // Adicionar pequeno grace para melhor visualização
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
          maxTicksLimit: isSemanal ? 60 : 12, // Aumentado para 60 semanas para mostrar mais dados
          autoSkip: false, // Sempre desabilitar autoSkip para mostrar todos os labels
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
  }), [isSemanal, isDarkMode, selectedMetrics, yAxisRange]);

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
                {/* Aviso quando métricas têm valores idênticos */}
                {(() => {
                  const datasets = chartData?.datasets || [];
                  const identicalMetrics: string[] = [];
                  
                  for (let i = 0; i < datasets.length; i++) {
                    for (let j = i + 1; j < datasets.length; j++) {
                      const d1 = datasets[i];
                      const d2 = datasets[j];
                      const values1 = d1.data.filter(v => v != null);
                      const values2 = d2.data.filter(v => v != null);
                      
                      if (values1.length === values2.length && values1.length > 0) {
                        const allEqual = values1.every((v, idx) => v === values2[idx]);
                        if (allEqual && !identicalMetrics.includes(d1.label) && !identicalMetrics.includes(d2.label)) {
                          identicalMetrics.push(d1.label, d2.label);
                        }
                      }
                    }
                  }
                  
                  if (identicalMetrics.length > 0) {
                    return (
                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/50 p-2 dark:border-amber-800 dark:bg-amber-950/20">
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          <span className="font-semibold">ℹ️ Nota:</span> Algumas métricas têm valores idênticos e podem aparecer sobrepostas no gráfico. 
                          Use a legenda para destacar cada métrica individualmente.
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
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
                      // LOG antes de renderizar
                      if (FORCE_LOGS) {
                        console.log('🔍 [EVOLUÇÃO] Renderizando gráfico:', {
                          labelsCount: chartData.labels.length,
                          datasetsCount: chartData.datasets.length,
                          datasetsInfo: chartData.datasets.map((d, idx) => ({
                            index: idx,
                            label: d.label,
                            dataLength: d.data.length,
                            hasData: d.data.some(v => v != null),
                            firstValues: d.data.slice(0, 5),
                            borderColor: d.borderColor,
                            borderWidth: d.borderWidth,
                            borderDash: d.borderDash,
                            pointRadius: d.pointRadius,
                            showLine: d.showLine,
                            hidden: d.hidden,
                            order: d.order,
                            z: d.z
                          }))
                        });
                        
                        // Verificar se há valores idênticos entre datasets
                        const datasets = chartData.datasets;
                        for (let i = 0; i < datasets.length; i++) {
                          for (let j = i + 1; j < datasets.length; j++) {
                            const d1 = datasets[i];
                            const d2 = datasets[j];
                            const values1 = d1.data.filter(v => v != null);
                            const values2 = d2.data.filter(v => v != null);
                            
                            if (values1.length === values2.length && values1.length > 0) {
                              const allEqual = values1.every((v, idx) => v === values2[idx]);
                              if (allEqual) {
                                console.warn(`⚠️ [EVOLUÇÃO] ${d1.label} e ${d2.label} têm valores idênticos!`, {
                                  valores: values1.slice(0, 5),
                                  issoPodeSerNormal: 'Se todas as corridas ofertadas foram aceitas e completadas'
                                });
                              }
                            }
                          }
                        }
                      }
                      
                      return (
                        <Line 
                          data={chartData} 
                          options={chartOptions}
                          redraw={true}
                          updateMode="resize"
                        />
                      );
                    } catch (error: any) {
                      console.error('❌ [EVOLUÇÃO] Erro ao renderizar gráfico:', error);
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
                  <div className="relative z-10 flex h-[500px] items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                        <span className="text-4xl">📊</span>
                      </div>
                      <p className="text-xl font-bold text-slate-600 dark:text-slate-300">
                        Nenhum dado disponível para {anoSelecionado}
                      </p>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Selecione outro ano para visualizar os dados
                      </p>
                    </div>
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
